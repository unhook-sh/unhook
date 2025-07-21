import { H1, P } from '@unhook/ui/custom/typography';
import { EventsTable } from './_components/events-table';

export default function EventsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <H1>Events</H1>
        <P className="text-muted-foreground">
          View and manage all webhook events received by your organization.
        </P>
      </div>
      <EventsTable />
    </div>
  );
}
