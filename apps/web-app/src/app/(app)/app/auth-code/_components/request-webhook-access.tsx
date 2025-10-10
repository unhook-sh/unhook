'use client';

import { MetricButton } from '@unhook/analytics/components';
import { api } from '@unhook/api/react';
import { Alert, AlertDescription, AlertTitle } from '@unhook/ui/alert';
import { Icons } from '@unhook/ui/custom/icons';
import { Input } from '@unhook/ui/input';
import { Label } from '@unhook/ui/label';
import { useState } from 'react';

interface RequestWebhookAccessProps {
  webhookUrl: string;
}

export function RequestWebhookAccess({
  webhookUrl,
}: RequestWebhookAccessProps) {
  const [message, setMessage] = useState('');
  const [requested, setRequested] = useState(false);

  const requestAccessMutation = api.webhookAccessRequests.create.useMutation({
    onSuccess: () => {
      setRequested(true);
    },
  });

  const handleRequest = async () => {
    await requestAccessMutation.mutateAsync({
      requesterMessage: message || undefined,
      webhookUrl,
    });
  };

  if (requested) {
    return (
      <Alert className="border-green-500/20 bg-green-500/10">
        <Icons.Check className="text-green-600" size="sm" />
        <AlertTitle>Access Request Sent</AlertTitle>
        <AlertDescription>
          The webhook owner will be notified and you'll receive an email when
          your request is reviewed.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-orange-500/20 bg-orange-500/10">
      <Icons.AlertTriangle className="text-orange-600" size="sm" />
      <AlertTitle>No Access to This Webhook</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 mt-2">
        <p className="text-sm">
          None of your organizations have access to this webhook. Request access
          from the webhook owner.
        </p>
        <div className="flex flex-col gap-2">
          <Label className="text-xs" htmlFor="access-message">
            Why do you need access? (Optional)
          </Label>
          <Input
            id="access-message"
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g., I need to test webhook integration for project X"
            value={message}
          />
        </div>
        <MetricButton
          className="w-full"
          disabled={requestAccessMutation.isPending}
          metric="auth_code_request_access_clicked"
          onClick={handleRequest}
          size="sm"
        >
          {requestAccessMutation.isPending ? (
            <>
              <Icons.Spinner className="mr-2" size="sm" />
              Requesting...
            </>
          ) : (
            'Request Access'
          )}
        </MetricButton>
      </AlertDescription>
    </Alert>
  );
}
