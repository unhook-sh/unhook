'use client';

import { MetricLink } from '@unhook/analytics/components';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { Button } from '@unhook/ui/components/button';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Icons } from '@unhook/ui/custom/icons';
import { H3, H4, P } from '@unhook/ui/custom/typography';
import { Separator } from '@unhook/ui/separator';
import { Textarea } from '@unhook/ui/textarea';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Terminal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { env } from '~/env.client';

import { AuthCodeLoginButton } from '../../auth-code/_components/auth-code-login-button';

export default function OnboardingSuccessPage() {
  const searchParams = useSearchParams();
  const orgName = searchParams.get('orgName');
  const webhookName = searchParams.get('webhookName');
  const redirectTo = searchParams.get('redirectTo') || undefined;
  const source = searchParams.get('source') || undefined;

  if (!orgName || !webhookName) {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid Access</CardTitle>
            <CardDescription>
              This page requires valid organization and webhook parameters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please complete the onboarding process first.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="/app/onboarding">Go to Onboarding</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const webhookUrl = `${env.NEXT_PUBLIC_WEBHOOK_BASE_URL || env.NEXT_PUBLIC_API_URL || 'https://unhook.sh'}/${orgName}/${webhookName}`;

  // Render different UI for VSCode extension users
  if (source === 'extension') {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <Icons.Check className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <CardTitle className="text-2xl">Setup Complete!</CardTitle>
              <CardDescription>
                Your webhook is ready. Click below to return to VSCode and start
                receiving webhooks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Webhook URL Display */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Your Webhook URL</div>
                <div className="flex gap-2">
                  <Textarea
                    className="font-mono text-sm resize-none"
                    readOnly
                    rows={1}
                    value={webhookUrl}
                  />
                  <CopyButton size="sm" text={webhookUrl} variant="outline" />
                </div>
                <p className="text-xs text-muted-foreground">
                  This URL is already configured in your unhook.yml file
                </p>
              </div>

              <Separator />

              {/* What Happens Next */}
              <div className="space-y-3">
                <H4 className="text-sm">What happens next?</H4>
                <div className="space-y-2">
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary flex-shrink-0">
                      1
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You'll be redirected back to VSCode
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary flex-shrink-0">
                      2
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The extension will automatically authenticate and connect
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary flex-shrink-0">
                      3
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Start receiving webhooks in your local development
                      environment
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <AuthCodeLoginButton
                loadingText="Redirecting to VSCode..."
                text="Complete Setup & Return to VSCode"
              />
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Render for web/CLI users
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-6">
          {/* Success Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Icons.Check className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <H3>Webhook Created Successfully!</H3>
            <P className="text-muted-foreground max-w-2xl mx-auto">
              Your webhook endpoint is ready. Choose how you want to start
              receiving webhooks in your local development environment.
            </P>
          </div>

          {/* Webhook URL Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Your Webhook URL
              </CardTitle>
              <CardDescription>
                Use this URL to receive webhooks from any service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Textarea
                  className="font-mono text-sm resize-none"
                  readOnly
                  rows={1}
                  value={webhookUrl}
                />
                <CopyButton size="sm" text={webhookUrl} variant="outline" />
              </div>
            </CardContent>
          </Card>

          {/* Installation Options */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Development Method</CardTitle>
              <CardDescription>
                Pick the tool that fits your workflow best
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CLI Option */}
                <div className="space-y-3 p-4 border rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    <H4 className="text-sm">CLI</H4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Run Unhook from your terminal with a simple command
                  </p>
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
                  </div>
                </div>

                {/* VSCode Option */}
                <div className="space-y-3 p-4 border rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Icons.FunctionSquare className="h-5 w-5 text-primary" />
                    <H4 className="text-sm">VS Code</H4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Install the extension for seamless editor integration
                  </p>
                  <Button
                    asChild
                    className="w-full"
                    size="sm"
                    variant="outline"
                  >
                    <a
                      href="https://marketplace.visualstudio.com/items?itemName=unhook.unhook-vscode"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Install Extension
                    </a>
                  </Button>
                </div>

                {/* Cursor Option */}
                <div className="space-y-3 p-4 border rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Icons.Sparkles className="h-5 w-5 text-primary" />
                    <H4 className="text-sm">Cursor</H4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get the same great experience in Cursor editor
                  </p>
                  <Button
                    asChild
                    className="w-full"
                    size="sm"
                    variant="outline"
                  >
                    <a
                      href="https://marketplace.visualstudio.com/items?itemName=unhook.unhook-vscode"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Install Extension
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <H4 className="text-sm">📝 Configure Webhook Sources</H4>
                  <p className="text-xs text-muted-foreground">
                    Add webhook sources like Stripe, GitHub, or Clerk to your
                    configuration for automatic verification
                  </p>
                </div>
                <div className="space-y-2">
                  <H4 className="text-sm">📊 Monitor & Debug</H4>
                  <p className="text-xs text-muted-foreground">
                    Use the dashboard to inspect webhooks, view payloads, and
                    replay events for testing
                  </p>
                </div>
                <div className="space-y-2">
                  <H4 className="text-sm">👥 Invite Team Members</H4>
                  <p className="text-xs text-muted-foreground">
                    Share webhook URLs with your team and collaborate on webhook
                    development
                  </p>
                </div>
                <div className="space-y-2">
                  <H4 className="text-sm">🔧 Advanced Features</H4>
                  <p className="text-xs text-muted-foreground">
                    Explore routing rules, custom transformations, and
                    integrations with external services
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button asChild>
              <MetricLink
                href={redirectTo ?? '/app/dashboard'}
                metric="onboarding_go_to_dashboard_clicked"
                properties={{
                  destination: redirectTo ?? '/app/dashboard',
                  location: 'onboarding_success',
                }}
              >
                Go to Dashboard
                <Icons.ArrowRight className="ml-2 h-4 w-4" />
              </MetricLink>
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
        </div>
      </motion.div>
    </div>
  );
}
