import { ChartAreaInteractive } from './_components/chart-area-interactive';
import { RecentEventsTable } from './_components/recent-events-table';
import { SectionCards } from './_components/section-cards';

export default function Page() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SectionCards />
      <ChartAreaInteractive />
      <RecentEventsTable />
    </div>
  );
}
