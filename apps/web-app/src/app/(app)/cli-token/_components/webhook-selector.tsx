'use client';

import { HydrationBoundary } from '@tanstack/react-query';
import { api } from '@unhook/api/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unhook/ui/select';
import { Suspense, useState } from 'react';
import { CliLoginButton } from './cli-login-button';

export function WebhookSelector() {
  const [selectedWebhookId, setSelectedWebhookId] = useState<string>();
  const [webhooks] = api.webhooks.all.useSuspenseQuery();

  return (
    <div className="flex flex-col gap-4">
      <Select value={selectedWebhookId} onValueChange={setSelectedWebhookId}>
        <SelectTrigger>
          <SelectValue placeholder="Select a webhook" />
        </SelectTrigger>
        <SelectContent>
          {webhooks?.map((webhook) => (
            <SelectItem key={webhook.id} value={webhook.id}>
              {webhook.name || webhook.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedWebhookId && <CliLoginButton />}
    </div>
  );
}

export async function WebhookSelectorProvider() {
  return (
    <Suspense fallback={<div>Loading webhooks...</div>}>
      <HydrationBoundary>
        <WebhookSelector />
      </HydrationBoundary>
    </Suspense>
  );
}
