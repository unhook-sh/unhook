import { auth } from '@clerk/nextjs/server';
import { upsertOrg } from '@unhook/db';
import { redirect } from 'next/navigation';
import { SetActiveAndRedirect } from './_components/set-active-and-redirect';

export default async function Page(props: {
  searchParams: Promise<{
    redirectTo?: string;
    source?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const { orgId, userId } = await auth();

  if (!userId) {
    return redirect('/');
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

  return (
    <SetActiveAndRedirect
      redirectTo={searchParams.redirectTo}
      source={searchParams.source}
    />
  );
}
