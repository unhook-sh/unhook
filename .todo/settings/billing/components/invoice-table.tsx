'use client';

import { Button } from '@unhook/ui/button';
import { Icons } from '@unhook/ui/custom/icons';
import { P } from '@unhook/ui/custom/typography';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/table';
import type Stripe from 'stripe';

interface InvoiceTableProps {
  invoices: Stripe.Invoice[] | null;
  isError: boolean;
}

export function InvoiceTable({ invoices, isError }: InvoiceTableProps) {
  if (isError) {
    return <P className="text-muted-foreground">Failed to load invoices.</P>;
  }

  if (!invoices || invoices.length === 0) {
    return <P className="text-muted-foreground">No invoices found.</P>;
  }

  return (
    <div className="relative">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const date = new Date(invoice.created * 1000);
            const amount = new Intl.NumberFormat('en-US', {
              currency: invoice.currency,
              style: 'currency',
            }).format(invoice.amount_paid / 100);

            return (
              <TableRow key={invoice.id}>
                <TableCell>
                  {date.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell>{amount}</TableCell>
                <TableCell className="capitalize">
                  {invoice.status === 'paid' ? (
                    <span className="flex items-center gap-2 text-success">
                      <Icons.CheckCircle2 size="sm" variant="primary" />
                      {invoice.status}
                    </span>
                  ) : (
                    invoice.status
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {invoice.hosted_invoice_url && (
                    <Button asChild size="sm" variant="ghost">
                      <a
                        href={invoice.hosted_invoice_url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        View Invoice
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
