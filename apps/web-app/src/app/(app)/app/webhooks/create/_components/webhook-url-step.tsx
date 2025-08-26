import { Alert, AlertDescription } from '@unhook/ui/alert';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Input } from '@unhook/ui/input';
import { Label } from '@unhook/ui/label';

interface WebhookUrlStepProps {
  webhookUrl: string;
  source: string;
  orgName?: string;
  webhookName?: string;
}

export function WebhookUrlStep({
  webhookUrl,
  source,
  orgName,
  webhookName,
}: WebhookUrlStepProps) {
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
          {orgName ? (
            <>
              Your webhook is available at{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                https://unhook.sh/{orgName}/{webhookName}
              </code>
              . Add this URL to your {source} webhook settings to start
              receiving webhooks.
            </>
          ) : (
            <>
              Add this URL to your {source} webhook settings to start receiving
              webhooks.
            </>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
