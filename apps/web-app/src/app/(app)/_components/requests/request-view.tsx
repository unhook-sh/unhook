'use client';

import { api } from '@unhook/api/client';
import type { RequestType } from '@unhook/db/schema';
import { useSubscription } from '@unhook/db/supabase/client';
import { Button } from '@unhook/ui/components/button';
import { Input } from '@unhook/ui/components/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@unhook/ui/components/tooltip';
import { Filter, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import { FilterArea } from '~/app/(app)/_components/requests/filter-area';
import { RequestDetails } from '~/app/(app)/_components/requests/request-details';
import { RequestList } from '~/app/(app)/_components/requests/request-list';
import { RequestMetadata } from '~/app/(app)/_components/requests/request-metadata';
import { RequestTimeline } from '~/app/(app)/_components/requests/request-timeline';
import { useMediaQuery } from '~/hooks/use-mobile';

// Update the LogView component to handle showing/hiding the filter area
export function RequestView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RequestType | null>(
    null,
  );
  const [showDetails, setShowDetails] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [requests, { isLoading, refetch }] =
    api.requests.all.useSuspenseQuery();

  useSubscription({
    event: '*',
    onDelete: () => {
      console.log('onDelete');
      void refetch();
    },
    onError: (error) => {
      console.error('Subscription error:', error);
    },
    onInsert: () => {
      console.log('onInsert');
      void refetch();
    },
    onStatusChange: (newStatus) => {
      console.log('Subscription status:', newStatus);
    },
    onUpdate: () => {
      console.log('onUpdate');
      void refetch();
    },
    table: 'requests',
  });

  const filteredRequests = requests.filter(
    (request) =>
      request.to.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.request?.method
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const handleRequestSelect = (request: RequestType) => {
    setSelectedRequest(request);
    setShowDetails(true);
    if (!isMobile) {
      setShowMetadata(true);
    }
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
  };

  const handleCloseMetadata = () => {
    setShowMetadata(false);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="flex flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Requests</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search requests..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  size="icon"
                  onClick={toggleFilters}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Filter</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="default">Live</Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {showFilters && <FilterArea className="w-[280px] border-r" />}

        <div className="flex flex-1 flex-col overflow-hidden">
          <RequestTimeline />

          <div className="flex flex-1 overflow-hidden">
            <div
              className={`flex flex-1 flex-col overflow-hidden ${showMetadata ? 'md:w-[60%]' : 'w-full'}`}
            >
              <RequestList
                requests={filteredRequests}
                isLoading={isLoading}
                onSelectRequest={handleRequestSelect}
                selectedRequestId={selectedRequest?.id}
              />

              {showDetails && selectedRequest && (
                <RequestDetails
                  request={selectedRequest}
                  onClose={handleCloseDetails}
                />
              )}
            </div>

            {showMetadata && selectedRequest && (
              <div className="hidden border-l md:block md:w-[40%]">
                <RequestMetadata
                  request={selectedRequest}
                  onClose={handleCloseMetadata}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
