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

export const configSchema = z
  .object({
    webhookId: z.string(),
    clientId: z.string().optional(),
    debug: z.boolean().default(false).optional(),
    telemetry: z.boolean().default(true).optional(),
    to: z.array(
      z.object({
        name: z.string(),
        url: z.union([
          z.instanceof(URL),
          z.string().url(),
          remotePatternSchema,
        ]),
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
    deliver: z.array(
      z.object({
        from: z.string().default('*').optional(),
        to: z.string(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    // Runtime validation: ensure all deliver.to values exist in to[].name
    if (data.to && data.deliver) {
      const validNames = new Set(data.to.map((t) => t.name));
      data.deliver.forEach((f, idx) => {
        if (!validNames.has(f.to)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid deliver.to: "${f.to}".\n- Allowed values: [${[...validNames].map((n) => `\"${n}\"`).join(', ')}]\n- Please ensure every 'deliver.to' matches a 'to[].name'.\nSee https://docs.unhook.sh/config for examples.`,
            path: ['deliver', idx, 'to'],
          });
        }
      });
    }
  });

export type WebhookDeliver = z.infer<typeof configSchema>['deliver'][number];
export type WebhookTo = NonNullable<z.infer<typeof configSchema>['to']>[number];
export type WebhookFrom = NonNullable<
  z.infer<typeof configSchema>['from']
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

export async function findUpConfig(): Promise<string | null> {
  const cwd = process.cwd();
  const configPath = (await findUp(CONFIG_FILES, { cwd })) ?? null;
  return configPath;
}

export async function loadConfig(configPath: string): Promise<WebhookConfig> {
  let config = {
    webhookId: '',
    to: [] as Array<z.infer<typeof configSchema>['to'][number]>,
    deliver: [] as Array<z.infer<typeof configSchema>['deliver'][number]>,
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
  D extends readonly { from?: string; to: T[number]['name'] }[],
  Rest extends Omit<WebhookConfig, 'to' | 'deliver'>,
>(config: { to: T; deliver: D } & Rest): { to: T; deliver: D } & Rest {
  return config;
}
