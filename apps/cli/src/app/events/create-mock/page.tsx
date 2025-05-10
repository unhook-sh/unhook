import { Box, Text, useInput } from 'ink';
import type { FC } from 'react';
import { useState } from 'react';
import { SelectInput } from '~/components/select-input';
import { env } from '~/env';
import { capture } from '~/lib/posthog';
import { useConfigStore } from '~/stores/config-store';
import { type RouteProps, useRouterStore } from '~/stores/router-store';
import { fixtures } from './fixtures';
import type { EventFixture } from './fixtures/types';

async function sendWebhook(params: {
  webhookId: string;
  fixture: EventFixture;
  status?: number;
}) {
  const { webhookId, fixture } = params;
  const baseUrl = env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-unhook-webhook-id': webhookId,
      'x-unhook-endpoint': `api/mock-consumer?status=${params.status ?? 200}`,
      'User-Agent': `UnhookMock/${fixture.provider}`,
    },
    body: JSON.stringify({
      ...fixture.body,
      timestamp: new Date().toISOString(),
      headers: {
        'User-Agent': `UnhookMock/${fixture.provider}`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send webhook: ${response.statusText}`);
  }

  return response;
}

export const CreateEventPage: FC<RouteProps> = () => {
  const [selectedFixture, setSelectedFixture] = useState<EventFixture | null>(
    null,
  );
  const [status, setStatus] = useState<'selecting' | 'creating' | 'done'>(
    'selecting',
  );
  const [error, setError] = useState<string | null>(null);
  const webhookId = useConfigStore.use.webhookId();
  const navigate = useRouterStore.use.navigate();

  const menuItems = fixtures.map((fixture) => ({
    label: `${fixture.provider} - ${fixture.body.eventType}`,
    value: `${fixture.provider}:${fixture.body.eventType}`,
    description: fixture.description,
  }));

  const handleSelect = (value: string) => {
    const [provider, eventType] = value.split(':');
    const fixture = fixtures.find(
      (f) => f.provider === provider && f.body.eventType === eventType,
    );
    setSelectedFixture(fixture ?? null);

    capture({
      event: 'event_fixture_selected',
      properties: {
        provider,
        eventType,
        webhookId,
        fixtureFound: !!fixture,
      },
    });
  };

  const createEventAndRequest = async () => {
    if (!selectedFixture || !webhookId) {
      const errorMessage = 'Missing required data to create event';
      setError(errorMessage);
      capture({
        event: 'event_creation_error',
        properties: {
          error: errorMessage,
          webhookId,
          hasSelectedFixture: !!selectedFixture,
        },
      });
      return;
    }

    try {
      setStatus('creating');
      capture({
        event: 'event_creation_started',
        properties: {
          provider: selectedFixture.provider,
          eventType: selectedFixture.body.eventType,
          webhookId,
        },
      });

      await sendWebhook({
        webhookId,
        fixture: selectedFixture,
      });

      setStatus('done');
      capture({
        event: 'event_creation_success',
        properties: {
          provider: selectedFixture.provider,
          eventType: selectedFixture.body.eventType,
          webhookId,
        },
      });

      setTimeout(() => {
        navigate('/events');
      }, 500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      setStatus('selecting');
      capture({
        event: 'event_creation_error',
        properties: {
          error: errorMessage,
          provider: selectedFixture.provider,
          eventType: selectedFixture.body.eventType,
          webhookId,
        },
      });
    }
  };

  useInput((_input, key) => {
    if (key.return && selectedFixture && status === 'selecting') {
      createEventAndRequest();
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Create Event</Text>

      {status === 'selecting' && (
        <Box flexDirection="column">
          <SelectInput
            items={menuItems}
            onSelect={(item) => handleSelect(item.value)}
          />
          {selectedFixture && (
            <Box flexDirection="column" marginTop={1}>
              <Text>Selected Event:</Text>
              <Text dimColor>
                {JSON.stringify(selectedFixture.body, null, 2)}
              </Text>
              <Text>Press Enter to create event</Text>
            </Box>
          )}
        </Box>
      )}

      {status === 'creating' && <Text>Creating event...</Text>}

      {status === 'done' && (
        <Text color="green">
          Event created successfully! Redirecting to requests...
        </Text>
      )}

      {error && <Text color="red">{error}</Text>}
    </Box>
  );
};
