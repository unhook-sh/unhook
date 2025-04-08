import type { RequestType } from '@unhook/db/schema';
import { differenceInMinutes, format, formatDistanceToNow } from 'date-fns';
import { Box, useInput } from 'ink';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Table } from '~/components/table';
import { useConnectionStore } from '~/lib/connection-store';
import { useRequestStore } from '~/lib/request-store';
import type { RouteProps } from '~/lib/router';
import { useRouter } from '~/lib/router';
import { RequestDetails } from './_components/request-details';
import {
  RequestTableCell,
  RequestTableHeader,
} from './_components/table-cells';

function formatRequestTime(date: Date) {
  const now = new Date();
  const diffInMinutes = differenceInMinutes(now, date);

  if (diffInMinutes < 1) {
    return formatDistanceToNow(date, { addSuffix: true, includeSeconds: true });
  }

  return format(date, 'MMM d, HH:mm:ss');
}

function tryDecodeBase64(str: string): string {
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    return str;
  }
}

export function requestToTableData(request: RequestType, isSelected: boolean) {
  const decodedBody = request.request.body
    ? tryDecodeBase64(request.request.body)
    : null;

  let parsedBody = null;
  try {
    parsedBody = decodedBody ? JSON.parse(decodedBody) : null;
  } catch {
    parsedBody = null;
  }

  return {
    ...request,
    selected: isSelected ? '→' : '',
    method: request.request.method,
    url:
      request.request.url.length > 35
        ? `${request.request.url.substring(0, 35)}...`
        : request.request.url,
    status: request.status,
    time: formatRequestTime(new Date(request.createdAt)),
    id: request.id,
    isSelected,
    responseCode: request.response?.status,
    responseTimeMs: request.responseTimeMs,
    event: parsedBody?.type ?? null,
  };
}

export const RequestsPage: FC<RouteProps> = () => {
  const selectedRequestId = useRequestStore.use.selectedRequestId();
  const setSelectedRequestId = useRequestStore.use.setSelectedRequestId();
  const requests = useRequestStore.use.requests();
  const _isLoading = useRequestStore.use.isLoading();
  const isDetailsVisible = useRequestStore.use.isDetailsVisible();
  const setIsDetailsVisible = useRequestStore.use.setIsDetailsVisible();
  const isConnected = useConnectionStore.use.isConnected();
  const [selectedIndex, _setSelectedIndex] = useState(
    requests.findIndex((request) => request.id === selectedRequestId),
  );
  const { navigate } = useRouter();
  const [, forceUpdate] = useState({});

  // Add timer effect to update the page every second
  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate({});
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleDetails = useCallback(() => {
    setIsDetailsVisible(!isDetailsVisible);
  }, [setIsDetailsVisible, isDetailsVisible]);

  // Handle hotkey for toggling details
  useInput((input, key) => {
    if (input === 'h' && !key.meta && !key.ctrl && !key.shift) {
      toggleDetails();
    }
  });

  const handleViewDetails = useCallback(
    (request: RequestType) => {
      setSelectedRequestId(request.id);
      navigate(`/requests/${request.id}`);
    },
    [setSelectedRequestId, navigate],
  );

  const replayRequest = useRequestStore.use.replayRequest();
  const handleReplay = useCallback(
    (request: RequestType) => {
      if (!isConnected) {
        return;
      }
      void replayRequest(request);
    },
    [replayRequest, isConnected],
  );

  const tableData = requests.map((request) =>
    requestToTableData(request, false),
  );

  return (
    <Box flexDirection="row">
      <Box width={isDetailsVisible ? '50%' : undefined}>
        <Table
          data={tableData}
          columns={[
            'method',
            'url',
            'status',
            'responseCode',
            'responseTimeMs',
            'event',
            'time',
          ]}
          header={RequestTableHeader}
          cell={RequestTableCell}
          initialIndex={selectedIndex}
          onSelectionChange={(index) => {
            const request = requests[index];
            if (request) {
              setSelectedRequestId(request.id);
            }
          }}
          actions={[
            {
              key: 'return',
              label: 'View Details',
              onAction: (_, index) => {
                const request = requests[index];
                if (request) {
                  handleViewDetails(request);
                }
              },
            },
            {
              key: 'r',
              label: isConnected ? 'Replay' : 'Replay (Not Connected)',
              onAction: (_, index) => {
                const request = requests[index];
                if (request && isConnected) {
                  handleReplay(request);
                }
              },
            },
            {
              key: 'h',
              label: 'Toggle Details',
              onAction: toggleDetails,
            },
          ]}
        />
      </Box>

      {isDetailsVisible && <RequestDetails />}
    </Box>
  );
};
