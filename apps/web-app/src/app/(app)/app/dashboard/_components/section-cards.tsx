'use client';

import { api } from '@unhook/api/react';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Skeleton } from '@unhook/ui/skeleton';
import { env } from '~/env.client';
import { maskApiKey } from '~/lib/mask-api-key';

export function SectionCards() {
  const apiKeys = api.apiKeys.allWithLastUsage.useQuery();
  const webhooks = api.webhooks.all.useQuery();
  const org = api.org.current.useQuery();

  const webhook = webhooks.data?.[0];
  const apiKey = apiKeys.data?.[0];
  const maskedApiKey = apiKey ? maskApiKey(apiKey.key) : '';
  const webhookUrl = `${env.NEXT_PUBLIC_WEBHOOK_BASE_URL || env.NEXT_PUBLIC_API_URL || 'https://unhook.sh'}/${org.data?.name}/${webhook?.name}`;
  const webhookConfigComments = `
# Unhook Webhook Configuration
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

webhookUrl: ${webhookUrl}
destination:
  - name: localhost
    url: http://localhost:3000/api/webhooks
delivery:
  - source: '*'
    destination: localhost
  `;

  const webhookConfig = `
`;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4  *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card col-span-2 row-span-2">
        <CardHeader>
          <CardDescription>Webhook Config</CardDescription>
          <CardTitle className="flex items-center gap-2 w-full">
            {webhook && (
              <>
                <span className="font-mono text-sm select-all tabular-nums bg-muted px-2 py-1 rounded w-full">
                  {webhookUrl}
                </span>
                <span className="ml-2">
                  <CopyButton
                    size="sm"
                    text={webhook?.id ?? ''}
                    variant="outline"
                  />
                </span>
              </>
            )}
            {!webhook && <Skeleton className="w-full h-4" />}
          </CardTitle>
          {/* <CardAction>
            <Button asChild variant="link">
              <Link href="/app/api-keys">Manage API Keys</Link>
            </Button>
          </CardAction> */}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-2">
              <span className="font-mono bg-muted p-3 rounded text-xs select-all w-full">
                <pre>{`webhookUrl: ${webhookUrl}
destination:
  - name: localhost
    url: http://localhost:3000/api/webhooks
delivery:
  - source: '*'
    destination: localhost`}</pre>
              </span>
              <CopyButton
                className="self-start"
                size="sm"
                text={webhookConfigComments + webhookConfig}
                variant="outline"
              />
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              Put this in your unhook.yaml file
            </div>
          </div>
        </CardFooter>
      </Card>
      {/* <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $1,250.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1,234
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down 20% this period <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card> */}
      {/* <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            45,678
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Engagement exceed targets</div>
        </CardFooter>
      </Card> */}
      {/* <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            4.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady performance increase <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter>
      </Card> */}
      <Card className="@container/card col-span-2 row-span-2">
        <CardHeader>
          <CardDescription>API Key</CardDescription>
          <CardTitle className="flex items-center gap-2 w-full">
            {apiKey && (
              <>
                <span className="font-mono text-sm select-all tabular-nums bg-muted px-2 py-1 rounded w-full">
                  {maskedApiKey}
                </span>
                <span className="ml-2">
                  <CopyButton
                    size="sm"
                    text={apiKey?.key ?? ''}
                    variant="outline"
                  />
                </span>
              </>
            )}
            {!apiKey && <Skeleton className="w-full h-4" />}
          </CardTitle>
          {/* <CardAction>
            <Button asChild variant="link">
              <Link href="/app/api-keys">Manage API Keys</Link>
            </Button>
          </CardAction> */}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-2">
              <span className="font-mono bg-muted px-2 py-1 rounded text-xs select-all">
                env UNHOOK_API_KEY=
                {maskedApiKey} npx -y @unhook/mcp
              </span>
              <CopyButton
                size="sm"
                text={`env UNHOOK_API_KEY=${apiKey?.key} npx -y @unhook/mcp`}
                variant="outline"
              />
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              Use this command to set up MCP server integration in Cursor.
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
