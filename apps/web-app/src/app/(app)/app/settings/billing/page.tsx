import { auth } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Orgs } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { BillingSettings } from './_components/billing-settings';

interface BillingPageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const { success, canceled } = await searchParams;
  const { orgId } = await auth();

  if (!orgId) {
    redirect('/sign-in');
  }

  // Get organization details
  const org = await db.query.Orgs.findFirst({
    where: eq(Orgs.clerkOrgId, orgId),
  });

  if (!org) {
    redirect('/');
  }

  return (
    <BillingSettings
      canceled={canceled}
      org={{
        id: org.id,
        stripeCustomerId: org.stripeCustomerId,
        stripeSubscriptionStatus: org.stripeSubscriptionStatus,
      }}
      success={success}
    />
  );
}
