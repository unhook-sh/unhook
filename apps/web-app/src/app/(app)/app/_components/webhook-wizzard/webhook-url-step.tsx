import { Alert, AlertDescription, AlertTitle } from '@unhook/ui/alert';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Icons } from '@unhook/ui/custom/icons';
import { Input } from '@unhook/ui/input';
import { Label } from '@unhook/ui/label';
import { Textarea } from '@unhook/ui/textarea';
import { unwrap } from '@unhook/utils';
import { useEffect, useState } from 'react';

interface WebhookUrlStepProps {
  webhookUrl: string;
  source?: string;
  apiUrl?: string;
  webhookName?: string;
}

export function WebhookUrlStep({ webhookUrl, source }: WebhookUrlStepProps) {
  const [serviceName, setServiceName] = useState(source);

  useEffect(() => {
    if (source && source !== serviceName) {
      setServiceName(source);
    }
  }, [source, serviceName]);

  const curlCommand = `curl -X POST ${webhookUrl}?source=unhook_curl -H "Content-Type: application/json" -d '{"type": "test.command", "data": { "message": "Hello, world!" }}'`;

  const minimalConfig = unwrap`webhookUrl: ${webhookUrl}
  destination:
    - name: localhost
      url: http://localhost:3000/api/webhooks
  delivery:
    - source: ${serviceName || "'*'"}
      destination: localhost`;

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

      <div className="flex gap-1 w-full flex-col">
        <Label>Service Name (optional)</Label>
        <Input
          aria-label="Service name"
          className="w-full"
          onChange={(e) => setServiceName(e.target.value)}
          placeholder="e.g., Stripe, Clerk, GitHub"
          value={serviceName}
        />
      </div>

      <div className="flex gap-1 w-full flex-col">
        <Label>Test your webhook</Label>
        <div className="flex items-start gap-2 w-full">
          <Textarea
            aria-label="Curl test command"
            className="w-full font-mono text-xs resize-none"
            readOnly
            rows={3}
            value={curlCommand}
          />
          <CopyButton text={curlCommand} variant="outline" />
        </div>
      </div>

      <div className="flex gap-1 w-full flex-col">
        <Label>Configuration (unhook.yml)</Label>
        <div className="flex items-start gap-2 w-full">
          <Textarea
            aria-label="Minimal YAML configuration"
            className="w-full font-mono text-xs resize-none"
            readOnly
            rows={8}
            value={minimalConfig}
          />
          <CopyButton text={minimalConfig} variant="outline" />
        </div>
      </div>

      <Alert>
        <Icons.Info className="size-4" />
        <AlertTitle>Next step</AlertTitle>
        <AlertDescription>
          To complete onboarding, copy the URL above and add it to your{' '}
          {serviceName} webhook settings to start receiving webhooks. You can
          also copy the configuration above to set up local forwarding.
        </AlertDescription>
      </Alert>
    </div>
  );
}
