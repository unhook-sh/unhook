import { Alert, AlertDescription } from '@unhook/ui/alert';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Input } from '@unhook/ui/input';
import { Label } from '@unhook/ui/label';

interface WebhookUrlStepProps {
  webhookUrl: string;
  source: string;
}

export function WebhookUrlStep({ webhookUrl, source }: WebhookUrlStepProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1 w-full flex-col">
        <Label>Webhook URL</Label>
        <div className="flex items-center gap-2 w-full">
          <Input
            aria-label="Webhook URL"
            className="w-full"
            readOnly
            value={webhookUrl}
          />
          <CopyButton text={webhookUrl} variant="outline" />
        </div>
      </div>
      <Alert>
        <AlertDescription>
          Add this URL to your {source} webhook settings, to start receiving
          webhooks.
        </AlertDescription>
      </Alert>
    </div>
  );
}
