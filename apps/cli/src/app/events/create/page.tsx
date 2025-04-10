import { Box, Text, useInput } from 'ink';
import type { FC } from 'react';
import { useState } from 'react';
import type { AppRoutePath } from '~/app/routes';
import { SelectInput } from '~/components/select-input';
import { useCliStore } from '~/lib/cli-store';
import type { RouteProps } from '~/lib/router';
import { useRouter } from '~/lib/router';
import { useTunnelStore } from '~/lib/tunnel-store';
import { fixtures } from './fixtures';
import type { EventFixture } from './fixtures/types';

async function sendWebhook(params: {
  apiKey: string;
  fixture: EventFixture;
  status?: number;
}) {
  const { apiKey, fixture } = params;
  const baseUrl = 'http://localhost:3002';
  const response = await fetch(`${baseUrl}/api/tunnel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-unhook-api-key': apiKey,
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
  const selectedTunnelId = useTunnelStore.use.selectedTunnelId();
  const apiKey = useCliStore.use.apiKey();
  const { navigate } = useRouter<AppRoutePath>();

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
  };

  const createEventAndRequest = async () => {
    if (!selectedFixture || !apiKey) {
      setError('Missing required data to create event');
      return;
    }

    try {
      setStatus('creating');

      await sendWebhook({
        apiKey,
        fixture: selectedFixture,
      });

      setStatus('done');

      setTimeout(() => {
        navigate('/requests');
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      setStatus('selecting');
    }
  };

  useInput((input, key) => {
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
