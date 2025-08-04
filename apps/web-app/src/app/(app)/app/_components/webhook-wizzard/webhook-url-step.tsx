import { Alert, AlertDescription, AlertTitle } from '@unhook/ui/alert';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Icons } from '@unhook/ui/custom/icons';
import { Input } from '@unhook/ui/input';
import { Label } from '@unhook/ui/label';

interface WebhookUrlStepProps {
  webhookUrl: string;
  source: string;
}

export function WebhookUrlStep({ webhookUrl, source }: WebhookUrlStepProps) {
  const serviceName = source || 'webhook provider';

  return (
    <div className="space-y-4">
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
        <Icons.Info className="size-4" />
        <AlertTitle>Next step</AlertTitle>
        <AlertDescription>
          To complete onboarding, copy the URL above and add it to your{' '}
          {serviceName} webhook settings to start receiving webhooks.
        </AlertDescription>
      </Alert>
    </div>
  );
}
