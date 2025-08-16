'use client';

import { getSourceDisplayTextFromString } from '@unhook/client/utils/source-display';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@unhook/ui/hover-card';

interface SourceTooltipProps {
  source: string;
  sourceUrl?: string;
  children: React.ReactNode;
}

export function SourceTooltip({
  source,
  sourceUrl,
  children,
}: SourceTooltipProps) {
  const sourceDisplayText = getSourceDisplayTextFromString(source, sourceUrl);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="min-w-fit flex flex-col gap-4">
        <div className="text-sm font-medium border-b border-border pb-2">
          Source Information
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded bg-muted px-2 py-1 text-xs font-medium">
              Source
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-mono whitespace-nowrap">
                {sourceDisplayText}
              </span>
              <CopyButton
                showToast={true}
                size="sm"
                successMessage="Provider copied"
                text={sourceDisplayText}
                variant="outline"
              />
            </div>
          </div>
          {sourceUrl && (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center rounded bg-muted px-2 py-1 text-xs font-medium">
                URL
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-mono whitespace-nowrap">
                  {sourceUrl}
                </span>
                <CopyButton
                  showToast={true}
                  size="sm"
                  successMessage="URL copied"
                  text={sourceUrl}
                  variant="outline"
                />
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
