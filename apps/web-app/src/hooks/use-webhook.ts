'use client';

import { useEffect, useState } from 'react';
import type { Webhook } from '~/types/webhook';

export function useWebhook(id: string) {
  const [webhook, setWebhook] = useState<Webhook | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWebhook = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock webhook data
      const mockWebhook: Webhook = {
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        deliveredAddress: `http://webhook-${id.substring(0, 6)}.example.com`,
        id: id, // 2 days ago
        lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        localPort: 3000,
        metrics: {
          avgResponseTime: 873,
          bandwidthUsed: 42.7,
          cpuUsage: 13.5,
          errorRate: 20,
          invocations: 13,
          memoryUsage: 151,
          requestsHandled: 156,
          statusCodes: {
            '200': 65,
            '201': 10,
            '204': 5,
            '400': 8,
            '401': 5,
            '404': 4,
            '500': 3,
          },
          topPaths: [
            { avgLatency: 127, count: 423, path: '/api/webhook' },
            { avgLatency: 95, count: 326, path: '/api/users' },
            { avgLatency: 112, count: 512, path: '/api/auth' },
            { avgLatency: 143, count: 239, path: '/api/data' },
            { avgLatency: 87, count: 178, path: '/api/events' },
          ],
        },
        status: 'active',
      };

      setWebhook(mockWebhook);
    } catch (error) {
      console.error('Failed to fetch webhook:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startWebhook = async () => {
    if (!webhook) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setWebhook((prev) => (prev ? { ...prev, status: 'active' } : null));
    } catch (error) {
      console.error('Failed to start webhook:', error);
    }
  };

  const stopWebhook = async () => {
    if (!webhook) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setWebhook((prev) => (prev ? { ...prev, status: 'inactive' } : null));
    } catch (error) {
      console.error('Failed to stop webhook:', error);
    }
  };

  const deleteWebhook = async () => {
    if (!webhook) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      // The actual deletion will be handled by the component
      return true;
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      return false;
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: we only need to fetch the webhook once
  useEffect(() => {
    fetchWebhook();
  }, []);

  return {
    deleteWebhook,
    isLoading,
    startWebhook,
    stopWebhook,
    webhook,
  };
}
