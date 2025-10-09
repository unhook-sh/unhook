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
import { Button } from '@unhook/ui/components/button';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Icons } from '@unhook/ui/custom/icons';
import { H3, H4, P } from '@unhook/ui/custom/typography';
import { Separator } from '@unhook/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@unhook/ui/tabs';
import { Textarea } from '@unhook/ui/textarea';
import { BookOpen, FileText, HelpCircle, Terminal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { env } from '~/env.client';

interface LocalDevelopmentSetupProps {
  orgName: string;
  webhookName: string;
  redirectTo?: string;
  source?: string;
}

export function LocalDevelopmentSetup({
  orgName,
  webhookName,
  redirectTo,
  source,
}: LocalDevelopmentSetupProps) {
  const router = useRouter();
  // Default to VSCode tab if coming from extension, otherwise CLI
  const [selectedTab, setSelectedTab] = useState(
    source === 'extension' ? 'vscode' : 'cli',
  );

  const webhookUrl = `${env.NEXT_PUBLIC_WEBHOOK_BASE_URL || env.NEXT_PUBLIC_API_URL || 'https://unhook.sh'}/${orgName}/${webhookName}`;

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

  const handleContinue = () => {
    const params = new URLSearchParams({
      orgName,
      webhookName,
    });

    if (redirectTo) {
      params.append('redirectTo', redirectTo);
    }
    if (source) {
      params.append('source', source);
    }

    router.push(`/app/onboarding/success?${params.toString()}`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icons.Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
        <H3>Local Development Setup 🚀</H3>
        <P className="text-muted-foreground max-w-2xl mx-auto">
          {source === 'extension'
            ? "Great! Your webhook is created. Here's your configuration file. You'll be redirected back to VSCode after the next step."
            : "Great! Your webhook is created. Now let's set up your local development environment to start receiving webhooks."}
        </P>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Step 1: Create Configuration
            </CardTitle>
            <CardDescription>
              Create an{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                unhook.yml
              </code>{' '}
              file in your project root
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-xs font-medium text-blue-600">
                  1
                </div>
                <span className="text-sm">
                  Create a new file called{' '}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    unhook.yml
                  </code>
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
                <span className="text-sm">Start the Unhook CLI</span>
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
                className="font-mono text-xs resize-none min-h-[300px]"
                readOnly
                value={unhookYmlContent}
              />
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.Play className="h-5 w-5" />
              Step 2: Get Started
            </CardTitle>
            <CardDescription>
              Choose your preferred method to start receiving webhooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    <Icons.Star className="mr-1 h-3 w-3" />
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
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.ArrowRight className="h-5 w-5" />
            What's Next?
          </CardTitle>
          <CardDescription>
            After setting up your configuration, here are some things you can do
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <H4 className="text-sm">Configure Webhook Sources</H4>
              <p className="text-xs text-muted-foreground">
                Set up specific webhook sources like Stripe, GitHub, or Clerk
                with proper verification and secrets for production use.
              </p>
            </div>
            <div className="space-y-2">
              <H4 className="text-sm">Monitor Webhooks</H4>
              <p className="text-xs text-muted-foreground">
                Use the Unhook dashboard to monitor incoming webhooks, debug
                issues, and replay events for testing.
              </p>
            </div>
            <div className="space-y-2">
              <H4 className="text-sm">Team Collaboration</H4>
              <p className="text-xs text-muted-foreground">
                Share webhook URLs with your team members and collaborate on
                webhook development and testing.
              </p>
            </div>
            <div className="space-y-2">
              <H4 className="text-sm">Advanced Configuration</H4>
              <p className="text-xs text-muted-foreground">
                Configure timeouts, custom headers, and advanced routing rules
                for complex webhook scenarios.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button className="min-w-32" onClick={handleContinue}>
          Continue to Dashboard
          <Icons.ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button asChild variant="outline">
          <a
            href="https://docs.unhook.sh"
            rel="noopener noreferrer"
            target="_blank"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            View Documentation
          </a>
        </Button>
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
    </div>
  );
}
