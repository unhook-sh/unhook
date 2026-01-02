'use client';

import { CopyButton } from '@unhook/ui/custom/copy-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@unhook/ui/dialog';
import { CodeBlock, CodeBlockCode } from '@unhook/ui/magicui/code-block';
import { useTheme } from 'next-themes';

interface WebhookConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhookUrl: string;
  webhookName: string;
}

export function WebhookConfigDialog({
  open,
  onOpenChange,
  webhookUrl,
  webhookName,
}: WebhookConfigDialogProps) {
  const { theme } = useTheme();

  const generateUnhookYml = () => {
    return `# Unhook Configuration
# This file configures how Unhook delivers webhooks to your local development environment
# Save this as unhook.yml or unhook.yaml in your project root

webhookUrl: ${webhookUrl}

# Define where to deliver webhooks
destination:
  - name: local
    url: http://localhost:3000/api/webhooks
    ping: true  # Health check endpoint

# Define which webhook sources to accept
delivery:
  - destination: local
    source: "*"  # Accept all sources, or specify: "stripe", "github", "clerk", etc.

# Optional: Configure webhook sources with specific settings
# source:
#   - name: stripe
#     secret: your-stripe-webhook-secret
#     verification: true
#   - name: github
#     secret: your-github-webhook-secret
#     verification: true

# Optional: Server configuration
# server:
#   apiUrl: https://api.unhook.sh
#   dashboardUrl: https://unhook.sh

# Optional: Enable debug mode
# debug: true

# Optional: Disable telemetry
# telemetry: false`;
  };

  const configContent = generateUnhookYml();

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Unhook Configuration</DialogTitle>
          <DialogDescription>
            Copy this configuration to your{' '}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              unhook.yml
            </code>{' '}
            file to start receiving webhooks for <strong>{webhookName}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="bg-muted rounded-lg border flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
              <span className="text-sm font-medium text-foreground">
                unhook.yml
              </span>
              <CopyButton
                className="gap-2"
                size="sm"
                text={configContent}
                variant="outline"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <CodeBlock className="border-0 rounded-none bg-transparent">
                <CodeBlockCode
                  code={configContent}
                  language="yaml"
                  theme={theme === 'dark' ? 'github-dark' : 'github-light'}
                />
              </CodeBlock>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
