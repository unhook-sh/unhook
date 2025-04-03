import { readFileSync } from 'node:fs';
import { findUp } from 'find-up';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

const CONFIG_FILES = [
  '.tunnelrc',
  '.tunnelrc.json',
  '.tunnelrc.yaml',
  '.tunnelrc.yml',
  '.tunnelrc.js',
  '.tunnelrc.cjs',
  'tunnel.config.js',
  'tunnel.config.cjs',
  'tunnel.config.json',
  'tunnel.config.yaml',
  'tunnel.config.yml',
];

const configSchema = z.object({
  port: z.number().min(1).max(65535).optional(),
  apiKey: z.string().optional(),
  clientId: z.string().optional(),
  debug: z.boolean().optional(),
});

export type TunnelConfig = z.infer<typeof configSchema>;

function loadEnvVars(): Partial<TunnelConfig> {
  const config: Partial<TunnelConfig> = {};

  // PORT
  const port = process.env.TUNNEL_PORT;
  if (port) {
    const parsedPort = Number.parseInt(port, 10);
    if (!Number.isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
      config.port = parsedPort;
    }
  }

  // API_KEY
  if (process.env.TUNNEL_API_KEY) {
    config.apiKey = process.env.TUNNEL_API_KEY;
  }

  // CLIENT_ID
  if (process.env.TUNNEL_CLIENT_ID) {
    config.clientId = process.env.TUNNEL_CLIENT_ID;
  }

  // DEBUG
  const debug = process.env.TUNNEL_DEBUG?.toLowerCase();
  if (debug === 'true' || debug === '1' || debug === 'yes') {
    config.debug = true;
  } else if (debug === 'false' || debug === '0' || debug === 'no') {
    config.debug = false;
  }

  return config;
}

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
  // Load environment variables first
  const envConfig = loadEnvVars();

  // Find the first matching config file
  const configPath = await findUp(CONFIG_FILES, { cwd });

  let fileConfig: TunnelConfig = {};
  if (configPath) {
    try {
      if (configPath.endsWith('.js') || configPath.endsWith('.cjs')) {
        fileConfig = await loadJsConfig(configPath);
      } else if (configPath.endsWith('.json')) {
        fileConfig = loadJsonConfig(configPath);
      } else if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
        fileConfig = loadYamlConfig(configPath);
      } else {
        // Assume JSON for .tunnelrc
        fileConfig = loadJsonConfig(configPath);
      }

      // Validate the config
      fileConfig = configSchema.parse(fileConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid config in ${configPath}: ${error.message}`);
      }
      throw new Error(`Failed to load config from ${configPath}: ${error}`);
    }
  }

  // Merge configs with environment variables taking precedence
  return {
    ...fileConfig,
    ...envConfig,
  };
}
