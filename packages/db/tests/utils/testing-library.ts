import { afterEach, expect, mock } from 'bun:test';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';

expect.extend(matchers);

// Global mocks to prevent environment variable errors during test loading
mock.module('@unhook/stripe', () => ({
  BILLING_INTERVALS: { MONTHLY: 'month' },
  createSubscription: () =>
    Promise.resolve({ id: 'sub_123', status: 'active' }),
  getFreePlanPriceId: () => Promise.resolve('price_123'),
  PLAN_TYPES: { FREE: 'free', TEAM: 'team' },
  stripe: {
    billingPortal: {
      sessions: {
        create: () => Promise.resolve({ id: 'bps_123' }),
      },
    },
    checkout: {
      sessions: {
        create: () => Promise.resolve({ id: 'cs_123' }),
      },
    },
    customers: {
      create: () => Promise.resolve({ id: 'cus_789' }),
      search: () => Promise.resolve({ data: [] }),
      update: () => Promise.resolve({ id: 'cus_789' }),
    },
    prices: {
      list: () => Promise.resolve({ data: [] }),
    },
    subscriptions: {
      create: () => Promise.resolve({ id: 'sub_123' }),
      retrieve: () => Promise.resolve({ id: 'sub_123' }),
      update: () => Promise.resolve({ id: 'sub_123' }),
    },
  },
  upsertStripeCustomer: () => Promise.resolve({ id: 'cus_789' }),
}));

// Mock environment variables
mock.module('./env.server', () => ({
  env: {
    POSTGRES_URL: 'postgresql://test:test@localhost:5432/test',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
    VERCEL_ENV: 'development',
  },
}));

// Clean up after each test
afterEach(() => {
  cleanup();
});
