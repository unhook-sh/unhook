import { debug } from '@unhook/logger';
import { Box, Text } from 'ink';
import type { FC } from 'react';
import { useState } from 'react';
import { SyntaxHighlight } from '~/components/syntax-highlight';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/tabs';
import type { EventWithRequest } from '~/stores/events-store';
import { useEventStore } from '~/stores/events-store';

const log = debug('unhook:cli:event-details');

function tryDecodeBase64(str: string): string {
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    return str;
  }
}

function tryParseJson(str: string): string {
  try {
    const json = JSON.parse(str);
    return JSON.stringify(json, null, 2);
  } catch {
    return str;
  }
}

interface EventDetailsProps {
  event?: EventWithRequest;
}

export const EventDetails: FC<EventDetailsProps> = ({ event: propEvent }) => {
  const selectedEventId = useEventStore.use.selectedEventId();
  const events = useEventStore.use.events();
  const event = propEvent ?? events.find((e) => e.id === selectedEventId);

  const [_activeTabName, setActiveTabName] = useState('request');

  function handleTabChange(name: string) {
    log('handleTabChange', name);
    setActiveTabName(name);
  }

  if (!event) {
    return (
      <Box>
        <Text>Select an event to view details</Text>
      </Box>
    );
  }

  const lastRequest = event.requests?.[0];

  const requestBody = event.originRequest.body
    ? tryDecodeBase64(event.originRequest.body)
    : null;
  const responseBody = lastRequest?.response?.body
    ? tryDecodeBase64(lastRequest.response.body)
    : null;

  const formattedRequestBody = requestBody ? tryParseJson(requestBody) : null;
  const formattedResponseBody = responseBody
    ? tryParseJson(responseBody)
    : null;

  let to = lastRequest?.to;
  if (to && to !== '*') {
    to = new URL(to).pathname;
  }

  return (
    <Box>
      <Tabs onChange={handleTabChange} defaultValue="request">
        <TabsList>
          <TabsTrigger value="request">Request</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
        </TabsList>

        <TabsContent value="request">
          <Box flexDirection="row">
            <Box width="50%" flexDirection="column">
              <Text bold color="cyan">
                {event.originRequest.method}{' '}
              </Text>
              <Text>{to}</Text>
              <Box>
                <Text dimColor>
                  Size: {event.originRequest.size} bytes • IP:{' '}
                  {event.originRequest.clientIp} •{' '}
                  {new Date(event.timestamp).toLocaleString()}
                </Text>
              </Box>
              <Box flexDirection="column">
                {Object.entries(event.originRequest.headers).map(
                  ([key, value]) => (
                    <Box key={key} marginLeft={2}>
                      <Text>{key}: </Text>
                      <Text dimColor>{value}</Text>
                    </Box>
                  ),
                )}
              </Box>
            </Box>
            <Box width="50%" flexDirection="column">
              {formattedRequestBody && (
                <SyntaxHighlight code={formattedRequestBody} language="json" />
              )}
            </Box>
          </Box>
        </TabsContent>
        <TabsContent value="response">
          <Box flexDirection="row">
            <Box width="50%" flexDirection="column">
              {Object.entries(event.originRequest?.headers || {}).map(
                ([key, value]) => (
                  <Box key={key} marginLeft={2}>
                    <Text>{key}: </Text>
                    <Text dimColor>{value}</Text>
                  </Box>
                ),
              )}
            </Box>
            <Box width="50%" flexDirection="column">
              {formattedResponseBody && (
                <SyntaxHighlight code={formattedResponseBody} language="json" />
              )}
            </Box>
          </Box>
        </TabsContent>
      </Tabs>

      {event.status === 'failed' && (
        <Box flexDirection="column" marginTop={2}>
          <Text bold color="red">
            Request Failed
          </Text>
          {event.failedReason && (
            <Box marginLeft={2}>
              <Text color="red">{event.failedReason}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
