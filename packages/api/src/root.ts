import { authRouter } from './router/auth';
import { connectionsRouter } from './router/connections';
import { eventsRouter } from './router/events';
import { requestsRouter } from './router/requests';
import { userRouter } from './router/user';
import { webhooksRouter } from './router/webhooks';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  webhooks: webhooksRouter,
  requests: requestsRouter,
  connections: connectionsRouter,
  events: eventsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
