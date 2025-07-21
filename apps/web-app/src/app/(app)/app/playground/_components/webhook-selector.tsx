'use client';

import { api } from '@unhook/api/react';
import { Label } from '@unhook/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unhook/ui/select';

interface WebhookSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function WebhookSelector({
  value,
  onValueChange,
}: WebhookSelectorProps) {
  const { data: webhooks, isLoading } = api.webhooks.all.useQuery();

  return (
    <div className="space-y-2">
      <Label htmlFor="webhook">Webhook</Label>
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger id="webhook">
          <SelectValue placeholder="Select a webhook" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem disabled value="__loading-webhooks">
              Loading webhooks...
            </SelectItem>
          ) : webhooks?.length === 0 ? (
            <SelectItem disabled value="__no-webhooks">
              No webhooks found
            </SelectItem>
          ) : (
            webhooks?.map((webhook) => (
              <SelectItem key={webhook.id} value={webhook.id}>
                {webhook.name || webhook.id}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
