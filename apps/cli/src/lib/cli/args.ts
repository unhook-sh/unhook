import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import type { CliState } from '~/stores/cli-store';

export async function parseArgs({
  debug,
}: {
  debug?: boolean;
}): Promise<CliState> {
  const pkg = JSON.parse(
    readFileSync(join(__dirname, '../../../package.json'), 'utf-8'),
  ) as { version: string };

  const argv = await yargs(hideBin(process.argv))
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Enable debug logging',
      default: debug ?? false,
    })
    .usage('Usage: $0 [-d]')
    .help()
    .alias('help', 'h')
    .parseAsync();

  const parsedConfig = argv as unknown as CliState;
  parsedConfig.version = pkg.version;

  return {
    debug: parsedConfig.debug,
    version: parsedConfig.version,
  };
}
