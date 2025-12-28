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
import { maskApiKey } from '~/lib/mask-api-key';

export function ApiKeyCard() {
  const apiKeys = api.apiKeys.allWithLastUsage.useQuery();
  const apiKey = apiKeys.data?.[0];
  const maskedApiKey = apiKey ? maskApiKey(apiKey.key) : '';

  return (
    <Card className="@container/card">
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
  );
}
