'use client';

import { MetricButton, MetricLink } from '@unhook/analytics';
import { api } from '@unhook/api/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@unhook/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Skeleton } from '@unhook/ui/skeleton';
import { ExternalLink } from 'lucide-react';
import { env } from '~/env.client';

function generateWebhookConfig(webhookUrl: string) {
  return `webhookUrl: ${webhookUrl}
destination:
  - name: localhost
    url: http://localhost:3000/api/webhooks
delivery:
  - source: '*'
    destination: localhost`;
}

function generateWebhookConfigWithComments(webhookUrl: string) {
  return `# Unhook Webhook Configuration
# For more information, visit: https://docs.unhook.sh/configuration
#
# Schema:
#   webhookId: string                    # Unique identifier for your webhook
#   destination:                         # Array of destination endpoints
#     - name: string                     # Name of the endpoint
#       url: string|URL|RemotePattern    # URL to forward webhooks to
#       ping?: boolean|string|URL        # Optional ping configuration
#   delivery:                             # Array of delivery rules
#     - source?: string                  # Optional source filter (default: *)
#       destination: string              # Name of the destination from 'destination' array
#
# RemotePattern:
#   protocol?: "http"|"https"            # URL protocol
#   hostname: string                     # URL hostname
#   port?: string                        # URL port
#   pathname?: string                    # URL pathname
#   search?: string                      # URL search params

${generateWebhookConfig(webhookUrl)}`;
}

function SkeletonItem() {
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <Skeleton className="h-6 w-[300px]" />
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded" />
        <Skeleton className="size-8 rounded" />
      </div>
    </div>
  );
}

export function WebhooksAccordion() {
  const webhooks = api.webhooks.all.useQuery();
  const org = api.org.current.useQuery();

  const getWebhookUrl = (webhookName: string) => {
    const baseUrl =
      env.NEXT_PUBLIC_WEBHOOK_BASE_URL ||
      env.NEXT_PUBLIC_API_URL ||
      'https://unhook.sh';
    const orgName = org.data?.name || 'org';
    return `${baseUrl}/${orgName}/${webhookName}`;
  };

  if (webhooks.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SkeletonItem />
          <SkeletonItem />
          <SkeletonItem />
        </CardContent>
      </Card>
    );
  }

  if (!webhooks.data || webhooks.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No webhooks found. Create your first webhook to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Configs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Accordion className="w-full" collapsible type="single">
          {webhooks.data.map((webhook) => {
            const webhookUrl = getWebhookUrl(webhook.name);
            const config = generateWebhookConfig(webhookUrl);
            const configWithComments =
              generateWebhookConfigWithComments(webhookUrl);

            return (
              <AccordionItem key={webhook.id} value={webhook.id}>
                <div className="flex items-center gap-2 px-4">
                  <AccordionTrigger className="flex-1 hover:no-underline">
                    <span className="font-mono text-sm truncate">
                      {webhookUrl}
                    </span>
                  </AccordionTrigger>
                  <div className="flex items-center gap-1">
                    <CopyButton size="sm" text={webhookUrl} variant="ghost" />
                    <MetricLink
                      href={`/app/webhooks/${webhook.id}`}
                      metric="dashboard_webhook_view_clicked"
                      properties={{ webhook_id: webhook.id }}
                    >
                      <MetricButton
                        className="size-8 p-0"
                        metric="dashboard_webhook_view_button_clicked"
                        size="sm"
                        variant="ghost"
                      >
                        <ExternalLink className="size-4" />
                      </MetricButton>
                    </MetricLink>
                  </div>
                </div>
                <AccordionContent className="px-4">
                  <div className="flex items-start gap-2">
                    <pre className="font-mono bg-muted p-3 rounded text-xs select-all w-full overflow-x-auto">
                      {config}
                    </pre>
                    <CopyButton
                      className="shrink-0"
                      size="sm"
                      text={configWithComments}
                      variant="outline"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs mt-2">
                    Put this in your unhook.yaml file
                  </p>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
