'use client';

import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@acme/ui/components/badge';
import { Skeleton } from '@acme/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@acme/ui/components/table';
import { RequestDetails } from '~/components/requests/request-details';
import { RequestMetadata } from '~/components/requests/request-metadata';
import type { LogEntry } from '~/types/logs';

interface TunnelRequestsTableProps {
  tunnelId: string;
  limit?: number;
}

export function TunnelRequestsTable({
  tunnelId,
  limit,
}: TunnelRequestsTableProps) {
  const [requests, setRequests] = useState<LogEntry[]>([]);
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
        const mockRequests: LogEntry[] = Array.from({ length: 20 }).map(
          (_, i) => {
            const timestamp = new Date(
              Date.now() - Math.random() * 1000 * 60 * 60 * 24,
            );
            const status =
              Math.random() > 0.8
                ? Math.floor(Math.random() * 100) + 400
                : Math.floor(Math.random() * 100) + 200;

            return {
              id: `req_${i}_${Date.now()}`,
              timestamp: format(timestamp, 'HH:mm:ss.SS'),
              method: ['GET', 'POST', 'PUT', 'DELETE'][
                Math.floor(Math.random() * 4)
              ],
              status,
              host: `tunnel-${tunnelId.substring(0, 6)}.example.com`,
              path: ['/api/data', '/api/users', '/api/auth', '/api/webhook'][
                Math.floor(Math.random() * 4)
              ],
              request: `req Request { method: '${['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)]}' }`,
              level: status >= 400 ? 'error' : 'info',
              userAgent: 'Svix-Webhooks/1.62.0 (sender-9Y...)',
              location: 'Dublin, Ireland (dub1)',
              searchParams: {
                key: 'pk_123',
                endpoint: 'webhooks/clerk',
                port: '3000',
              },
              externalApis: [
                {
                  method: 'POST',
                  url: 'c4508560513171456.ingest.us.sumologic.com',
                  status: 200,
                },
              ],
              details: {
                request: {
                  method: ['GET', 'POST', 'PUT', 'DELETE'][
                    Math.floor(Math.random() * 4)
                  ],
                  url: `https://tunnel-${tunnelId.substring(0, 6)}.example.com/api/data`,
                  headers: {
                    'content-type': 'application/json',
                    'user-agent': 'Svix-Webhooks/1.62.0 (sender-9Y...)',
                    'x-clerk-auth-reason': 'dev-browser-missing',
                    'svix-id': 'msg_2vEoS4gtL6R096JSYNvMv0oHaIs',
                    'svix-timestamp': '1743719590',
                  },
                },
                response: {
                  status,
                  headers: {
                    'content-type': 'application/json',
                  },
                  body: {
                    success: status < 400,
                    message: status < 400 ? 'Success' : 'Error',
                  },
                },
                headers: {
                  'content-type': 'application/json',
                  'user-agent': 'Svix-Webhooks/1.62.0 (sender-9Y...)',
                  'x-clerk-auth-reason': 'dev-browser-missing',
                  'svix-id': 'msg_2vEoS4gtL6R096JSYNvMv0oHaIs',
                  'svix-timestamp': '1743719590',
                },
              },
            };
          },
        );

        // Sort by timestamp (newest first)
        mockRequests.sort((a, b) => {
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });

        setRequests(limit ? mockRequests.slice(0, limit) : mockRequests);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [tunnelId, limit]);

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
                Array.from({ length: limit || 5 }).map((_, i) => (
                  <TableRow key={i}>
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
                      {request.timestamp}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {request.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[300px]">
                      {request.path}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {request.status >= 400 && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <Badge
                          variant={
                            request.status >= 400 ? 'destructive' : 'outline'
                          }
                          className={
                            request.status < 400
                              ? 'bg-green-500/20 text-green-500 hover:bg-green-500/20 hover:text-green-500'
                              : ''
                          }
                        >
                          {request.status}
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
