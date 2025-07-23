import { OrgMembers } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const orgMembersRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');
    // Fetch all org members for the current org, including user info
    const members = await ctx.db.query.OrgMembers.findMany({
      where: eq(OrgMembers.orgId, ctx.auth.orgId),
      with: { user: true },
    });
    return members;
  }),
});
