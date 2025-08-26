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
  webhookUrl: string;
  fixture: EventFixture;
  status?: number;
}) {
  const { webhookUrl, fixture } = params;
  const baseUrl = env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/webhook`, {
    body: JSON.stringify({
      ...fixture.body,
      headers: {
        'User-Agent': `UnhookMock/${fixture.provider}`,
      },
      timestamp: new Date().toISOString(),
    }),
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `UnhookMock/${fixture.provider}`,
      'x-unhook-endpoint': `api/mock-consumer?status=${params.status ?? 200}`,
      'x-unhook-webhook-url': webhookUrl,
    },
    method: 'POST',
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
  const webhookUrl = useConfigStore.use.webhookUrl();
  const navigate = useRouterStore.use.navigate();

  const menuItems = fixtures.map((fixture) => ({
    description: fixture.description,
    label: `${fixture.provider} - ${fixture.body.eventType}`,
    value: `${fixture.provider}:${fixture.body.eventType}`,
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
        eventType,
        fixtureFound: !!fixture,
        provider,
        webhookUrl,
      },
    });
  };

  const createEventAndRequest = async () => {
    if (!selectedFixture || !webhookUrl) {
      const errorMessage = 'Missing required data to create event';
      setError(errorMessage);
      capture({
        event: 'event_creation_error',
        properties: {
          error: errorMessage,
          hasSelectedFixture: !!selectedFixture,
          webhookUrl,
        },
      });
      return;
    }

    try {
      setStatus('creating');
      capture({
        event: 'event_creation_started',
        properties: {
          eventType: selectedFixture.body.eventType,
          provider: selectedFixture.provider,
          webhookUrl,
        },
      });

      await sendWebhook({
        fixture: selectedFixture,
        webhookUrl,
      });

      setStatus('done');
      capture({
        event: 'event_creation_success',
        properties: {
          eventType: selectedFixture.body.eventType,
          provider: selectedFixture.provider,
          webhookUrl,
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
          eventType: selectedFixture.body.eventType,
          provider: selectedFixture.provider,
          webhookUrl,
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
