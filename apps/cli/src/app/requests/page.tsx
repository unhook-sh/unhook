import type { RequestType } from '@unhook/db/schema';
import { Box, measureElement, useInput } from 'ink';
import type { DOMElement } from 'ink';
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Table } from '~/components/table';
import { useDimensions } from '~/hooks/use-dimensions';
import { useCliStore } from '~/lib/cli-store';
import { useConnectionStore } from '~/lib/connection-store';
import { useRequestStore } from '~/lib/request-store';
import type { RouteProps } from '~/lib/router';
import { useRouter } from '~/lib/router';
import { RequestDetails } from './_components/request-details';
import { requestColumns } from './_components/table-columns';

export const RequestsPage: FC<RouteProps> = () => {
  const selectedRequestId = useRequestStore.use.selectedRequestId();
  const setSelectedRequestId = useRequestStore.use.setSelectedRequestId();
  const requests = useRequestStore.use.requests();
  const _isLoading = useRequestStore.use.isLoading();
  const isDetailsVisible = useRequestStore.use.isDetailsVisible();
  const setIsDetailsVisible = useRequestStore.use.setIsDetailsVisible();
  const isConnected = useConnectionStore.use.isConnected();
  const pingEnabled = useCliStore.use.ping() !== false;
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
      if (!isConnected && pingEnabled) {
        return;
      }
      void replayRequest(request);
    },
    [replayRequest, isConnected, pingEnabled],
  );

  const dimensions = useDimensions();
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
      <Box width={isDetailsVisible ? '50%' : undefined}>
        <Table
          data={requests}
          columns={requestColumns}
          initialIndex={selectedIndex}
          maxHeight={
            isDetailsVisible
              ? Math.floor(dimensions.height * 0.8)
              : dimensions.height - 10
          }
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
              label:
                !isConnected && pingEnabled
                  ? 'Replay (Not Connected)'
                  : 'Replay',
              onAction: (_, index) => {
                const request = requests[index];
                if (request && (isConnected || !pingEnabled)) {
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
