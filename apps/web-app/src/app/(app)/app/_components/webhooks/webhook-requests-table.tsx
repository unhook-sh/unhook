'use client';

import { extractEventName } from '@unhook/client/utils/extract-event-name';
import type { RequestTypeWithEventType } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { Skeleton } from '@unhook/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/table';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RequestDetails } from '~/app/(app)/app/_components/requests/request-details';
import { RequestMetadata } from '~/app/(app)/app/_components/requests/request-metadata';

interface WebhookRequestsTableProps {
  webhookId: string;
  limit?: number;
}

export function WebhookRequestsTable({
  webhookId,
  limit,
}: WebhookRequestsTableProps) {
  const [requests, setRequests] = useState<RequestTypeWithEventType[]>([]);
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
        const mockRequests: RequestTypeWithEventType[] = Array.from({
          length: 20,
        }).map((_, i) => {
          const timestamp = new Date(
            Date.now() - Math.random() * 1000 * 60 * 60 * 24,
          );
          const status = Math.random() > 0.8 ? 'failed' : 'completed';
          const responseStatus =
            status === 'failed'
              ? 400 + Math.floor(Math.random() * 100)
              : 200 + Math.floor(Math.random() * 100);

          // Generate mock webhook bodies with different event types
          const mockEvents = [
            {
              data: { email: 'test@example.com', id: 'user_123' },
              event: 'user.created',
            },
            {
              data: { amount: 1000, currency: 'USD' },
              event: 'payment.completed',
            },
            { data: { orderId: 'order_456' }, event: 'order.placed' },
            {
              data: { customerId: 'cust_789' },
              event_type: 'customer.updated',
            },
            { data: { invoiceId: 'inv_012' }, type: 'invoice.paid' },
            {
              data: { subscriptionId: 'sub_345' },
              eventType: 'subscription.cancelled',
            },
          ];
          const mockBody =
            mockEvents[Math.floor(Math.random() * mockEvents.length)];

          return {
            apiKeyId: 'pk_test_123',
            completedAt: status === 'completed' ? new Date() : null,
            connectionId: null,
            createdAt: timestamp,
            destination: {
              name: ['/api/data', '/api/users', '/api/auth', '/api/webhook'][
                Math.floor(Math.random() * 4)
              ] as string,
              url: 'https://example.com',
            },
            destinationName: [
              '/api/data',
              '/api/users',
              '/api/auth',
              '/api/webhook',
            ][Math.floor(Math.random() * 4)] as string,
            destinationUrl: 'https://example.com',
            event: {
              apiKeyId: 'pk_test_123',
              createdAt: timestamp,
              failedReason: null,
              id: `evt_${i}_${Date.now()}`,
              maxRetries: 3,
              orgId: 'org_123',
              originRequest: {
                body: JSON.stringify(mockBody),
                clientIp: '127.0.0.1',
                contentType: 'application/json',
                headers: {
                  'content-type': 'application/json',
                  'user-agent': 'Svix-Webhooks/1.62.0',
                },
                id: `req_${i}_${Date.now()}`,
                method: ['GET', 'POST', 'PUT', 'DELETE'][
                  Math.floor(Math.random() * 4)
                ] as string,
                size: Math.floor(Math.random() * 1000),
                sourceUrl: 'https://example.com',
              },
              retryCount: 0,
              source: '*',
              status: 'completed' as const,
              timestamp,
              updatedAt: null,
              userId: 'user_123',
              webhookId,
            },
            eventId: null,
            failedReason: status === 'failed' ? 'Connection error' : null,
            id: `req_${i}_${Date.now()}`,
            orgId: 'org_123',
            response:
              status === 'completed'
                ? {
                    body: JSON.stringify({ success: responseStatus < 400 }),
                    headers: { 'content-type': 'application/json' },
                    status: responseStatus,
                  }
                : null,
            responseTimeMs: Math.floor(Math.random() * 1000),
            source: '*',
            status,
            timestamp,
            userId: 'user_123',
            webhookId,
          } as RequestTypeWithEventType;
        });

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
                <TableHead>Event & Path</TableHead>
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
                  <TableCell className="h-24 text-center" colSpan={4}>
                    No requests found.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request, index) => (
                  <TableRow
                    className={`cursor-pointer hover:bg-muted/50 ${selectedRequestIndex === index ? 'bg-muted' : ''}`}
                    key={request.id}
                    onClick={() => handleRequestClick(index)}
                  >
                    <TableCell className="font-mono text-xs">
                      {format(request.createdAt, 'HH:mm:ss.SS')}
                    </TableCell>
                    <TableCell>
                      <Badge className="font-mono" variant="outline">
                        {request.event?.originRequest?.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="space-y-1">
                        {(() => {
                          const eventName = extractEventName(
                            request.event?.originRequest?.body,
                          );
                          return eventName ? (
                            <div className="text-sm font-medium text-foreground">
                              {eventName}
                            </div>
                          ) : null;
                        })()}
                        <div className="font-mono text-xs text-muted-foreground truncate">
                          {request.destination.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {request.status === 'failed' && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <Badge
                          className={
                            request.status === 'completed'
                              ? 'bg-green-500/20 text-green-500 hover:bg-green-500/20 hover:text-green-500'
                              : ''
                          }
                          variant={
                            request.status === 'failed'
                              ? 'destructive'
                              : 'outline'
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
              onClose={handleCloseDetails}
              request={selectedRequest}
            />
          )}
        </div>

        {showMetadata && selectedRequest && (
          <div className="hidden border-l border-zinc-800 md:block md:w-[40%]">
            <RequestMetadata
              hasNext={
                selectedRequestIndex !== null &&
                selectedRequestIndex < requests.length - 1
              }
              hasPrev={
                selectedRequestIndex !== null && selectedRequestIndex > 0
              }
              onClose={handleCloseMetadata}
              onNavigate={handleNavigate}
              request={selectedRequest}
            />
          </div>
        )}
      </div>
    </div>
  );
}
