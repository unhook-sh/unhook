import { H1, P } from '@unhook/ui/custom/typography';
import { WebhookPlayground } from './_components/webhook-playground';

export default function PlaygroundPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <H1>Webhook Playground</H1>
        <P className="text-muted-foreground">
          Test and send webhook events to your endpoints. Select a webhook,
          choose a service and event type, then send and monitor the results.
        </P>
      </div>
      <WebhookPlayground />
    </div>
  );
}
