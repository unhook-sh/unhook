'use client';

import type { RequestType } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/components/badge';
import { Skeleton } from '@unhook/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/components/table';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RequestDetails } from '~/app/(app)/_components/requests/request-details';
import { RequestMetadata } from '~/app/(app)/_components/requests/request-metadata';

interface WebhookRequestsTableProps {
  webhookId: string;
  limit?: number;
}

export function WebhookRequestsTable({
  webhookId,
  limit,
}: WebhookRequestsTableProps) {
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequestIndex, setSelectedRequestIndex] = useState<
    number | null
  >(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Generate mock data
        const mockRequests: RequestType[] = Array.from({ length: 20 }).map(
          (_, i) => {
            const timestamp = new Date(
              Date.now() - Math.random() * 1000 * 60 * 60 * 24,
            );
            const status = Math.random() > 0.8 ? 'failed' : 'completed';
            const responseStatus =
              status === 'failed'
                ? 400 + Math.floor(Math.random() * 100)
                : 200 + Math.floor(Math.random() * 100);

            return {
              id: `req_${i}_${Date.now()}`,
              webhookId,
              apiKey: 'pk_test_123',
              eventId: null,
              status,
              timestamp,
              createdAt: timestamp,
              userId: 'user_123',
              orgId: 'org_123',
              connectionId: null,
              request: {
                id: `req_${i}_${Date.now()}`,
                method: ['GET', 'POST', 'PUT', 'DELETE'][
                  Math.floor(Math.random() * 4)
                ] as string,
                sourceUrl: 'https://example.com',
                headers: {
                  'content-type': 'application/json',
                  'user-agent': 'Svix-Webhooks/1.62.0',
                },
                size: Math.floor(Math.random() * 1000),
                contentType: 'application/json',
                clientIp: '127.0.0.1',
              },
              source: '*',
              destination: {
                name: ['/api/data', '/api/users', '/api/auth', '/api/webhook'][
                  Math.floor(Math.random() * 4)
                ] as string,
                url: 'https://example.com',
              },
              failedReason: status === 'failed' ? 'Connection error' : null,
              completedAt: status === 'completed' ? new Date() : null,
              response:
                status === 'completed'
                  ? {
                      status: responseStatus,
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ success: responseStatus < 400 }),
                    }
                  : null,
              responseTimeMs: Math.floor(Math.random() * 1000),
            } satisfies RequestType;
          },
        );

        // Sort by timestamp (newest first)
        mockRequests.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );

        setRequests(limit ? mockRequests.slice(0, limit) : mockRequests);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [webhookId, limit]);

  const handleRequestClick = (index: number) => {
    setSelectedRequestIndex(index);
    setShowDetails(true);
    setShowMetadata(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
  };

  const handleCloseMetadata = () => {
    setShowMetadata(false);
    setSelectedRequestIndex(null);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (selectedRequestIndex === null) return;

    if (direction === 'prev' && selectedRequestIndex > 0) {
      setSelectedRequestIndex(selectedRequestIndex - 1);
    } else if (
      direction === 'next' &&
      selectedRequestIndex < requests.length - 1
    ) {
      setSelectedRequestIndex(selectedRequestIndex + 1);
    }
  };

  const selectedRequest =
    selectedRequestIndex !== null ? requests[selectedRequestIndex] : null;

  return (
    <div className="relative">
      <div className="flex h-full">
        <div
          className={`flex-1 overflow-hidden ${showMetadata ? 'md:w-[60%]' : 'w-full'}`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead className="w-[100px]">Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [
                  'skeleton-1',
                  'skeleton-2',
                  'skeleton-3',
                  'skeleton-4',
                  'skeleton-5',
                ].map((index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-5 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[60px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[60px]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No requests found.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request, index) => (
                  <TableRow
                    key={request.id}
                    className={`cursor-pointer hover:bg-muted/50 ${selectedRequestIndex === index ? 'bg-muted' : ''}`}
                    onClick={() => handleRequestClick(index)}
                  >
                    <TableCell className="font-mono text-xs">
                      {format(request.createdAt, 'HH:mm:ss.SS')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {request.request.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate font-mono text-xs">
                      {request.destination.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {request.status === 'failed' && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <Badge
                          variant={
                            request.status === 'failed'
                              ? 'destructive'
                              : 'outline'
                          }
                          className={
                            request.status === 'completed'
                              ? 'bg-green-500/20 text-green-500 hover:bg-green-500/20 hover:text-green-500'
                              : ''
                          }
                        >
                          {request.response?.status ?? 'Pending'}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {showDetails && selectedRequest && (
            <RequestDetails
              request={selectedRequest}
              onClose={handleCloseDetails}
            />
          )}
        </div>

        {showMetadata && selectedRequest && (
          <div className="hidden border-l border-zinc-800 md:block md:w-[40%]">
            <RequestMetadata
              request={selectedRequest}
              onClose={handleCloseMetadata}
              onNavigate={handleNavigate}
              hasPrev={
                selectedRequestIndex !== null && selectedRequestIndex > 0
              }
              hasNext={
                selectedRequestIndex !== null &&
                selectedRequestIndex < requests.length - 1
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
