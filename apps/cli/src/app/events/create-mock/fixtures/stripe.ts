import type { EventFixture } from './types';

export const fixtures = [
  {
    body: {
      amount: 2000,
      created: Math.floor(Date.now() / 1000),
      currency: 'usd',
      eventType: 'payment.succeeded',
      id: 'pi_3OqXw2EBvxMXKxVP0',
      object: 'payment_intent',
      status: 'succeeded',
    },
    description: 'A payment has been processed',
    provider: 'stripe',
  },
] as const satisfies EventFixture[];
