import { tryDecodeBase64 } from '@unhook/client/utils/extract-event-name';
import type { EventTypeWithRequest, RequestType } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { Box, Text } from 'ink';
import type { FC } from 'react';
import { useState } from 'react';
import { SyntaxHighlight } from '~/components/syntax-highlight';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/tabs';
import { useEventStore } from '~/stores/events-store';

const log = debug('unhook:cli:event-details');

function tryParseJson(str: string): string {
  try {
    const json = JSON.parse(str);
    return JSON.stringify(json, null, 2);
  } catch {
    return str;
  }
}

interface EventRequestDetailsProps {
  event?: EventTypeWithRequest;
  request?: RequestType;
}

export const EventRequestDetails: FC<EventRequestDetailsProps> = (props) => {
  const selectedEventId = useEventStore.use.selectedEventId();
  const events = useEventStore.use.events();
  const event = props.event ?? events.find((e) => e.id === selectedEventId);

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
              <Text>{lastRequest?.destination?.name}</Text>
              <Box>
                <Text dimColor>
                  Size: {event.originRequest.size} bytes • IP:{' '}
                  {event.originRequest.clientIp} •{' '}
                  {new Date(event.timestamp).toLocaleString()}
                </Text>
              </Box>
              <Box flexDirection="column">
                {/* {Object.entries(event.originRequest.headers).map(
                  ([key, value]) => (
                    <Box key={key} marginLeft={2}>
                      <Text>{key}: </Text>
                      <Text dimColor>{value}</Text>
                    </Box>
                  ),
                )} */}
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
              {/* {Object.entries(event.originRequest?.headers || {}).map(
                ([key, value]) => (
                  <Box key={key} marginLeft={2}>
                    <Text>{key}: </Text>
                    <Text dimColor>{value}</Text>
                  </Box>
                ),
              )} */}
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
