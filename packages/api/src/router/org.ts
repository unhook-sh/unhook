import { Orgs } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const orgRouter = createTRPCRouter({
  current: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');
    return ctx.db.query.Orgs.findFirst({
      where: eq(Orgs.id, ctx.auth.orgId),
    });
  }),
});
