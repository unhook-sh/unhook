import type { RequestType } from '@acme/db/schema';
import { Box, useInput } from 'ink';
import type { FC } from 'react';
import { useCallback, useState } from 'react';
import React from 'react';
import { Table } from '~/components/table';
import type { RouteProps } from '~/lib/router';
import { useRouter } from '~/lib/router';
import { useRequestStore } from '~/lib/request-store';
import { requestToTableData } from '~/utils/request';
import { RequestDetails } from './_components/request-details';
import {
  RequestTableCell,
  RequestTableHeader,
} from './_components/table-cells';

export const RequestsPage: FC<RouteProps> = () => {
  const selectedRequestId = useRequestStore.use.selectedRequestId();
  const setSelectedRequestId = useRequestStore.use.setSelectedRequestId();
  const requests = useRequestStore.use.requests();
  const isLoading = useRequestStore.use.isLoading();
  const isDetailsVisible = useRequestStore.use.isDetailsVisible();
  const setIsDetailsVisible = useRequestStore.use.setIsDetailsVisible();
  const [selectedIndex, setSelectedIndex] = useState(
    requests.findIndex((request) => request.id === selectedRequestId),
  );
  const { navigate } = useRouter();

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
      void replayRequest(request);
    },
    [replayRequest],
  );

  const tableData = requests.map((request) =>
    requestToTableData(request, false),
  );

  return (
    <Box flexDirection="row">
      <Box width={isDetailsVisible ? '50%' : undefined}>
        <Table
          data={tableData}
          columns={['method', 'url', 'status', 'time']}
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
              label: 'Replay',
              onAction: (_, index) => {
                const request = requests[index];
                if (request) {
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
