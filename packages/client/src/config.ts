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
  'unhook.yml',
  'unhook.js',
  'unhook.cjs',
  'unhook.ts',
  'unhook.json',
  'unhook.yaml',
  'unhook.yml',
];

const remotePatternSchema = z.object({
  hostname: z.string(),
  pathname: z.string().optional(),
  port: z.string().optional(),
  protocol: z.enum(['http', 'https']).optional(),
  search: z.string().optional(),
});

export type RemotePatternSchema = z.infer<typeof remotePatternSchema>;

// ---------------------------------------------------------------------------
// Current (v2) config schema – flat delivery array
// ---------------------------------------------------------------------------

export const configSchema = z.object({
  clientId: z.string().optional(),
  debug: z.boolean().default(false).optional(),
  delivery: z.array(
    z.object({
      destination: z.union([
        z.instanceof(URL),
        z.string().url(),
        remotePatternSchema,
      ]),
      eventTypeField: z.string().optional(),
      name: z.string().optional(),
      ping: z
        .union([
          z.instanceof(URL),
          z.string().url(),
          remotePatternSchema,
          z.boolean(),
        ])
        .default(true)
        .optional(),
      source: z.string().default('*').optional(),
    }),
  ),
  server: z
    .object({
      apiUrl: z.string().url().optional(),
      dashboardUrl: z.string().url().optional(),
    })
    .optional(),
  telemetry: z.boolean().default(true).optional(),
  version: z.string().optional(),
  webhookUrl: z.string(),
});

// ---------------------------------------------------------------------------
// Legacy (v1) config schema – separate source[], destination[], delivery[]
// Used only for backwards-compatible loading; not exported.
// ---------------------------------------------------------------------------

const headerSchema = z.object({
  key: z.string(),
  type: z.literal('header'),
  value: z.string(),
});

const legacyDeliverySchema = z.object({
  destination: z.string(),
  source: z.string().default('*').optional(),
});

const legacyDestinationSchema = z.object({
  name: z.string(),
  ping: z
    .union([
      z.instanceof(URL),
      z.string().url(),
      remotePatternSchema,
      z.boolean(),
    ])
    .default(true)
    .optional(),
  url: z.union([z.instanceof(URL), z.string().url(), remotePatternSchema]),
});

const legacySourceSchema = z.object({
  agent: headerSchema.optional(),
  defaultTimeout: z.number().default(18000).optional(),
  name: z.string(),
  secret: z.string().optional(),
  timestamp: headerSchema.optional(),
  verification: headerSchema.optional(),
});

const legacyConfigSchema = z.object({
  clientId: z.string().optional(),
  debug: z.boolean().default(false).optional(),
  delivery: z.array(legacyDeliverySchema),
  destination: z.array(legacyDestinationSchema),
  server: z
    .object({
      apiUrl: z.string().url().optional(),
      dashboardUrl: z.string().url().optional(),
    })
    .optional(),
  source: z.array(legacySourceSchema).optional(),
  telemetry: z.boolean().default(true).optional(),
  version: z.string().optional(),
  webhookUrl: z.string(),
});

type LegacyConfig = z.infer<typeof legacyConfigSchema>;

// ---------------------------------------------------------------------------
// Migration helper – converts a validated legacy config into the v2 shape
// ---------------------------------------------------------------------------

function migrateV1Config(legacy: LegacyConfig): WebhookConfig {
  const flatDelivery = legacy.delivery.map((rule) => {
    const dest = legacy.destination.find((d) => d.name === rule.destination);
    return {
      destination: dest?.url ?? rule.destination,
      name: dest?.name,
      ping: dest?.ping,
      source: rule.source ?? '*',
    };
  });

  return {
    clientId: legacy.clientId,
    debug: legacy.debug,
    delivery: flatDelivery,
    server: legacy.server,
    telemetry: legacy.telemetry,
    version: legacy.version,
    webhookUrl: legacy.webhookUrl,
  } as WebhookConfig;
}

// ---------------------------------------------------------------------------
// Detection helper – returns true when the raw object looks like a v1 config
// (has a `destination` key that is an array of objects with a `name` property)
// ---------------------------------------------------------------------------

function isLegacyConfig(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  return (
    Array.isArray(obj.destination) &&
    obj.destination.length > 0 &&
    typeof obj.destination[0] === 'object' &&
    obj.destination[0] !== null &&
    'name' in obj.destination[0]
  );
}

export type WebhookDelivery = z.infer<typeof configSchema>['delivery'][number];

export type WebhookConfig = z.infer<typeof configSchema>;

/**
 * Derive a stable name for a delivery rule.
 * Uses the explicit `name` if provided, otherwise the `source` value.
 */
export function getDeliveryName(delivery: WebhookDelivery): string {
  if (delivery.name) return delivery.name;
  return delivery.source ?? '*';
}

/**
 * Converts a delivery destination (string, URL, or RemotePatternSchema) to a URL string.
 */
export function getDeliveryUrl(
  destination: string | URL | RemotePatternSchema,
): string {
  if (typeof destination === 'string') return destination;
  if (typeof URL !== 'undefined' && destination instanceof URL)
    return destination.toString();
  if (
    typeof destination === 'object' &&
    destination !== null &&
    'hostname' in destination &&
    typeof (destination as RemotePatternSchema).hostname === 'string'
  ) {
    const {
      protocol = 'http',
      hostname,
      port,
      pathname = '',
      search = '',
    } = destination as RemotePatternSchema;
    return `${protocol}://${hostname}${port ? `:${port}` : ''}${pathname}${search}`;
  }
  return '';
}

async function loadJsConfig(configPath: string): Promise<unknown> {
  const config = await import(configPath);
  return config.default ?? config;
}

function loadJsonConfig(configPath: string): unknown {
  const content = readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
}

function loadYamlConfig(configPath: string): unknown {
  const content = readFileSync(configPath, 'utf-8');
  return parseYaml(content);
}

export async function findUpConfig(
  props: { cwd?: string } = {},
): Promise<string | null> {
  const cwd = props.cwd ?? process.cwd();
  const configPath = (await findUp(CONFIG_FILES, { cwd })) ?? null;
  return configPath;
}

export async function loadConfig(configPath: string): Promise<WebhookConfig> {
  let config: WebhookConfig = {
    delivery: [],
    webhookUrl: '',
  };

  if (configPath) {
    try {
      let raw: unknown;

      if (
        configPath.endsWith('.js') ||
        configPath.endsWith('.cjs') ||
        configPath.endsWith('.ts')
      ) {
        raw = await loadJsConfig(configPath);
      } else if (configPath.endsWith('.json')) {
        raw = loadJsonConfig(configPath);
      } else if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
        raw = loadYamlConfig(configPath);
      } else {
        // Assume JSON for .unhook
        raw = loadJsonConfig(configPath);
      }

      config = parseConfig(raw, configPath);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid config in ${configPath}: ${error.message}`);
      }
      throw new Error(`Failed to load config from ${configPath}: ${error}`);
    }
  }

  return config;
}

/**
 * Parse a raw config object, automatically detecting and migrating the legacy
 * (v1) format when necessary. Tries the modern schema first; on failure falls
 * back to the legacy schema + migration. If both fail, throws the modern
 * schema error for the best developer experience.
 */
function parseConfig(raw: unknown, configPath?: string): WebhookConfig {
  // Fast-path: try modern schema first
  const modernResult = configSchema.safeParse(raw);
  if (modernResult.success) {
    return modernResult.data;
  }

  // Detect legacy shape and attempt migration
  if (isLegacyConfig(raw)) {
    const legacyResult = legacyConfigSchema.safeParse(raw);
    if (legacyResult.success) {
      const location = configPath ? ` at ${configPath}` : '';
      console.warn(
        `[unhook] Config${location} uses the legacy format (separate destination/delivery arrays). ` +
          'This still works but is deprecated. See https://unhook.sh/docs/config for the new format.',
      );
      return migrateV1Config(legacyResult.data);
    }
  }

  // Neither parsed — throw the modern schema error for best DX
  throw new Error(
    `Invalid config${configPath ? ` in ${configPath}` : ''}: ${modernResult.error.message}`,
  );
}

/**
 * Type-safe helper for defining webhook configs. Accepts both the modern (v2)
 * format and the legacy (v1) format with separate `destination[]` / `delivery[]`
 * arrays. Legacy configs are automatically migrated to the v2 shape at runtime.
 */
export function defineWebhookConfig(config: unknown): WebhookConfig {
  // Legacy shape: has destination[] array of {name, url} objects
  if (isLegacyConfig(config)) {
    const legacy = legacyConfigSchema.parse(config);
    return migrateV1Config(legacy);
  }
  return configSchema.parse(config);
}
