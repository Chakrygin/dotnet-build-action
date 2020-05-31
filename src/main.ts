import * as core from '@actions/core'
import * as glob from '@actions/glob'

import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import * as dotnet from './dotnet'

async function main() {
  try {

    console.log();

    skipFirstTimeExperience();

    const solution = await findSolution();
    const projectsToUnitTesting = await findProjectsToUnitTesting();
    const projectsToIntegrationTesting = await findProjectsToIntegrationTesting();
    const projectsToPacking = await findProjectsToPacking();

    const configuration = core.getInput('CONFIGURATION');
    const includeSymbols = core.getInput('INCLUDE_SYMBOLS') == 'true';

    await core.group(`Restoring "${solution}"...`, async () => {
      await dotnet.restore(solution, {
        packages: 'packages'
      });
    });

    console.log();

    await core.group(`Building "${solution}"...`, async () => {
      await dotnet.build(solution, {
        configuration: configuration,
      });
    });

    console.log();

    for (const project of projectsToUnitTesting) {
      await core.group(`Testing "${project}"...`, async () => {
        await dotnet.test(project, {
          configuration: configuration,
          logger: 'trx',
          resultsDirectory: 'TestResults',
        });
      });

      console.log();
    }

    for (const project of projectsToIntegrationTesting) {
      const projectName = path.basename(project, '.csproj');
      await core.group(`Publishing "${project}"...`, async () => {
        await dotnet.publish(project, {
          configuration: configuration,
          output: path.join('artifacts/tests', projectName),
        });
      });

      console.log();
    }

    for (const project of projectsToPacking) {
      await core.group(`Packing "${project}"...`, async () => {
        await dotnet.pack(project, {
          configuration: configuration,
          output: 'artifacts',
          includeSymbols: includeSymbols
        });
      });

      console.log();
    }

  } catch (error) {
    core.setFailed(error);
  }
}

export async function skipFirstTimeExperience() {
  const version = await dotnet.version();
  const sentinelDir = path.join(os.homedir(), '.dotnet');
  const sentinelFile = path.join(sentinelDir, version + '.dotnetFirstUseSentinel');

  fs.mkdirSync(sentinelDir, { recursive: true });
  fs.writeFileSync(sentinelFile, '');
}

async function findSolution() {
  const patterns = core.getInput('SOLUTION');
  const solutions = await find(patterns);

  if (solutions.length == 0) {
    throw new Error('No solution to restoring and building found.');
  }

  const s = solutions.length > 1 ? 's' : '';
  core.info(`Solution${s} to restoring and building:`);

  for (const solution of solutions) {
    core.info(`    ${solution}`);
  }

  console.log();

  if (solutions.length > 1) {
    throw new Error('Multiple solutions to restoring and building found.');
  }

  return solutions[0];
}

async function findProjectsToUnitTesting() {
  const patterns = core.getInput('PROJECTS_TO_UNIT_TESTING');
  const projects = await find(patterns);

  if (projects.length > 0) {
    const s = projects.length > 1 ? 's' : '';
    core.info(`Project${s} to unit testing:`);

    for (const project of projects) {
      core.info(`    ${project}`);
    }

    console.log();
  }

  return projects;
}

async function findProjectsToIntegrationTesting() {
  const patterns = core.getInput('PROJECTS_TO_INTEGRATION_TESTING');
  const projects = await find(patterns);

  if (projects.length > 0) {
    const s = projects.length > 1 ? 's' : '';
    core.info(`Project${s} to integration testing:`);

    for (const project of projects) {
      core.info(`    ${project}`);
    }

    console.log();
  }

  return projects;
}

async function findProjectsToPacking() {
  const patterns = core.getInput('PROJECTS_TO_PACKING');
  const projects = await find(patterns);

  if (projects.length == 0) {
    throw new Error('No projects to packing found.');
  }

  const s = projects.length > 1 ? 's' : '';
  core.info(`Project${s} to packing:`);

  for (const project of projects) {
    core.info(`    ${project}`);
  }

  console.log();

  return projects;
}

async function find(patterns: string) {
  const globber = await glob.create(patterns);
  const files = await globber.glob();

  return files.map(file => {
    return path.relative(process.cwd(), file);
  });
}

main();
