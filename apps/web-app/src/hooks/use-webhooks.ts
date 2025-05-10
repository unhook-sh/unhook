'use client';

import { useEffect, useState } from 'react';
import type { Webhook } from '~/types/webhook';

// Mock data for webhooks
const mockWebhooks: Webhook[] = [
  {
    id: 'tnl_1a2b3c4d5e6f7g8h9i0j',
    forwardingAddress: 'https://tnl-1a2b3c.webhook.example.com',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    status: 'active',
    localPort: 3000,
  },
  {
    id: 'tnl_2b3c4d5e6f7g8h9i0j1k',
    forwardingAddress: 'https://tnl-2b3c4d.webhook.example.com',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    status: 'inactive',
    localPort: 8080,
  },
  {
    id: 'tnl_3c4d5e6f7g8h9i0j1k2l',
    forwardingAddress: 'https://tnl-3c4d5e.webhook.example.com',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    status: 'active',
    localPort: 4000,
  },
  {
    id: 'tnl_4d5e6f7g8h9i0j1k2l3m',
    forwardingAddress: 'https://tnl-4d5e6f.webhook.example.com',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    status: 'active',
    localPort: 5000,
  },
  {
    id: 'tnl_5e6f7g8h9i0j1k2l3m4n',
    forwardingAddress: 'https://tnl-5e6f7g.webhook.example.com',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    status: 'inactive',
    localPort: 9000,
  },
];

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWebhooks = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setWebhooks(mockWebhooks);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startWebhook = async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setWebhooks((prev) =>
        prev.map((webhook) =>
          webhook.id === id ? { ...webhook, status: 'active' } : webhook,
        ),
      );
    } catch (error) {
      console.error('Failed to start webhook:', error);
    }
  };

  const stopWebhook = async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setWebhooks((prev) =>
        prev.map((webhook) =>
          webhook.id === id ? { ...webhook, status: 'inactive' } : webhook,
        ),
      );
    } catch (error) {
      console.error('Failed to stop webhook:', error);
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setWebhooks((prev) => prev.filter((webhook) => webhook.id !== id));
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: This is a mock hook
  useEffect(() => {
    fetchWebhooks();
  }, []);

  return {
    webhooks,
    isLoading,
    refresh: fetchWebhooks,
    startWebhook,
    stopWebhook,
    deleteWebhook,
  };
}
