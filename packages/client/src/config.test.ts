import { describe, expect, it, spyOn } from 'bun:test';
import { configSchema, defineWebhookConfig, loadConfig } from './config';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A minimal modern (v2) config with a flat delivery array. */
const modernConfig = {
  delivery: [
    {
      destination: 'http://localhost:3000/api/webhooks',
      eventTypeField: 'resourceType',
      name: 'my-app',
      source: 'clerk',
    },
  ],
  webhookUrl: 'https://unhook.sh/wh_123',
};

/** A minimal legacy (v1) config with separate destination[]/delivery[] arrays. */
const legacyConfig = {
  delivery: [
    {
      destination: 'my-app',
      source: 'clerk',
    },
  ],
  destination: [
    {
      name: 'my-app',
      url: 'http://localhost:3000/api/webhooks',
    },
  ],
  webhookUrl: 'https://unhook.sh/wh_123',
};

/** A legacy config with all optional fields populated. */
const legacyConfigFull = {
  clientId: 'dev-machine-1',
  debug: true,
  delivery: [
    { destination: 'app-a', source: 'stripe' },
    { destination: 'app-b', source: '*' },
  ],
  destination: [
    {
      name: 'app-a',
      ping: true,
      url: 'http://localhost:3000/webhooks',
    },
    {
      name: 'app-b',
      ping: false,
      url: 'http://localhost:4000/hooks',
    },
  ],
  server: {
    apiUrl: 'https://api.unhook.sh',
    dashboardUrl: 'https://app.unhook.sh',
  },
  source: [
    {
      name: 'stripe',
      secret: 'whsec_test123',
    },
  ],
  telemetry: false,
  version: '1',
  webhookUrl: 'https://unhook.sh/wh_456',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('configSchema (v2)', () => {
  it('parses a valid modern config', () => {
    const result = configSchema.safeParse(modernConfig);
    expect(result.success).toBe(true);
  });

  it('rejects a config missing webhookUrl', () => {
    const result = configSchema.safeParse({ delivery: [] });
    expect(result.success).toBe(false);
  });
});

describe('defineWebhookConfig', () => {
  describe('modern (v2) configs', () => {
    it('passes through a valid modern config', () => {
      const result = defineWebhookConfig(modernConfig);
      expect(result.delivery).toHaveLength(1);
      expect(result.delivery[0]?.destination).toBe(
        'http://localhost:3000/api/webhooks',
      );
      expect(result.delivery[0]?.eventTypeField).toBe('resourceType');
      expect(result.delivery[0]?.name).toBe('my-app');
      expect(result.delivery[0]?.source).toBe('clerk');
      expect(result.webhookUrl).toBe('https://unhook.sh/wh_123');
    });
  });

  describe('legacy (v1) configs', () => {
    it('migrates a minimal legacy config to v2 format', () => {
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});

      const result = defineWebhookConfig(legacyConfig);

      expect(result.delivery).toHaveLength(1);
      expect(result.delivery[0]?.destination).toBe(
        'http://localhost:3000/api/webhooks',
      );
      expect(result.delivery[0]?.name).toBe('my-app');
      expect(result.delivery[0]?.source).toBe('clerk');
      expect(result.webhookUrl).toBe('https://unhook.sh/wh_123');

      warnSpy.mockRestore();
    });

    it('migrates a fully-populated legacy config', () => {
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});

      const result = defineWebhookConfig(legacyConfigFull);

      expect(result.delivery).toHaveLength(2);

      // First delivery rule
      expect(result.delivery[0]?.destination).toBe(
        'http://localhost:3000/webhooks',
      );
      expect(result.delivery[0]?.name).toBe('app-a');
      expect(result.delivery[0]?.ping).toBe(true);
      expect(result.delivery[0]?.source).toBe('stripe');

      // Second delivery rule
      expect(result.delivery[1]?.destination).toBe(
        'http://localhost:4000/hooks',
      );
      expect(result.delivery[1]?.name).toBe('app-b');
      expect(result.delivery[1]?.ping).toBe(false);
      expect(result.delivery[1]?.source).toBe('*');

      // Top-level fields preserved
      expect(result.clientId).toBe('dev-machine-1');
      expect(result.debug).toBe(true);
      expect(result.telemetry).toBe(false);
      expect(result.version).toBe('1');
      expect(result.webhookUrl).toBe('https://unhook.sh/wh_456');
      expect(result.server).toEqual({
        apiUrl: 'https://api.unhook.sh',
        dashboardUrl: 'https://app.unhook.sh',
      });

      warnSpy.mockRestore();
    });

    it('resolves destination URLs from name references', () => {
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});

      const config = {
        delivery: [{ destination: 'backend' }],
        destination: [{ name: 'backend', url: 'http://localhost:8080/hooks' }],
        webhookUrl: 'https://unhook.sh/wh_789',
      };

      const result = defineWebhookConfig(config);
      expect(result.delivery[0]?.destination).toBe(
        'http://localhost:8080/hooks',
      );

      warnSpy.mockRestore();
    });

    it('falls back to raw destination string when name is not found', () => {
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});

      const config = {
        delivery: [{ destination: 'missing-dest' }],
        destination: [{ name: 'other', url: 'http://localhost:9000' }],
        webhookUrl: 'https://unhook.sh/wh_000',
      };

      const result = defineWebhookConfig(config);
      // When the name reference is not found, the raw string is used as destination
      expect(result.delivery[0]?.destination).toBe('missing-dest');

      warnSpy.mockRestore();
    });

    it('preserves ping settings from legacy destinations', () => {
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});

      const config = {
        delivery: [
          { destination: 'with-ping' },
          { destination: 'without-ping' },
        ],
        destination: [
          {
            name: 'with-ping',
            ping: 'http://localhost:3000/health',
            url: 'http://localhost:3000',
          },
          {
            name: 'without-ping',
            ping: false,
            url: 'http://localhost:4000',
          },
        ],
        webhookUrl: 'https://unhook.sh/wh_ping',
      };

      const result = defineWebhookConfig(config);
      expect(result.delivery[0]?.ping).toBe('http://localhost:3000/health');
      expect(result.delivery[1]?.ping).toBe(false);

      warnSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('throws for completely invalid config', () => {
      expect(() => defineWebhookConfig({ invalid: true })).toThrow();
    });

    it('throws for config missing required fields', () => {
      expect(() => defineWebhookConfig({ delivery: [] })).toThrow();
    });
  });
});

describe('loadConfig', () => {
  it('returns default config when configPath is empty', async () => {
    const result = await loadConfig('');
    expect(result).toEqual({ delivery: [], webhookUrl: '' });
  });
});
