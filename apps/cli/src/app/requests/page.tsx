import type { RequestType } from '@acme/db/schema';
import { Box } from 'ink';
import type { FC } from 'react';
import { useCallback } from 'react';
import { Table } from '~/components/table';
import type { RouteProps } from '~/lib/router';
import { useSelectionStore } from '~/lib/store';
import { requestToTableData } from '~/utils/request';
import {
  RequestTableCell,
  RequestTableHeader,
} from './_components/table-cells';

export const RequestsPage: FC<RouteProps> = () => {
  const selectedIndex = useSelectionStore(
    (state) => state.selectedIndices.requests,
  );
  const setSelectedIndex = useSelectionStore((state) => state.setRequestsIndex);
  const requests = useSelectionStore((state) => state.requests);
  const isLoading = useSelectionStore((state) => state.isLoading);

  const handleViewDetails = useCallback((request: RequestType) => {
    // TODO: Implement view details
    console.log('View details:', request);
  }, []);

  const handleReplay = useCallback((request: RequestType) => {
    // TODO: Implement replay
    console.log('Replay request:', request);
  }, []);

  const tableData = requests.map((request) =>
    requestToTableData(request, false),
  );

  return (
    <Box flexDirection="column">
      <Table
        data={tableData}
        columns={['method', 'url', 'status', 'time']}
        header={RequestTableHeader}
        cell={RequestTableCell}
        initialIndex={selectedIndex}
        onSelectionChange={setSelectedIndex}
        actions={[
          {
            key: 'enter',
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
        ]}
      />
    </Box>
  );
};
