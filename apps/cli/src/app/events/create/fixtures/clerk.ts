import type { EventFixture } from './types';

export const fixtures = [
  {
    description: 'A new user has been created ',
    body: {
      eventType: 'user.created',
      id: 'user_2NxdwKxVPXhE9URzMHkFoqWYKFn',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date().toISOString(),
    },
    provider: 'clerk',
  },
  {
    description: 'A user has been updated',
    body: {
      eventType: 'user.updated',
      id: 'user_2NxdwKxVPXhE9URzMHkFoqWYKFn',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Smith',
      updatedAt: new Date().toISOString(),
    },
    provider: 'clerk',
  },
] as const satisfies EventFixture[];
