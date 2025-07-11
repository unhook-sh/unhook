import type { EventFixture } from './types';

export const fixtures = [
  {
    body: {
      createdAt: new Date().toISOString(),
      email: 'john.doe@example.com',
      eventType: 'user.created',
      firstName: 'John',
      id: 'user_2NxdwKxVPXhE9URzMHkFoqWYKFn',
      lastName: 'Doe',
    },
    description: 'A new user has been created ',
    provider: 'clerk',
  },
  {
    body: {
      email: 'john.doe@example.com',
      eventType: 'user.updated',
      firstName: 'John',
      id: 'user_2NxdwKxVPXhE9URzMHkFoqWYKFn',
      lastName: 'Smith',
      updatedAt: new Date().toISOString(),
    },
    description: 'A user has been updated',
    provider: 'clerk',
  },
] as const satisfies EventFixture[];
