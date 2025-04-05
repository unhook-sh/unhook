import { Box } from 'ink';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Table } from '~/components/table';
import type { RouteProps } from '~/lib/router';
import { useSelectionStore } from '~/lib/store';
import type { RequestItem } from '~/types';
import { generateMockRequest } from '~/utils/request';
import {
  RequestTableCell,
  RequestTableHeader,
  RequestTableSkeleton,
} from './_components/table-cells';

export const RequestsPage: FC<RouteProps> = () => {
  const selectedIndex = useSelectionStore(
    (state) => state.selectedIndices.requests,
  );
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading requests
    const mockRequests = Array.from({ length: 10 }, () =>
      generateMockRequest(),
    );
    setTimeout(() => {
      setRequests(mockRequests);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return <RequestTableSkeleton />;
  }

  // const tableData = requests.map((request, index) =>
  //   requestToTableData(request, index === selectedIndex),
  // );
  const tableData: any[] = [];

  return (
    <Box flexDirection="column">
      <Table
        data={tableData}
        columns={['method', 'url', 'status', 'time']}
        header={RequestTableHeader}
        cell={RequestTableCell}
      />
    </Box>
  );
};
