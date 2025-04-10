import type { EventFixture } from './types';

export const fixtures = [
  {
    description: 'A payment has been processed',
    body: {
      eventType: 'payment.succeeded',
      id: 'pi_3OqXw2EBvxMXKxVP0',
      object: 'payment_intent',
      amount: 2000,
      currency: 'usd',
      status: 'succeeded',
      created: Math.floor(Date.now() / 1000),
    },
    provider: 'stripe',
  },
] as const satisfies EventFixture[];
