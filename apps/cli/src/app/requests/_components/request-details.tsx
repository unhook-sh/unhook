import type { RequestType } from '@unhook/db/schema';
import { Box, Text } from 'ink';
import type { FC } from 'react';
import { SyntaxHighlight } from '~/components/syntax-highlight';
import { useRequestStore } from '~/lib/request-store';

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
  const _formattedResponseBody = responseBody
    ? tryParseJson(responseBody)
    : null;

  return (
    <Box width="100%" paddingLeft={2} flexDirection="column">
      {/* Request Info */}
      <Box flexDirection="column">
        <Box>
          <Text bold color="cyan">
            {request.request.method}{' '}
          </Text>
          <Text>{request.request.url}</Text>
        </Box>
        <Box>
          <Text dimColor>
            Size: {request.request.size} bytes • IP: {request.request.clientIp}{' '}
            • {new Date(request.request.timestamp).toLocaleString()}
          </Text>
        </Box>
        {request.response && (
          <Box>
            <Text dimColor>Status: </Text>
            <Text color={request.response.status >= 400 ? 'red' : 'green'}>
              {request.response.status}
            </Text>
            <Text dimColor> • Response Time: {request.responseTimeMs}ms</Text>
          </Box>
        )}
      </Box>

      {/* Request Headers */}
      <Box flexDirection="column">
        <Text bold color="blue">
          Request Headers
        </Text>
        {Object.entries(request.request.headers).map(([key, value]) => (
          <Box key={key} marginLeft={2}>
            <Text>{key}: </Text>
            <Text dimColor>{value}</Text>
          </Box>
        ))}
      </Box>

      {/* Request Body */}
      <Box flexDirection="column" marginTop={2}>
        <Text bold color="blue">
          Request Body
        </Text>
        <Box marginLeft={2}>
          {formattedRequestBody && (
            <SyntaxHighlight code={formattedRequestBody} language="json" />
          )}
        </Box>
      </Box>

      {/* Response Headers */}
      {request.response && (
        <Box flexDirection="column" marginTop={2}>
          <Text bold color="blue">
            Response Headers
          </Text>
          {Object.entries(request.response.headers).map(([key, value]) => (
            <Box key={key} marginLeft={2}>
              <Text>{key}: </Text>
              <Text dimColor>{value}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Response Body */}
      {/* {formattedResponseBody && (
        <Box flexDirection="column" marginTop={2}>
          <Text bold color="blue">
            Response Body
          </Text>
          <Box marginLeft={2}>
            <SyntaxHighlight code={formattedResponseBody} language="json" />
          </Box>
        </Box>
      )} */}

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
