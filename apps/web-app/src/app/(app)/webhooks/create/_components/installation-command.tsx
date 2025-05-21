import { Alert, AlertDescription } from '@unhook/ui/components/alert';
import { Label } from '@unhook/ui/components/label';
import { Textarea } from '@unhook/ui/components/textarea';
import { CopyButton } from '@unhook/ui/custom/copy-button';

interface InstallationCommandProps {
  authCode: string;
  webhookId: string;
  source: string;
}

export function InstallationCommand({
  authCode,
  webhookId,
  source,
}: InstallationCommandProps) {
  const command = `npx @unhook/cli init --webhook ${webhookId}${source ? ` --source ${source}` : ''} --code ${authCode}`;

  return (
    <div className="space-y-2">
      <Label>Local CLI Installation</Label>
      <div className="flex gap-2">
        <Textarea
          value={command}
          readOnly
          className="font-mono text-sm resize-none"
          rows={1}
        />
        <CopyButton text={command} variant="outline" />
      </div>
      <Alert>
        <AlertDescription>
          Run this command in your terminal to install the Unhook CLI and start
          receiving webhooks.
        </AlertDescription>
      </Alert>
    </div>
  );
}
