'use client';

import { Label } from '@unhook/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unhook/ui/select';

interface EventTypeSelectorProps {
  service: string;
  value: string;
  onValueChange: (value: string) => void;
}

const EVENT_TYPES = {
  clerk: [
    {
      description: 'New user sign-up',
      label: 'User Created',
      value: 'user.created',
    },
    {
      description: 'User profile updated',
      label: 'User Updated',
      value: 'user.updated',
    },
    {
      description: 'User account deleted',
      label: 'User Deleted',
      value: 'user.deleted',
    },
    {
      description: 'User signed in',
      label: 'Session Created',
      value: 'session.created',
    },
    {
      description: 'User signed out',
      label: 'Session Ended',
      value: 'session.ended',
    },
    {
      description: 'New organization created',
      label: 'Organization Created',
      value: 'organization.created',
    },
    {
      description: 'Organization settings changed',
      label: 'Organization Updated',
      value: 'organization.updated',
    },
  ],
  custom: [
    {
      description: 'Generic custom event',
      label: 'Custom Event',
      value: 'custom.event',
    },
    {
      description: 'Test webhook event',
      label: 'Test Event',
      value: 'test.event',
    },
  ],
  github: [
    { description: 'Code pushed to repository', label: 'Push', value: 'push' },
    {
      description: 'Pull request events',
      label: 'Pull Request',
      value: 'pull_request',
    },
    {
      description: 'Issue creation and updates',
      label: 'Issues',
      value: 'issues',
    },
    { description: 'Release creation', label: 'Release', value: 'release' },
    {
      description: 'GitHub Actions workflow runs',
      label: 'Workflow Run',
      value: 'workflow_run',
    },
    { description: 'Repository starred', label: 'Star', value: 'star' },
    { description: 'Repository forked', label: 'Fork', value: 'fork' },
  ],
  stripe: [
    {
      description: 'Payment completed successfully',
      label: 'Payment Intent Succeeded',
      value: 'payment_intent.succeeded',
    },
    {
      description: 'Payment attempt failed',
      label: 'Payment Intent Failed',
      value: 'payment_intent.payment_failed',
    },
    {
      description: 'New customer created',
      label: 'Customer Created',
      value: 'customer.created',
    },
    {
      description: 'Customer details updated',
      label: 'Customer Updated',
      value: 'customer.updated',
    },
    {
      description: 'New subscription started',
      label: 'Subscription Created',
      value: 'customer.subscription.created',
    },
    {
      description: 'Subscription modified',
      label: 'Subscription Updated',
      value: 'customer.subscription.updated',
    },
    {
      description: 'Subscription payment successful',
      label: 'Invoice Payment Succeeded',
      value: 'invoice.payment_succeeded',
    },
    {
      description: 'Subscription payment failed',
      label: 'Invoice Payment Failed',
      value: 'invoice.payment_failed',
    },
  ],
};

export function EventTypeSelector({
  service,
  value,
  onValueChange,
}: EventTypeSelectorProps) {
  const eventTypes = EVENT_TYPES[service as keyof typeof EVENT_TYPES] || [];

  return (
    <div className="space-y-2">
      <Label htmlFor="event-type">Event Type</Label>
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger id="event-type">
          <SelectValue placeholder="Select an event type" />
        </SelectTrigger>
        <SelectContent>
          {eventTypes.length === 0 ? (
            <SelectItem disabled value="__no-event-types">
              Select a service first
            </SelectItem>
          ) : (
            eventTypes.map((eventType) => (
              <SelectItem key={eventType.value} value={eventType.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{eventType.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {eventType.description}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
