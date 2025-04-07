'use client';

import { Card, CardContent } from '@acme/ui/components/card';
import type { Tunnel } from '~/types/tunnel';

interface TunnelMetricsProps {
  tunnel: Tunnel;
}

export function TunnelMetrics({ tunnel }: TunnelMetricsProps) {
  const metrics = [
    {
      label: 'Requests Handled',
      value: tunnel.metrics?.requestsHandled || 0,
      unit: '',
    },
    {
      label: 'Average Response Time',
      value: tunnel.metrics?.avgResponseTime || 0,
      unit: 'ms',
    },
    {
      label: 'Memory Usage',
      value: tunnel.metrics?.memoryUsage || 0,
      unit: 'MB',
    },
    {
      label: 'CPU Usage',
      value: tunnel.metrics?.cpuUsage || 0,
      unit: '%',
    },
    {
      label: 'Bandwidth Used',
      value: tunnel.metrics?.bandwidthUsed || 0,
      unit: 'MB',
    },
  ];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 divide-x divide-y md:grid-cols-5 md:divide-y-0">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex flex-col p-4">
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
