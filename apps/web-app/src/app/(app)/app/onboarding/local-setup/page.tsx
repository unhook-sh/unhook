import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { LocalDevelopmentSetup } from './_components/local-development-setup';

export default async function LocalSetupPage(props: {
  searchParams: Promise<{
    orgName?: string;
    webhookName?: string;
    redirectTo?: string;
    source?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const { userId } = await auth();

  if (!userId) {
    return redirect('/');
  }

  const { orgName, webhookName, redirectTo, source } = searchParams;

  if (!orgName || !webhookName) {
    return redirect('/app/onboarding');
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <LocalDevelopmentSetup
        orgName={orgName}
        redirectTo={redirectTo}
        source={source}
        webhookName={webhookName}
      />
    </div>
  );
}
