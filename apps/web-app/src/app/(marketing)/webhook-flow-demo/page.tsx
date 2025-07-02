import { WebhookFlowGraphic } from '../_components/webhook-flow-graphic';

export default function WebhookFlowDemoPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Webhook Flow Graphic Demo
          </h1>
          <p className="text-zinc-400">
            Showcase of different webhook provider integrations
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <WebhookFlowGraphic provider="stripe" />
          <WebhookFlowGraphic provider="github" />
          <WebhookFlowGraphic provider="clerk" />
          <WebhookFlowGraphic provider="slack" />
        </div>
      </div>
    </div>
  );
}
