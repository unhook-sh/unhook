'use client';

import { Alert, AlertDescription } from '@unhook/ui/alert';
import { Badge } from '@unhook/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Icons } from '@unhook/ui/custom/icons';
import { H4 } from '@unhook/ui/custom/typography';
import { Separator } from '@unhook/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@unhook/ui/tabs';
import { Textarea } from '@unhook/ui/textarea';
import { FileText, HelpCircle, Lightbulb, Terminal } from 'lucide-react';
import { useState } from 'react';

interface UnhookConfigStepProps {
  webhookUrl: string;
  source?: string;
  orgName?: string;
  webhookName?: string;
}

export function UnhookConfigStep({
  webhookUrl,
  source,
}: UnhookConfigStepProps) {
  const [selectedTab, setSelectedTab] = useState('cli');

  // Generate the unhook.yml content
  const generateUnhookYml = () => {
    return `# Unhook Configuration
# This file configures how Unhook delivers webhooks to your local development environment

webhookUrl: ${webhookUrl}

# Define where to deliver webhooks
destination:
  - name: local
    url: http://localhost:3000/api/webhooks
    ping: true  # Health check endpoint

# Define which webhook sources to accept
delivery:
  - destination: local
    source: "${source || '*'}"  # Accept all sources, or specify: "stripe", "github", "clerk", etc.

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

  const unhookYmlContent = generateUnhookYml();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Local Development Setup
        </CardTitle>
        <CardDescription>
          Create an{' '}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">
            unhook.yml
          </code>{' '}
          file in your project root to start receiving webhooks locally
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration File */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-xs font-medium text-blue-600">
                  1
                </div>
                <span className="text-sm">
                  Create{' '}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    unhook.yml
                  </code>{' '}
                  in your project root
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-xs font-medium text-blue-600">
                  2
                </div>
                <span className="text-sm">Copy the configuration below</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-xs font-medium text-blue-600">
                  3
                </div>
                <span className="text-sm">
                  Start the Unhook CLI or extension
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Configuration File</span>
                <CopyButton
                  size="sm"
                  text={unhookYmlContent}
                  variant="outline"
                />
              </div>
              <Textarea
                className="font-mono text-xs resize-none min-h-[250px]"
                readOnly
                value={unhookYmlContent}
              />
            </div>
          </div>

          {/* Getting Started */}
          <div className="space-y-4">
            <H4 className="text-sm">Choose Your Method</H4>
            <Tabs
              className="w-full"
              onValueChange={setSelectedTab}
              value={selectedTab}
            >
              <TabsList className="grid w-full grid-cols-3 gap-1">
                <TabsTrigger className="text-xs" value="cli">
                  <Terminal className="mr-1 h-3 w-3" />
                  CLI
                </TabsTrigger>
                <TabsTrigger className="text-xs" value="vscode">
                  <Icons.FunctionSquare className="mr-1 h-3 w-3" />
                  VS Code
                </TabsTrigger>
                <TabsTrigger className="text-xs" value="cursor">
                  <Icons.Sparkles className="mr-1 h-3 w-3" />
                  Cursor
                </TabsTrigger>
              </TabsList>

              <TabsContent className="space-y-3 mt-4" value="cli">
                <div className="space-y-2">
                  <H4 className="text-sm">Install and Run CLI</H4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Textarea
                        className="font-mono text-xs resize-none"
                        readOnly
                        rows={1}
                        value="npx @unhook/cli listen"
                      />
                      <CopyButton
                        size="sm"
                        text="npx @unhook/cli listen"
                        variant="outline"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Run this command in your project directory to start
                      receiving webhooks
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent className="space-y-3 mt-4" value="vscode">
                <div className="space-y-2">
                  <H4 className="text-sm">Install VS Code Extension</H4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Textarea
                        className="font-mono text-xs resize-none"
                        readOnly
                        rows={1}
                        value="code --install-extension unhook.unhook-vscode"
                      />
                      <CopyButton
                        size="sm"
                        text="code --install-extension unhook.unhook-vscode"
                        variant="outline"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Install the extension and it will automatically detect
                      your unhook.yml
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent className="space-y-3 mt-4" value="cursor">
                <div className="space-y-2">
                  <H4 className="text-sm">Install Cursor Extension</H4>
                  <p className="text-xs text-muted-foreground">
                    Search for "Unhook" in Cursor's extension marketplace and
                    install it. The extension will automatically detect your
                    unhook.yml configuration.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="space-y-3">
              <H4 className="text-sm">Test Your Setup</H4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="text-xs" variant="secondary">
                    <Lightbulb className="mr-1 h-3 w-3" />
                    Pro Tip
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Send a test request to your webhook URL to verify everything
                    is working
                  </span>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    className="font-mono text-xs resize-none"
                    readOnly
                    rows={1}
                    value={webhookUrl}
                  />
                  <CopyButton size="sm" text={webhookUrl} variant="outline" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <Alert>
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            Need help? Check out our{' '}
            <a
              className="underline hover:no-underline"
              href="https://docs.unhook.sh"
              rel="noopener noreferrer"
              target="_blank"
            >
              documentation
            </a>
            , join our{' '}
            <a
              className="underline hover:no-underline"
              href="https://discord.gg/unhook"
              rel="noopener noreferrer"
              target="_blank"
            >
              Discord community
            </a>
            , or{' '}
            <a
              className="underline hover:no-underline"
              href="https://github.com/unhook-sh/unhook/issues"
              rel="noopener noreferrer"
              target="_blank"
            >
              report an issue
            </a>
            .
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
