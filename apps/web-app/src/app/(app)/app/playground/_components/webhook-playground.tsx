'use client';

import {
  IconArrowRight,
  IconChartBar,
  IconSettings,
} from '@tabler/icons-react';
import { MetricButton } from '@unhook/analytics/components';
import { Badge } from '@unhook/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import posthog from 'posthog-js';
import { useState } from 'react';
import { EventTypeSelector } from './event-type-selector';
import { JsonEditor } from './json-editor';
import { ResultsDisplay } from './results-display';
import { ServiceSelector } from './service-selector';
import { WebhookSelector } from './webhook-selector';

interface WebhookResult {
  id: number;
  timestamp: string;
  webhookId: string;
  service: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: 'success' | 'error';
  response?: { status: number; message: string };
  error?: string;
}

export function WebhookPlayground() {
  const [selectedWebhookId, setSelectedWebhookId] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [jsonPayload, setJsonPayload] = useState<string>('{}');
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<WebhookResult[]>([]);

  const handleSend = async () => {
    if (!selectedWebhookId || !selectedService || !selectedEventType) {
      return;
    }

    // Track the webhook send action
    posthog.capture('playground_webhook_sent', {
      event_type: selectedEventType,
      payload_size: jsonPayload.length,
      service: selectedService,
      webhook_id: selectedWebhookId,
    });

    setIsSending(true);
    try {
      // Parse the JSON payload
      const payload = JSON.parse(jsonPayload);

      // Simulate sending the webhook
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Add result to the list
      const result: WebhookResult = {
        eventType: selectedEventType,
        id: Date.now(),
        payload,
        response: { message: 'Webhook sent successfully', status: 200 },
        service: selectedService,
        status: 'success',
        timestamp: new Date().toISOString(),
        webhookId: selectedWebhookId,
      };

      setResults((prev) => [result, ...prev]);
    } catch (error) {
      const result: WebhookResult = {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventType: selectedEventType,
        id: Date.now(),
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        service: selectedService,
        status: 'error',
        timestamp: new Date().toISOString(),
        webhookId: selectedWebhookId,
      };

      setResults((prev) => [result, ...prev]);
    } finally {
      setIsSending(false);
    }
  };

  const canSend =
    selectedWebhookId &&
    selectedService &&
    selectedEventType &&
    jsonPayload.trim() !== '{}';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Configuration Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSettings className="size-4" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <WebhookSelector
              onValueChange={setSelectedWebhookId}
              value={selectedWebhookId}
            />

            <ServiceSelector
              onValueChange={(service) => {
                setSelectedService(service);
                setSelectedEventType(''); // Reset event type when service changes
              }}
              value={selectedService}
            />

            <EventTypeSelector
              onValueChange={(eventType) => {
                setSelectedEventType(eventType);
                // Update JSON payload with sample data for the selected event type
                const samplePayload = getSamplePayload(
                  selectedService,
                  eventType,
                );
                setJsonPayload(JSON.stringify(samplePayload, null, 2));
              }}
              service={selectedService}
              value={selectedEventType}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSettings className="size-4" />
              Payload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JsonEditor onChange={setJsonPayload} value={jsonPayload} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconArrowRight className="size-4" />
              Send Webhook
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MetricButton
              className="w-full"
              disabled={!canSend || isSending}
              metric="playground_webhook_send_clicked"
              onClick={handleSend}
            >
              {isSending ? (
                <>
                  <Icons.Spinner className="mr-2 animate-spin" size="sm" />
                  Sending...
                </>
              ) : (
                <>
                  <IconArrowRight className="size-4 mr-2" />
                  Send Webhook
                </>
              )}
            </MetricButton>

            {!canSend && (
              <p className="mt-2 text-sm text-muted-foreground">
                Please select a webhook, service, and event type to send a
                webhook.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Panel */}
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChartBar className="size-4" />
              Results
              {results.length > 0 && (
                <Badge variant="secondary">{results.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResultsDisplay results={results} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to get sample payloads for different services and event types
function getSamplePayload(
  service: string,
  eventType: string,
): Record<string, unknown> {
  const samples: Record<string, Record<string, Record<string, unknown>>> = {
    clerk: {
      'session.created': {
        data: {
          abandon_at: Date.now() + 7 * 24 * 60 * 60 * 1000,
          client_id: 'client_1234567890',
          created_at: Date.now(),
          expire_at: Date.now() + 24 * 60 * 60 * 1000,
          id: 'sess_2NxdwKxVPXhE9URzMHkFoqWYKFn',
          last_active_at: Date.now(),
          object: 'session',
          status: 'active',
          updated_at: Date.now(),
          user_id: 'user_2NxdwKxVPXhE9URzMHkFoqWYKFn',
        },
        object: 'event',
        type: 'session.created',
      },
      'user.created': {
        data: {
          created_at: Date.now(),
          email_addresses: [
            {
              email_address: 'john.doe@example.com',
              id: 'email_1234567890',
              verification: {
                status: 'verified',
                strategy: 'email_code',
              },
            },
          ],
          first_name: 'John',
          id: 'user_2NxdwKxVPXhE9URzMHkFoqWYKFn',
          last_name: 'Doe',
          object: 'user',
          primary_email_address_id: 'email_1234567890',
          private_metadata: {},
          profile_image_url: 'https://img.clerk.com/...',
          public_metadata: {},
          unsafe_metadata: {},
          updated_at: Date.now(),
          username: 'johndoe',
        },
        object: 'event',
        type: 'user.created',
      },
    },
    github: {
      pull_request: {
        action: 'opened',
        number: 42,
        pull_request: {
          base: {
            ref: 'main',
            sha: 'def1234567890abcdef',
          },
          body: 'This PR adds a new feature...',
          head: {
            ref: 'feature-branch',
            sha: 'abc1234567890abcdef',
          },
          id: 123456789,
          number: 42,
          state: 'open',
          title: 'Add new feature',
          user: {
            id: 123456,
            login: 'username',
          },
        },
        repository: {
          full_name: 'username/test-repo',
          name: 'test-repo',
        },
      },
      push: {
        after: 'def1234567890abcdef',
        before: 'abc1234567890abcdef',
        commits: [
          {
            author: {
              email: 'user@example.com',
              name: 'username',
            },
            id: 'def1234567890abcdef',
            message: 'Update README.md',
            timestamp: new Date().toISOString(),
          },
        ],
        pusher: {
          email: 'user@example.com',
          name: 'username',
        },
        ref: 'refs/heads/main',
        repository: {
          full_name: 'username/test-repo',
          id: 123456789,
          name: 'test-repo',
          owner: {
            email: 'user@example.com',
            name: 'username',
          },
        },
      },
    },
    stripe: {
      'customer.subscription.created': {
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            current_period_end: Math.floor(
              (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000,
            ),
            current_period_start: Math.floor(Date.now() / 1000),
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
        id: 'evt_sub_1234567890',
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        type: 'customer.subscription.created',
      },
      'payment_intent.succeeded': {
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            amount: 2000,
            created: Math.floor(Date.now() / 1000),
            currency: 'usd',
            customer: 'cus_1234567890',
            id: 'pi_3OqXw2EBvxMXKxVP0',
            object: 'payment_intent',
            payment_method: 'pm_1234567890',
            status: 'succeeded',
          },
        },
        id: 'evt_3OqXw2EBvxMXKxVP0',
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        type: 'payment_intent.succeeded',
      },
    },
  };

  return (
    samples[service]?.[eventType] || {
      message: `Sample payload for ${eventType}`,
    }
  );
}
