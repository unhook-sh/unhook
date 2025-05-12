import { Alert, AlertDescription } from '@unhook/ui/components/alert';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { H4, P } from '@unhook/ui/custom/typography';

interface WebhookUrlStepProps {
  webhookUrl: string;
}

export function WebhookUrlStep({ webhookUrl }: WebhookUrlStepProps) {
  return (
    <div className="space-y-2">
      <H4>Your Webhook URL</H4>
      <P>
        Here's your unique webhook URL. Use this in your webhook provider
        settings.
      </P>
      <div className="flex items-center gap-2">
        <input
          className="w-full font-mono text-base bg-muted rounded px-3 py-2 border border-input"
          value={webhookUrl}
          readOnly
          aria-label="Webhook URL"
        />
        <CopyButton text={webhookUrl} size="sm" variant="outline" />
      </div>
      <Alert>
        <AlertDescription>
          You can share this URL with your team—Unhook will route webhooks to
          the right developer automatically.
        </AlertDescription>
      </Alert>
    </div>
  );
}
