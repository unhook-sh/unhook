import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '@unhook/api';
import { createCaller } from '@unhook/api';
import { createId } from '@unhook/id';
import { z } from 'zod';
import { trackError, trackToolUsage } from '../analytics';

// Provider templates for common webhook events
const providerTemplates = {
  clerk: {
    'organization.created': {
      body: {
        data: {
          created_at: Date.now(),
          created_by: 'user_1234567890',
          id: 'org_1234567890',
          max_allowed_memberships: 100,
          members_count: 1,
          name: 'Test Organization',
          object: 'organization',
          private_metadata: {},
          public_metadata: {},
          slug: 'test-org',
          updated_at: Date.now(),
        },
        object: 'event',
        type: 'organization.created',
      },
      headers: {
        'Content-Type': 'application/json',
        'svix-id': 'msg_1234567890',
        'svix-signature': 'v1=test_signature',
        'svix-timestamp': String(Date.now()),
        'User-Agent': 'Svix-Webhooks/1.0',
      },
    },
    'session.created': {
      body: {
        data: {
          abandon_at: Date.now() + 7 * 24 * 60 * 60 * 1000,
          client_id: 'client_1234567890',
          created_at: Date.now(),
          expire_at: Date.now() + 24 * 60 * 60 * 1000,
          id: 'sess_1234567890',
          last_active_at: Date.now(),
          object: 'session',
          status: 'active',
          updated_at: Date.now(),
          user_id: 'user_1234567890',
        },
        object: 'event',
        type: 'session.created',
      },
      headers: {
        'Content-Type': 'application/json',
        'svix-id': 'msg_1234567890',
        'svix-signature': 'v1=test_signature',
        'svix-timestamp': String(Date.now()),
        'User-Agent': 'Svix-Webhooks/1.0',
      },
    },
    'user.created': {
      body: {
        data: {
          created_at: Date.now(),
          email_addresses: [
            {
              email_address: 'test@example.com',
              id: 'email_1234567890',
              verification: {
                status: 'verified',
              },
            },
          ],
          first_name: 'Test',
          id: 'user_1234567890',
          image_url: 'https://example.com/avatar.png',
          last_name: 'User',
          object: 'user',
          primary_email_address_id: 'email_1234567890',
          updated_at: Date.now(),
        },
        object: 'event',
        type: 'user.created',
      },
      headers: {
        'Content-Type': 'application/json',
        'svix-id': 'msg_1234567890',
        'svix-signature': 'v1=test_signature',
        'svix-timestamp': String(Date.now()),
        'User-Agent': 'Svix-Webhooks/1.0',
      },
    },
  },
  custom: {
    generic: {
      body: {
        data: {
          message: 'This is a test webhook event',
          timestamp: new Date().toISOString(),
        },
        event: 'test.event',
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Webhook/1.0',
      },
    },
  },
  github: {
    issues: {
      body: {
        action: 'opened',
        issue: {
          assignees: [],
          body: 'This is a test issue',
          id: 123456789,
          labels: [],
          number: 1,
          state: 'open',
          title: 'Test Issue',
          user: {
            id: 123456789,
            login: 'test-user',
          },
        },
        repository: {
          full_name: 'test-user/test-repo',
          id: 123456789,
          name: 'test-repo',
        },
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GitHub-Hookshot/test',
        'X-GitHub-Delivery': 'test-delivery-id',
        'X-GitHub-Event': 'issues',
      },
    },
    pull_request: {
      body: {
        action: 'opened',
        number: 1,
        pull_request: {
          base: {
            ref: 'main',
            sha: '0987654321fedcba0987654321fedcba09876543',
          },
          body: 'This is a test pull request',
          head: {
            ref: 'feature-branch',
            sha: '1234567890abcdef1234567890abcdef12345678',
          },
          id: 123456789,
          number: 1,
          state: 'open',
          title: 'Test Pull Request',
          user: {
            id: 123456789,
            login: 'test-user',
          },
        },
        repository: {
          full_name: 'test-user/test-repo',
          id: 123456789,
          name: 'test-repo',
        },
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GitHub-Hookshot/test',
        'X-GitHub-Delivery': 'test-delivery-id',
        'X-GitHub-Event': 'pull_request',
      },
    },
    push: {
      body: {
        after: '1234567890abcdef1234567890abcdef12345678',
        before: '0000000000000000000000000000000000000000',
        commits: [
          {
            author: {
              email: 'test@example.com',
              name: 'Test User',
            },
            id: '1234567890abcdef1234567890abcdef12345678',
            message: 'Test commit',
            timestamp: new Date().toISOString(),
          },
        ],
        pusher: {
          email: 'test@example.com',
          name: 'test-user',
        },
        ref: 'refs/heads/main',
        repository: {
          full_name: 'test-user/test-repo',
          id: 123456789,
          name: 'test-repo',
          owner: {
            email: 'test@example.com',
            name: 'test-user',
          },
          private: false,
        },
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GitHub-Hookshot/test',
        'X-GitHub-Delivery': 'test-delivery-id',
        'X-GitHub-Event': 'push',
      },
    },
  },
  stripe: {
    'customer.created': {
      body: {
        api_version: '2023-10-16',
        created: Date.now(),
        data: {
          object: {
            created: Date.now(),
            email: 'test@example.com',
            id: 'cus_1234567890',
            livemode: false,
            metadata: {},
            name: 'Test Customer',
            object: 'customer',
          },
        },
        id: 'evt_1234567890',
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
        type: 'customer.created',
      },
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'v1=test_signature',
        'User-Agent': 'Stripe/1.0 (+https://stripe.com)',
      },
    },
    'payment_intent.succeeded': {
      body: {
        api_version: '2023-10-16',
        created: Date.now(),
        data: {
          object: {
            amount: 2000,
            currency: 'usd',
            customer: 'cus_1234567890',
            description: 'Test payment',
            id: 'pi_1234567890',
            metadata: {},
            object: 'payment_intent',
            status: 'succeeded',
          },
        },
        id: 'evt_1234567890',
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: {
          id: null,
          idempotency_key: null,
        },
        type: 'payment_intent.succeeded',
      },
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'v1=test_signature',
        'User-Agent': 'Stripe/1.0 (+https://stripe.com)',
      },
    },
    'subscription.created': {
      body: {
        api_version: '2023-10-16',
        created: Date.now(),
        data: {
          object: {
            current_period_end: (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000,
            current_period_start: Date.now() / 1000,
            customer: 'cus_1234567890',
            id: 'sub_1234567890',
            items: {
              data: [
                {
                  id: 'si_1234567890',
                  object: 'subscription_item',
                  price: {
                    currency: 'usd',
                    id: 'price_1234567890',
                    object: 'price',
                    unit_amount: 999,
                  },
                },
              ],
              object: 'list',
            },
            object: 'subscription',
            status: 'active',
          },
        },
        id: 'evt_1234567890',
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        type: 'customer.subscription.created',
      },
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'v1=test_signature',
        'User-Agent': 'Stripe/1.0 (+https://stripe.com)',
      },
    },
  },
};

export const createTestEventSchema = {
  customData: z.record(z.any()).optional(),
  eventType: z.string(),
  provider: z.enum(['stripe', 'github', 'clerk', 'custom']),
  source: z.string().optional(),
  webhookId: z.string(),
};

export function registerCreateTestEventTool(
  server: McpServer,
  context: Context,
) {
  const caller = createCaller(context);

  // @ts-ignore
  server.registerTool(
    'create_test_event',
    {
      description:
        'Create a test webhook event for testing purposes. Supports templates for common providers like Stripe, GitHub, and Clerk.',
      inputSchema: createTestEventSchema,
      title: 'Create Test Event',
    },
    async (args, extra) => {
      const startTime = Date.now();
      const userId = extra.authInfo?.extra?.userId as string;
      const organizationId = extra.authInfo?.extra?.organizationId as string;

      try {
        // Get webhook info
        const webhook = await caller.webhooks.byId({ id: args.webhookId });
        if (!webhook) {
          return {
            content: [
              { text: `Webhook ${args.webhookId} not found`, type: 'text' },
            ],
          };
        }

        // Get the template
        const providerKey = args.provider as keyof typeof providerTemplates;
        const providerTemplateGroup = providerTemplates[providerKey];
        const template =
          providerTemplateGroup && args.eventType in providerTemplateGroup
            ? (providerTemplateGroup as Record<string, unknown>)[args.eventType]
            : undefined;

        if (!template && args.provider !== 'custom') {
          const availableEvents = providerTemplateGroup
            ? Object.keys(providerTemplateGroup)
            : [];
          return {
            content: [
              {
                text: `Event type "${args.eventType}" not found for provider "${args.provider}". Available event types for ${args.provider}: ${availableEvents.join(', ')}`,
                type: 'text',
              },
            ],
          };
        }

        // Prepare event data
        let eventBody: Record<string, unknown> = {};
        let eventHeaders: Record<string, string> = {};

        if (template && typeof template === 'object' && 'body' in template) {
          const typedTemplate = template as {
            body: Record<string, unknown>;
            headers: Record<string, string>;
          };
          eventBody = { ...typedTemplate.body };
          eventHeaders = { ...typedTemplate.headers };

          // Merge custom data if provided
          if (args.customData) {
            eventBody = deepMerge(eventBody, args.customData);
          }
        } else if (args.provider === 'custom') {
          eventBody = args.customData || { data: {}, event: 'custom.event' };
          eventHeaders = {
            'Content-Type': 'application/json',
            'User-Agent': 'Unhook-Test/1.0',
          };
        }

        // Create the request payload
        const requestPayload = {
          body: JSON.stringify(eventBody),
          clientIp: '127.0.0.1',
          contentType: 'application/json',
          headers: eventHeaders,
          id: createId({ prefix: 'req' }),
          method: 'POST',
          size: JSON.stringify(eventBody).length,
          sourceUrl: `https://${args.provider}.com/webhooks`,
        };

        // Create the event
        const event = await caller.events.create({
          apiKeyId: webhook.apiKeyId,
          maxRetries: 3,
          originRequest: requestPayload,
          retryCount: 0,
          source: args.source || args.provider,
          status: 'pending',
          timestamp: new Date(),
          webhookId: webhook.id,
        });

        if (!event) {
          throw new Error('Failed to create event');
        }

        const executionTime = Date.now() - startTime;

        // Track successful tool usage
        trackToolUsage(
          'create_test_event',
          {
            event_id: event.id,
            event_type: args.eventType,
            execution_time_ms: executionTime,
            provider: args.provider,
            webhook_id: args.webhookId,
          },
          userId,
          organizationId,
        );

        return {
          content: [
            {
              text: `Successfully created test event:
Event ID: ${event.id}
Provider: ${args.provider}
Event Type: ${args.eventType}
Status: ${event.status}
Webhook: ${webhook.name} (${webhook.id})
Source: ${event.source}

The event has been created and will be processed by the webhook system.`,
              type: 'text',
            },
          ],
        };
      } catch (error) {
        // Track error
        trackError(
          error as Error,
          {
            args,
            execution_time_ms: Date.now() - startTime,
            tool_name: 'create_test_event',
          },
          userId,
          organizationId,
        );

        throw error;
      }
    },
  );
}

// Helper function to deep merge objects
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(
            target[key] as Record<string, unknown>,
            source[key] as Record<string, unknown>,
          );
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}
