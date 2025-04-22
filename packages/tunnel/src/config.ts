import { readFileSync } from 'node:fs';
import { findUp } from 'find-up';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

const CONFIG_FILES = [
  'unhook.config.yml',
  'unhook.config.js',
  'unhook.config.cjs',
  'unhook.config.ts',
  'unhook.config.json',
  'unhook.config.yaml',
  'unhook.config.yml',
];

const headerSchema = z.object({
  type: z.literal('header'),
  key: z.string(),
  value: z.string(),
});

const remotePatternSchema = z.object({
  protocol: z.enum(['http', 'https']).optional(),
  hostname: z.string(),
  port: z.string().optional(),
  pathname: z.string().optional(),
  search: z.string().optional(),
});

export const configSchema = z.object({
  tunnelId: z.string(),
  clientId: z.string().optional(),
  debug: z.boolean().default(false).optional(),
  telemetry: z.boolean().default(true).optional(),
  from: z
    .array(
      z.object({
        name: z.string(),
        agent: headerSchema.optional(),
        timestamp: headerSchema.optional(),
        verification: headerSchema.optional(),
        secret: z.string().optional(),
        defaultTimeout: z.number().default(18000).optional(),
      }),
    )
    .optional(),
  forward: z.array(
    z.object({
      from: z.string().default('*').optional(),
      to: z.union([z.instanceof(URL), z.string().url(), remotePatternSchema]),
      ping: z
        .union([
          z.instanceof(URL),
          z.string().url(),
          remotePatternSchema,
          z.boolean(),
        ])
        .default(true)
        .optional(),
    }),
  ),
});

export type TunnelConfig = z.infer<typeof configSchema>;

async function loadJsConfig(configPath: string): Promise<TunnelConfig> {
  const config = await import(configPath);
  return config.default ?? config;
}

function loadJsonConfig(configPath: string): TunnelConfig {
  const content = readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
}

function loadYamlConfig(configPath: string): TunnelConfig {
  const content = readFileSync(configPath, 'utf-8');
  return parseYaml(content);
}

export async function loadConfig(cwd = process.cwd()): Promise<TunnelConfig> {
  // Find the first matching config file
  const configPath = await findUp(CONFIG_FILES, { cwd });

  let config = {
    tunnelId: '',
    forward: [] as Array<z.infer<typeof configSchema>['forward'][number]>,
  };

  if (configPath) {
    try {
      if (
        configPath.endsWith('.js') ||
        configPath.endsWith('.cjs') ||
        configPath.endsWith('.ts')
      ) {
        config = await loadJsConfig(configPath);
      } else if (configPath.endsWith('.json')) {
        config = loadJsonConfig(configPath);
      } else if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
        config = loadYamlConfig(configPath);
      } else {
        // Assume JSON for .unhook
        config = loadJsonConfig(configPath);
      }

      // Validate the config
      config = configSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid config in ${configPath}: ${error.message}`);
      }
      throw new Error(`Failed to load config from ${configPath}: ${error}`);
    }
  }

  return config;
}
