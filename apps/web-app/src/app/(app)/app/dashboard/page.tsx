import { WebhooksTable } from '../webhooks/_components/webhooks-table';
import { ApiKeyCard } from './_components/api-key-card';
import { ChartAreaInteractive } from './_components/chart-area-interactive';

export default function Page() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <WebhooksTable />
      <ChartAreaInteractive />
      <ApiKeyCard />
    </div>
  );
}
