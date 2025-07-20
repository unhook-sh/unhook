'use client';

import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
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
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { getInvoicesAction } from '../actions';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  invoicePdf?: string;
  hostedInvoiceUrl?: string;
}

interface InvoicesSectionProps {
  org: {
    id: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionStatus?: string | null;
  };
}

export function InvoicesSection({ org }: InvoicesSectionProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { executeAsync: executeGetInvoices, status: getInvoicesStatus } =
    useAction(getInvoicesAction);

  const isLoading = getInvoicesStatus === 'executing';

  useEffect(() => {
    const loadInvoices = async () => {
      if (!org.stripeCustomerId) return;

      try {
        const result = await executeGetInvoices({ orgId: org.id });
        if (result?.data) {
          setInvoices(result.data as Invoice[]);
          setHasLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load invoices:', error);
        setHasLoaded(true); // Mark as loaded even on error to show error state
      }
    };

    loadInvoices();
  }, [org.stripeCustomerId, org.id, executeGetInvoices]);

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

  const getStatusBadge = (status: string) => {
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

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.invoicePdf) {
      window.open(invoice.invoicePdf, '_blank');
    } else if (invoice.hostedInvoiceUrl) {
      window.open(invoice.hostedInvoiceUrl, '_blank');
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
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
        {!org.stripeCustomerId && (
          <div className="text-center py-6">
            <P className="text-sm text-muted-foreground">
              No billing history available.
            </P>
          </div>
        )}

        {org.stripeCustomerId && isLoading && (
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

        {hasLoaded && invoices.length > 0 && (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                className="flex items-center justify-between"
                key={invoice.id}
              >
                <div className="flex items-center gap-3">
                  <P className="text-sm font-mono">{invoice.id}</P>
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
                    <Button
                      onClick={() => handleViewInvoice(invoice)}
                      size="sm"
                      variant="outline"
                    >
                      <Icons.ExternalLink className="mr-2 size-3" />
                      View
                    </Button>
                  )}
                  {invoice.invoicePdf && (
                    <Button
                      onClick={() => handleDownloadInvoice(invoice)}
                      size="sm"
                      variant="outline"
                    >
                      <Icons.Download className="mr-2 size-3" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasLoaded && invoices.length === 0 && org.stripeCustomerId && (
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
