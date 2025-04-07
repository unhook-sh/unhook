'use client';

import { useEffect, useState } from 'react';
import type { Tunnel } from '~/types/tunnel';

export function useTunnel(id: string) {
  const [tunnel, setTunnel] = useState<Tunnel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTunnel = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock tunnel data
      const mockTunnel: Tunnel = {
        id: id,
        forwardingAddress: `http://tunnel-${id.substring(0, 6)}.example.com`,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        status: 'active',
        localPort: 3000,
        metrics: {
          invocations: 13,
          errorRate: 20,
          requestsHandled: 156,
          avgResponseTime: 873,
          memoryUsage: 151,
          cpuUsage: 13.5,
          bandwidthUsed: 42.7,
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
            { path: '/api/webhook', count: 423, avgLatency: 127 },
            { path: '/api/users', count: 326, avgLatency: 95 },
            { path: '/api/auth', count: 512, avgLatency: 112 },
            { path: '/api/data', count: 239, avgLatency: 143 },
            { path: '/api/events', count: 178, avgLatency: 87 },
          ],
        },
      };

      setTunnel(mockTunnel);
    } catch (error) {
      console.error('Failed to fetch tunnel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTunnel = async () => {
    if (!tunnel) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTunnel((prev) => (prev ? { ...prev, status: 'active' } : null));
    } catch (error) {
      console.error('Failed to start tunnel:', error);
    }
  };

  const stopTunnel = async () => {
    if (!tunnel) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTunnel((prev) => (prev ? { ...prev, status: 'inactive' } : null));
    } catch (error) {
      console.error('Failed to stop tunnel:', error);
    }
  };

  const deleteTunnel = async () => {
    if (!tunnel) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      // The actual deletion will be handled by the component
      return true;
    } catch (error) {
      console.error('Failed to delete tunnel:', error);
      return false;
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    fetchTunnel();
  }, []);

  return {
    tunnel,
    isLoading,
    startTunnel,
    stopTunnel,
    deleteTunnel,
  };
}
