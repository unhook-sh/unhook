import { auth } from '@clerk/nextjs/server';
import { ensureUserFromClerk } from '@unhook/db';
import { redirect } from 'next/navigation';
import { OnboardingForm } from './_components/onboarding-form';

export default async function Page(props: {
  searchParams: Promise<{
    redirectTo?: string;
    source?: string;
    orgName?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const { orgId, userId } = await auth();

  if (!userId) {
    return redirect('/');
  }

  // Proactively ensure user exists in DB before rendering form
  // This handles the race condition where Clerk webhooks haven't completed yet
  try {
    await ensureUserFromClerk(userId);
  } catch (error) {
    console.error('Failed to ensure user exists during onboarding:', {
      error,
      source: searchParams.source,
      userId,
    });
    // Continue anyway - the createOrg function also has user creation logic
  }

  // If user already has an organization, redirect to dashboard
  if (orgId) {
    return redirect('/app/dashboard');
  }

  // If orgName is provided, redirect to webhook wizard
  // The organization will be created when the user submits the form
  if (searchParams.orgName) {
    return redirect('/app/webhooks/create');
  }

  // Show onboarding form with source detection
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <OnboardingForm
        redirectTo={searchParams.redirectTo}
        source={searchParams.source}
      />
    </div>
  );
}
