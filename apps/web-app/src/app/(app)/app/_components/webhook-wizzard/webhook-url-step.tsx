import { Alert, AlertDescription, AlertTitle } from '@unhook/ui/alert';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Icons } from '@unhook/ui/custom/icons';
import { Input } from '@unhook/ui/input';
import { Label } from '@unhook/ui/label';
import { Textarea } from '@unhook/ui/textarea';

interface WebhookUrlStepProps {
  webhookUrl: string;
  source: string;
  webhookId: string;
  apiUrl: string;
}

export function WebhookUrlStep({
  webhookUrl,
  source,
  webhookId,
  apiUrl,
}: WebhookUrlStepProps) {
  const serviceName = source || 'webhook provider';
  const curlCommand = `curl -X POST ${apiUrl}/${webhookId}?source=${source || 'unhook_example'} -H "Content-Type: application/json" -d '{"type": "test.command", "data": { "message": "Hello, world!" }}'`;

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
        <Icons.Command className="size-4" />
        <AlertTitle>Send a test event</AlertTitle>
        <AlertDescription>
          Run this curl command in your terminal to send a test webhook event
          and verify your setup is working correctly.
        </AlertDescription>
      </Alert>

      <div className="flex gap-1 w-full flex-col">
        <Label>Test your webhook</Label>
        <div className="flex items-start gap-2 w-full">
          <Textarea
            aria-label="Curl test command"
            className="w-full font-mono text-sm resize-none"
            readOnly
            rows={3}
            value={curlCommand}
          />
          <CopyButton text={curlCommand} variant="outline" />
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
