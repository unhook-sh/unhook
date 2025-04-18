import { Box, measureElement } from 'ink';
import type { DOMElement } from 'ink';
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Table } from '~/components/table';
import { capture } from '~/lib/posthog';
import { useCliStore } from '~/stores/cli-store';
import { useConnectionStore } from '~/stores/connection-store';
import type { RequestWithEvent } from '~/stores/request-store';
import { useRequestStore } from '~/stores/request-store';
import { useRouterStore } from '~/stores/router-store';
import type { RouteProps } from '~/stores/router-store';
import { requestColumns } from './_components/table-columns';

export const RequestsPage: FC<RouteProps> = () => {
  const selectedRequestId = useRequestStore.use.selectedRequestId();
  const setSelectedRequestId = useRequestStore.use.setSelectedRequestId();
  const requests = useRequestStore.use.requests();
  const _isLoading = useRequestStore.use.isLoading();
  const totalCount = useRequestStore.use.totalCount();
  const isConnected = useConnectionStore.use.isConnected();
  const pingEnabled = useCliStore.use.ping() !== false;
  const [selectedIndex, _setSelectedIndex] = useState(
    requests.findIndex((request) => request.id === selectedRequestId),
  );
  const navigate = useRouterStore.use.navigate();
  const [, forceUpdate] = useState({});

  // Add timer effect to update the page every second
  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate({});
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleViewDetails = useCallback(
    (request: RequestWithEvent) => {
      setSelectedRequestId(request.id);
      navigate('/requests/:id', { id: request.id });
    },
    [setSelectedRequestId, navigate],
  );

  const replayRequest = useRequestStore.use.replayRequest();
  const handleReplay = useCallback(
    (request: RequestWithEvent) => {
      if (!isConnected && pingEnabled) {
        return;
      }
      void replayRequest(request);
    },
    [replayRequest, isConnected, pingEnabled],
  );

  const ref = useRef<DOMElement>(null);
  const [_containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const height = measureElement(ref.current).height;
      setContainerHeight(height);
    }
  }, []);

  return (
    <Box flexDirection="row" ref={ref}>
      <Table<RequestWithEvent>
        totalCount={totalCount}
        data={requests}
        columns={requestColumns}
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
              capture({
                event: 'hotkey_pressed',
                properties: {
                  hotkey: 'return',
                  hokeyName: 'View Details',
                  requestId: request?.id,
                },
              });
              if (request) {
                handleViewDetails(request);
              }
            },
          },
          {
            key: 'r',
            label:
              !isConnected && pingEnabled ? 'Replay (Not Connected)' : 'Replay',
            onAction: (_, index) => {
              const request = requests[index];
              capture({
                event: 'hotkey_pressed',
                properties: {
                  hotkey: 'r',
                  hokeyName: 'Replay',
                  requestId: request?.id,
                },
              });
              if (request && (isConnected || !pingEnabled)) {
                handleReplay(request);
              }
            },
          },
        ]}
      />
    </Box>
  );
};
