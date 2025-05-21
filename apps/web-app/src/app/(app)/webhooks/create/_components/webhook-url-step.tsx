import { Alert, AlertDescription } from '@unhook/ui/components/alert';
import { Input } from '@unhook/ui/components/input';
import { Label } from '@unhook/ui/components/label';
import { CopyButton } from '@unhook/ui/custom/copy-button';

interface WebhookUrlStepProps {
  webhookUrl: string;
  from: string;
}

export function WebhookUrlStep({ webhookUrl, from }: WebhookUrlStepProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1 w-full flex-col">
        <Label>Webhook URL</Label>
        <div className="flex items-center gap-2 w-full">
          <Input
            value={webhookUrl}
            readOnly
            aria-label="Webhook URL"
            className="w-full"
          />
          <CopyButton text={webhookUrl} variant="outline" />
        </div>
      </div>
      <Alert>
        <AlertDescription>
          Add this URL to your {from} webhook settings, to start receiving
          webhooks.
        </AlertDescription>
      </Alert>
    </div>
  );
}
