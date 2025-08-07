import type { RequestTypeWithEventType } from '@unhook/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import { useState } from 'react';
import { vscode } from '../../lib/vscode';
import { DetailsGrid } from './details-grid';
import { RequestHeader } from './header';
import {
  RequestHeadersSection,
  ResponseHeadersSection,
} from './headers-sections';
import { PayloadTabs } from './payload-tabs';

export interface RequestDetailsProps {
  data: RequestTypeWithEventType;
}

export function RequestDetails({ data }: RequestDetailsProps) {
  const [isReplaying, setIsReplaying] = useState(false);
  const [headersOpen, setHeadersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleReplay = async () => {
    setIsReplaying(true);
    try {
      vscode.postMessage({ requestId: data.id, type: 'replayRequest' });
    } finally {
      setTimeout(() => setIsReplaying(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <RequestHeader
          data={data}
          isReplaying={isReplaying}
          onReplay={handleReplay}
        />

        <PayloadTabs data={data} />

        <div className="space-y-4">
          <RequestHeadersSection
            data={data}
            open={headersOpen}
            setOpen={setHeadersOpen}
          />

          {data.response && (
            <ResponseHeadersSection
              data={data}
              open={headersOpen}
              setOpen={setHeadersOpen}
            />
          )}

          <DetailsGrid
            data={data}
            open={detailsOpen}
            setOpen={setDetailsOpen}
          />

          {data.failedReason && (
            <Card className="bg-card border-destructive">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <Icons.AlertTriangle size="sm" />
                  Failure Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive">{data.failedReason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
