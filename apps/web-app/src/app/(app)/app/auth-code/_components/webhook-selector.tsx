'use client';

import { api } from '@unhook/api/react';
import { HydrationBoundary } from '@unhook/api/server';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unhook/ui/select';
import { Suspense, useState } from 'react';
import { AuthCodeLoginButton } from './auth-code-login-button';

export function WebhookSelector() {
  const [selectedWebhookId, setSelectedWebhookId] = useState<string>();
  const [webhooks] = api.webhooks.all.useSuspenseQuery();

  return (
    <div className="flex flex-col gap-4">
      <Select onValueChange={setSelectedWebhookId} value={selectedWebhookId}>
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

      {selectedWebhookId && <AuthCodeLoginButton />}
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
