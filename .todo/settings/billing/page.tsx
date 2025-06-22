import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import { H3, P } from '@unhook/ui/custom/typography';
import { Separator } from '@unhook/ui/separator';
import { Suspense } from 'react';
import type Stripe from 'stripe';
import { getStripeInvoices } from './actions';
import { InvoiceTable } from './components/invoice-table';
import { ManageBillingButton } from './components/manage-billing-button';
import { StripeCheckoutButton } from './components/stripe-checkout-button';

export default async function BillingPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  const invoicesResult = await getStripeInvoices({
    orgId,
  });

  const hasInvoices =
    invoicesResult &&
    'data' in invoicesResult &&
    invoicesResult.data?.success &&
    Array.isArray(invoicesResult.data.data);

  // Safely extract invoices or return null
  const invoices: Stripe.Invoice[] | null =
    hasInvoices && invoicesResult.data?.data ? invoicesResult.data.data : null;

  // Check if there was an error fetching invoices
  const isInvoiceError =
    !invoicesResult ||
    !('data' in invoicesResult) ||
    !invoicesResult.data?.success;

  return (
    <div className="space-y-6">
      <div>
        <H3>Billing</H3>
        <P className="text-muted-foreground">
          Manage your billing information and view your invoices.
        </P>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-md">Current Plan</h4>
              <div className="flex justify-between items-center">
                <P className="text-muted-foreground">
                  Manage your subscription and billing details.
                </P>
                <Suspense fallback={<div>Loading...</div>}>
                  <ManageBillingButton orgId={orgId} />
                </Suspense>
              </div>
            </div>

            <Separator />
            <div>
              <h4 className="font-medium text-md">Upgrade Plan</h4>
              <p className="text-sm text-muted-foreground">
                Upgrade to the <strong>Pro Plan</strong> to get more features.
              </p>
              <div className="mt-4">
                <Suspense fallback={<div>Loading checkout...</div>}>
                  <StripeCheckoutButton orgId={orgId} />
                </Suspense>
              </div>
            </div>
            {/* <Separator /> */}

            {/* <div> */}
            {/* <h4 className="font-medium text-md">Features</h4> */}
            {/* <Suspense fallback={<div>Loading features...</div>}> */}
            {/* <FeatureTable /> */}
            {/* </Suspense> */}
            {/* </div> */}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading invoices...</div>}>
            <InvoiceTable invoices={invoices} isError={isInvoiceError} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
