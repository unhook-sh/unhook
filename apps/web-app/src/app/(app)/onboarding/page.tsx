import { auth } from '@clerk/nextjs/server';
import { eq, upsertOrg } from '@unhook/db';
import { db } from '@unhook/db/client';
import { OrgMembers } from '@unhook/db/schema';
import { redirect } from 'next/navigation';
import { SetActiveAndRedirect } from './set-active-and-redirect';

export default async function Layout(props: {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
  children: React.ReactNode;
}) {
  const searchParams = await props.searchParams;
  const { orgId, userId } = await auth();

  if (!userId) {
    return redirect('/');
  }

  const existingOrg = await db.query.OrgMembers.findFirst({
    where: eq(OrgMembers.userId, userId),
  });

  const redirectTo = searchParams.redirectTo ?? '/app/dashboard';

  if (existingOrg) {
    return redirect(redirectTo);
  }

  if (!orgId) {
    try {
      await upsertOrg({
        name: 'Personal',
        userId: userId ?? '',
      });
    } catch (error) {
      console.error('Failed to create organization:', error);
      return <div>Failed to create organization</div>;
    }
  }

  return <SetActiveAndRedirect redirectTo={redirectTo} />;
}
