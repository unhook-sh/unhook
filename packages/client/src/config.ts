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

const headerSchema = z.object({
  key: z.string(),
  type: z.literal('header'),
  value: z.string(),
});

const remotePatternSchema = z.object({
  hostname: z.string(),
  pathname: z.string().optional(),
  port: z.string().optional(),
  protocol: z.enum(['http', 'https']).optional(),
  search: z.string().optional(),
});

export type RemotePatternSchema = z.infer<typeof remotePatternSchema>;

export const configSchema = z
  .object({
    clientId: z.string().optional(),
    debug: z.boolean().default(false).optional(),
    delivery: z.array(
      z.object({
        destination: z.string(),
        source: z.string().default('*').optional(),
      }),
    ),
    destination: z.array(
      z.object({
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
        url: z.union([
          z.instanceof(URL),
          z.string().url(),
          remotePatternSchema,
        ]),
      }),
    ),
    server: z
      .object({
        apiUrl: z.string().url().optional(),
        dashboardUrl: z.string().url().optional(),
      })
      .optional(),
    source: z
      .array(
        z.object({
          agent: headerSchema.optional(),
          defaultTimeout: z.number().default(18000).optional(),
          name: z.string(),
          secret: z.string().optional(),
          timestamp: headerSchema.optional(),
          verification: headerSchema.optional(),
        }),
      )
      .optional(),
    telemetry: z.boolean().default(true).optional(),
    version: z.string().optional(),
    webhookId: z.string(),
  })
  .superRefine((data, ctx) => {
    // Runtime validation: ensure all delivery.destination values exist in destination[].name
    if (data.destination && data.delivery) {
      const validNames = new Set(data.destination.map((t) => t.name));
      data.delivery.forEach((f, idx) => {
        if (!validNames.has(f.destination)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid delivery.destination: "${
              f.destination
            }".\n- Allowed values: [${[...validNames]
              .map((n) => `"${n}"`)
              .join(
                ', ',
              )}]\n- Please ensure every 'delivery.destination' matches a 'destination[].name'.\nSee https://docs.unhook.sh/config for examples.`,
            path: ['delivery', idx, 'destination'],
          });
        }
      });
    }
  });

export type WebhookDelivery = z.infer<typeof configSchema>['delivery'][number];
export type WebhookDestination = NonNullable<
  z.infer<typeof configSchema>['destination']
>[number];
export type WebhookSource = NonNullable<
  z.infer<typeof configSchema>['source']
>[number];

export type WebhookConfig = z.infer<typeof configSchema>;

async function loadJsConfig(configPath: string): Promise<WebhookConfig> {
  const config = await import(configPath);
  return config.default ?? config;
}

function loadJsonConfig(configPath: string): WebhookConfig {
  const content = readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
}

function loadYamlConfig(configPath: string): WebhookConfig {
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
  let config = {
    delivery: [] as Array<z.infer<typeof configSchema>['delivery'][number]>,
    destination: [] as Array<
      z.infer<typeof configSchema>['destination'][number]
    >,
    webhookId: '',
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

export function defineWebhookConfig<
  T extends readonly { name: string }[],
  D extends readonly { source?: string; destination: T[number]['name'] }[],
  Rest extends Omit<WebhookConfig, 'destination' | 'delivery'>,
>(
  config: { destination: T; delivery: D } & Rest,
): { destination: T; delivery: D } & Rest {
  return config;
}
