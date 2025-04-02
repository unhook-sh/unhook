import { authRouter } from './router/auth'
import { tunnelsRouter } from './router/tunnels'
import { userRouter } from './router/user'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  tunnels: tunnelsRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
