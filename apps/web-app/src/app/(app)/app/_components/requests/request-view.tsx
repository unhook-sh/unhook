'use client';

import { MetricButton } from '@unhook/analytics/components';
import { api } from '@unhook/api/react';
import type { RequestTypeWithEventType } from '@unhook/db/schema';
import { Input } from '@unhook/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@unhook/ui/tooltip';
import { Filter, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import { FilterArea } from '~/app/(app)/app/_components/requests/filter-area';
import { RequestDetails } from '~/app/(app)/app/_components/requests/request-details';
import { RequestList } from '~/app/(app)/app/_components/requests/request-list';
import { RequestMetadata } from '~/app/(app)/app/_components/requests/request-metadata';
import { RequestTimeline } from '~/app/(app)/app/_components/requests/request-timeline';
import { useMediaQuery } from '~/hooks/use-mobile';

// Update the LogView component to handle showing/hiding the filter area
export function RequestView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] =
    useState<RequestTypeWithEventType | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [requests, { isLoading, refetch }] =
    api.requests.allWithEvents.useSuspenseQuery();

  const filteredRequests = requests.filter((request) => {
    const name = request.destination?.name?.toLowerCase();
    const method = request.event?.originRequest?.method?.toLowerCase();
    if (!name || !method) {
      return false;
    }
    return (
      name.includes(searchQuery.toLowerCase()) ||
      method?.includes(searchQuery.toLowerCase())
    );
  });

  const handleRequestSelect = (request: RequestTypeWithEventType) => {
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
              className="pl-8"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requests..."
              type="search"
              value={searchQuery}
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <MetricButton
                  metric="request_view_refresh_clicked"
                  onClick={() => refetch()}
                  size="icon"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4" />
                </MetricButton>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <MetricButton
                  metric="request_view_filter_toggle_clicked"
                  onClick={toggleFilters}
                  size="icon"
                  variant={showFilters ? 'default' : 'outline'}
                >
                  <Filter className="h-4 w-4" />
                </MetricButton>
              </TooltipTrigger>
              <TooltipContent>Filter</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <MetricButton metric="request_view_live_clicked" variant="default">
            Live
          </MetricButton>
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
                isLoading={isLoading}
                onSelectRequest={handleRequestSelect}
                requests={filteredRequests}
                selectedRequestId={selectedRequest?.id}
              />

              {showDetails && selectedRequest && (
                <RequestDetails
                  onClose={handleCloseDetails}
                  request={selectedRequest}
                />
              )}
            </div>

            {showMetadata && selectedRequest && (
              <div className="hidden border-l md:block md:w-[40%]">
                <RequestMetadata
                  onClose={handleCloseMetadata}
                  request={selectedRequest}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
