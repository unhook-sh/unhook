'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@unhook/ui/tabs';
import { DeliveriesTab } from './deliveries-tab';
import { useEvent } from './event-context';
import { EventDetailsTab } from './event-details-tab';
import { HeadersTab } from './headers-tab';
import { PayloadTab } from './payload-tab';

export function EventTabs() {
  const { event, headers, payload } = useEvent();

  return (
    <Tabs defaultValue="payload">
      <TabsList>
        <TabsTrigger value="payload">Payload</TabsTrigger>
        <TabsTrigger value="headers">Headers</TabsTrigger>
        <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>

      <TabsContent className="mt-4" value="payload">
        <PayloadTab payload={payload} />
      </TabsContent>

      <TabsContent className="mt-4" value="headers">
        <HeadersTab headers={headers} />
      </TabsContent>

      <TabsContent className="mt-4" value="details">
        <EventDetailsTab />
      </TabsContent>

      <TabsContent className="mt-4" value="deliveries">
        <DeliveriesTab requests={event.requests || []} />
      </TabsContent>
    </Tabs>
  );
}
