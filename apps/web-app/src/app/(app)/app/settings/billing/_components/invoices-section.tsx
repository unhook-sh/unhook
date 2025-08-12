'use client';

import { MetricButton } from '@unhook/analytics/components';
import { api } from '@unhook/api/react';
import { useHasActiveSubscription } from '@unhook/stripe/guards/client';
import { Badge } from '@unhook/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import { P } from '@unhook/ui/custom/typography';
import { Skeleton } from '@unhook/ui/skeleton';

export function InvoicesSection() {
  const hasActiveSubscription = useHasActiveSubscription();

  // Use tRPC to fetch invoices
  const {
    data: invoices,
    isLoading,
    error,
  } = api.billing.getInvoices.useQuery(
    { limit: 20 },
    {
      enabled: hasActiveSubscription, // Only fetch if user has an active subscription
    },
  );

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      currency: currency.toUpperCase(),
      style: 'currency',
    }).format(amount / 100); // Stripe amounts are in cents
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;

    switch (status) {
      case 'paid':
        return <Badge variant="default">Paid</Badge>;
      case 'open':
        return <Badge variant="secondary">Open</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'void':
        return <Badge variant="destructive">Void</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownloadInvoice = (invoice: NonNullable<typeof invoices>[0]) => {
    if (invoice.invoicePdf) {
      window.open(invoice.invoicePdf, '_blank');
    } else if (invoice.hostedInvoiceUrl) {
      window.open(invoice.hostedInvoiceUrl, '_blank');
    }
  };

  const handleViewInvoice = (invoice: NonNullable<typeof invoices>[0]) => {
    if (invoice.hostedInvoiceUrl) {
      window.open(invoice.hostedInvoiceUrl, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>
          Your billing history and invoice downloads
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasActiveSubscription && (
          <div className="text-center py-6">
            <P className="text-sm text-muted-foreground">
              No billing history available. Subscribe to see your invoices.
            </P>
          </div>
        )}

        {hasActiveSubscription && isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div className="flex items-center justify-between" key={i}>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <P className="text-sm text-destructive">
              Failed to load invoices. Please try again later.
            </P>
          </div>
        )}

        {invoices && invoices.length > 0 && (
          <div className="space-y-4">
            {invoices
              .filter((invoice) => invoice.id && invoice.status) // Filter out invoices with missing required fields
              .map((invoice) => (
                <div
                  className="flex items-center justify-between"
                  key={invoice.id}
                >
                  <div className="flex items-center gap-3">
                    {/* <P className="text-sm font-mono">{invoice.created}</P> */}
                    <P className="text-sm">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </P>
                    <P className="text-xs text-muted-foreground">
                      {formatDate(invoice.created)}
                    </P>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    {invoice.hostedInvoiceUrl && (
                      <MetricButton
                        metric="invoices_section_view_invoice_clicked"
                        onClick={() => handleViewInvoice(invoice)}
                        size="sm"
                        variant="outline"
                      >
                        <Icons.ExternalLink className="mr-2 size-3" />
                        View
                      </MetricButton>
                    )}
                    {invoice.invoicePdf && (
                      <MetricButton
                        metric="invoices_section_download_invoice_clicked"
                        onClick={() => handleDownloadInvoice(invoice)}
                        size="sm"
                        variant="outline"
                      >
                        <Icons.Download className="mr-2 size-3" />
                        Download
                      </MetricButton>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {invoices && invoices.length === 0 && hasActiveSubscription && (
          <div className="text-center py-6">
            <P className="text-sm text-muted-foreground">
              No invoices found for this account.
            </P>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
