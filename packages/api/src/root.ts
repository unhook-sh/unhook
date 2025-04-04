import { authRouter } from './router/auth';
import { connectionsRouter } from './router/connections';
import { requestsRouter } from './router/requests';
import { tunnelsRouter } from './router/tunnels';
import { userRouter } from './router/user';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  tunnels: tunnelsRouter,
  requests: requestsRouter,
  connections: connectionsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
