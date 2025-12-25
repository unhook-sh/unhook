import { ChartAreaInteractive } from './_components/chart-area-interactive';
import { SectionCards } from './_components/section-cards';
import { WebhooksAccordion } from './_components/webhooks-accordion';

export default function Page() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SectionCards />
      <ChartAreaInteractive />
      <WebhooksAccordion />
    </div>
  );
}
