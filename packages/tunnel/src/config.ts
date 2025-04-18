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

// Base schema defines the shape without the cross-field validation
const baseConfigSchema = z.object({
  port: z.number().min(1).max(65535).optional(),
  tunnelId: z.string().optional(),
  clientId: z.string().optional(),
  debug: z.boolean().optional(),
  redirect: z.string().url().optional(),
  telemetry: z.boolean().optional(),
  ping: z
    .union([z.boolean(), z.string().url(), z.number().min(1).max(65535)])
    .optional(),
});

// Refined schema enforces the mutual exclusion of port and redirect
const configSchema = baseConfigSchema.refine(
  (data) => {
    const portProvided = data.port !== undefined;
    const redirectProvided = data.redirect !== undefined;
    // Valid if exactly one is provided
    return (
      (portProvided && !redirectProvided) || (!portProvided && redirectProvided)
    );
  },
  {
    // Custom error message if validation fails
    message:
      'Configuration error: Either "port" or "redirect" must be provided, but not both.',
    // Indicate which fields are involved for better error context (optional)
    path: ['port', 'redirect'],
  },
);

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

  // TUNNEL_ID
  if (process.env.TUNNEL_ID) {
    config.tunnelId = process.env.TUNNEL_ID;
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

  // REDIRECT
  if (process.env.TUNNEL_REDIRECT) {
    try {
      // Validate if it's a URL, though schema validation will catch it later
      new URL(process.env.TUNNEL_REDIRECT);
      config.redirect = process.env.TUNNEL_REDIRECT;
    } catch {
      // Ignore invalid URL from env var, let schema validation handle it
    }
  }

  // PING
  const pingEnv = process.env.TUNNEL_PING;
  if (pingEnv) {
    const pingLower = pingEnv.toLowerCase();
    if (pingLower === 'true' || pingLower === '1' || pingLower === 'yes') {
      config.ping = true;
    } else if (
      pingLower === 'false' ||
      pingLower === '0' ||
      pingLower === 'no'
    ) {
      config.ping = false;
    } else {
      // Try parsing as number (port)
      const parsedPort = Number.parseInt(pingEnv, 10);
      if (!Number.isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
        config.ping = parsedPort;
      } else {
        // Try parsing as URL
        try {
          new URL(pingEnv);
          config.ping = pingEnv;
        } catch {
          // Ignore invalid value from env var, let schema validation handle it
        }
      }
    }
  }

  // TELEMETRY
  const telemetry = process.env.TUNNEL_TELEMETRY?.toLowerCase();
  if (telemetry === 'true' || telemetry === '1' || telemetry === 'yes') {
    config.telemetry = true;
  } else if (telemetry === 'false' || telemetry === '0' || telemetry === 'no') {
    config.telemetry = false;
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
      if (
        configPath.endsWith('.js') ||
        configPath.endsWith('.cjs') ||
        configPath.endsWith('.ts')
      ) {
        fileConfig = await loadJsConfig(configPath);
      } else if (configPath.endsWith('.json')) {
        fileConfig = loadJsonConfig(configPath);
      } else if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
        fileConfig = loadYamlConfig(configPath);
      } else {
        // Assume JSON for .unhook
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
  const mergedConfig = {
    ...fileConfig,
    ...envConfig,
  };

  return {
    ping: true, // Default ping to true
    telemetry: true, // Default telemetry to true
    ...mergedConfig,
  };
}
