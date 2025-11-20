import { Plus } from 'lucide-react';
import { WebhooksTable } from './_components/webhooks-table';
import { CreateWebhookDialog } from './create-webhook-dialog';

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="text-2xl font-bold">Webhooks</div>
          <div className="text-sm text-muted-foreground">
            Manage your webhooks and view webhook delivery details.
          </div>
        </div>
        <CreateWebhookDialog>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Create Webhook
          </button>
        </CreateWebhookDialog>
      </div>

      <WebhooksTable />
    </div>
  );
}
