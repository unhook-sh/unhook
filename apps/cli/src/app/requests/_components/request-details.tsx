import type { RequestType } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { Box, Text } from 'ink';
import type { FC } from 'react';
import { useState } from 'react';
import { SyntaxHighlight } from '~/components/syntax-highlight';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/tabs';
import { useRequestStore } from '~/stores/request-store';

const log = debug('unhook:cli:request-details');

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

interface RequestDetailsProps {
  request?: RequestType;
}

export const RequestDetails: FC<RequestDetailsProps> = ({
  request: propRequest,
}) => {
  const selectedRequestId = useRequestStore.use.selectedRequestId();
  const requests = useRequestStore.use.requests();
  const request =
    propRequest ?? requests.find((r) => r.id === selectedRequestId);

  const [_activeTabName, setActiveTabName] = useState('request');

  function handleTabChange(name: string) {
    log('handleTabChange', name);
    setActiveTabName(name);
  }

  if (!request) {
    return (
      <Box>
        <Text>Select a request to view details</Text>
      </Box>
    );
  }

  const requestBody = request.request.body
    ? tryDecodeBase64(request.request.body)
    : null;
  const responseBody = request.response?.body
    ? tryDecodeBase64(request.response.body)
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
                {request.request.method}{' '}
              </Text>
              <Text>{new URL(request.to).pathname}</Text>
              <Box>
                <Text dimColor>
                  Size: {request.request.size} bytes • IP:{' '}
                  {request.request.clientIp} •{' '}
                  {new Date(request.timestamp).toLocaleString()}
                </Text>
              </Box>
              <Box flexDirection="column">
                {Object.entries(request.request.headers).map(([key, value]) => (
                  <Box key={key} marginLeft={2}>
                    <Text>{key}: </Text>
                    <Text dimColor>{value}</Text>
                  </Box>
                ))}
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
              {Object.entries(request.response?.headers || {}).map(
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

      {request.status === 'failed' && (
        <Box flexDirection="column" marginTop={2}>
          <Text bold color="red">
            Request Failed
          </Text>
          {request.failedReason && (
            <Box marginLeft={2}>
              <Text color="red">{request.failedReason}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
