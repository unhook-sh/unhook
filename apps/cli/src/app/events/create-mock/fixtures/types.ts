export const providers = [
  'clerk',
  'stripe',
  'github',
  'google',
  'email',
] as const;

export interface EventFixture {
  description: string;
  body: {
    eventType: string;
    [key: string]: unknown;
  };
  provider: (typeof providers)[number];
}
