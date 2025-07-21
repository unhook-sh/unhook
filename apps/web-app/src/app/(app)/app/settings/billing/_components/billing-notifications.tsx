'use client';

import { Card, CardContent } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import { P } from '@unhook/ui/custom/typography';
import { useSearchParams } from 'next/navigation';

export function BillingNotifications() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  if (!success && !canceled) {
    return null;
  }

  return (
    <>
      {success && (
        <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="flex items-center gap-2 pt-6">
            <Icons.CheckCircle2 className="size-5 text-green-600" />
            <P>Your subscription has been successfully activated!</P>
          </CardContent>
        </Card>
      )}

      {canceled && (
        <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-2 pt-6">
            <Icons.AlertCircle className="size-5 text-yellow-600" />
            <P>Subscription setup was canceled. You can try again anytime.</P>
          </CardContent>
        </Card>
      )}
    </>
  );
}
