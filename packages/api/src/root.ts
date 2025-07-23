import { apiKeyUsageRouter } from './router/api-key-usage';
import { apiKeysRouter } from './router/api-keys';
import { authRouter } from './router/auth';
import { billingRouter } from './router/billing';
import { connectionsRouter } from './router/connections';
import { eventsRouter } from './router/events';
import { orgRouter } from './router/org';
import { orgMembersRouter } from './router/org-members';
import { requestsRouter } from './router/requests';
import { userRouter } from './router/user';
import { webhookAccessRequestsRouter } from './router/webhook-access-requests';
import { webhooksRouter } from './router/webhooks';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  apiKeys: apiKeysRouter,
  apiKeyUsage: apiKeyUsageRouter,
  auth: authRouter,
  billing: billingRouter,
  connections: connectionsRouter,
  events: eventsRouter,
  org: orgRouter,
  orgMembers: orgMembersRouter,
  requests: requestsRouter,
  user: userRouter,
  webhookAccessRequests: webhookAccessRequestsRouter,
  webhooks: webhooksRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
