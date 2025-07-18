'use client';

import { Card, CardContent } from '@unhook/ui/card';
import type { Webhook } from '~/types/webhook';

interface WebhookMetricsProps {
  webhook: Webhook;
}

export function WebhookMetrics({ webhook }: WebhookMetricsProps) {
  const metrics = [
    {
      label: 'Requests Handled',
      unit: '',
      value: webhook.metrics?.requestsHandled || 0,
    },
    {
      label: 'Average Response Time',
      unit: 'ms',
      value: webhook.metrics?.avgResponseTime || 0,
    },
    {
      label: 'Memory Usage',
      unit: 'MB',
      value: webhook.metrics?.memoryUsage || 0,
    },
    {
      label: 'CPU Usage',
      unit: '%',
      value: webhook.metrics?.cpuUsage || 0,
    },
    {
      label: 'Bandwidth Used',
      unit: 'MB',
      value: webhook.metrics?.bandwidthUsed || 0,
    },
  ];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 divide-x divide-y md:grid-cols-5 md:divide-y-0">
          {metrics.map((metric) => (
            <div className="flex flex-col p-4" key={metric.label}>
              <span className="text-xs font-medium text-muted-foreground">
                {metric.label}
              </span>
              <span className="text-xl font-bold">
                {metric.value}
                {metric.unit && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {metric.unit}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
