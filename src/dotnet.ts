import { exec } from '@actions/exec'

export async function version() {
  var result = '';

  await exec('dotnet', ['--version'], {
    silent: true,
    listeners: {
      stdout: buffer => {
        result += buffer.toString();
      }
    }
  });

  return result.trim();
}

export interface RestoreOptions {
  packages?: string;
}

export async function restore(project: string, options: RestoreOptions = {}) {
  const args = ['restore', project];

  if (options.packages) {
    args.push('--packages', options.packages);
  }

  await exec('dotnet', args);
}

export interface BuildOptions {
  configuration?: string;
}

export async function build(project: string, options: BuildOptions) {
  const args = ['build', project];

  args.push('--nologo');
  args.push('--no-restore');

  if (options.configuration) {
    args.push('--configuration', options.configuration);
  }

  await exec('dotnet', args);
}

export interface TestOptions {
  configuration?: string;
  logger?: string;
  resultsDirectory?: string;
}

export async function test(project: string, options: TestOptions) {
  const args = ['test', project];

  args.push('--nologo');
  args.push('--no-build');

  if (options.configuration) {
    args.push('--configuration', options.configuration);
  }

  if (options.logger) {
    args.push('--logger', options.logger);
  }

  if (options.resultsDirectory) {
    args.push('--results-directory', options.resultsDirectory);
  }

  await exec('dotnet', args);
}

export interface PublishOptions {
  configuration?: string;
  output?: string;
}

export async function publish(project: string, options: PublishOptions) {
  const args = ['publish', project];

  args.push('--nologo');
  args.push('--no-build');

  if (options.configuration) {
    args.push('--configuration', options.configuration);
  }

  if (options.output) {
    args.push('--output', options.output);
  }

  await exec('dotnet', args);
}

export interface PackOptions {
  configuration?: string;
  output?: string;
  includeSymbols?: boolean
}

export async function pack(project: string, options: PackOptions) {
  const args = ['pack', project];

  args.push('--nologo');
  args.push('--no-build');

  if (options.configuration) {
    args.push('--configuration', options.configuration);
  }

  if (options.output) {
    args.push('--output', options.output);
  }

  if (options.includeSymbols) {
    args.push('/property:IncludeSymbols=true');
    args.push('/property:SymbolPackageFormat=snupkg');
  }

  await exec('dotnet', args);
}
