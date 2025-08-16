'use client';

import { Card, CardContent } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';

export function NoDataFallback() {
  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="py-10">
          <div className="flex flex-col items-center gap-3">
            <Icons.AlertTriangle size="lg" variant="warning" />
            <p className="text-sm text-muted-foreground">
              No request data available
            </p>
            <p className="text-xs text-muted-foreground">No data loaded.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
