'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';
import { Button } from '../components/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../components/hover-card';
import { CopyButton } from './copy-button';

interface TimeDisplayProps {
  date: Date | string;
  children?: React.ReactNode;
  showRelative?: boolean;
  showUTC?: boolean;
  showLocal?: boolean;
  showSeconds?: boolean;
}

export function TimezoneDisplay({
  date,
  children,
  showRelative = false,
  showUTC = true,
  showLocal = true,
  showSeconds = true,
}: TimeDisplayProps) {
  const [_currentTime, setCurrentTime] = useState(new Date());
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Update current time for relative calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const timeFormat = showSeconds
    ? 'MMMM dd, yyyy hh:mm:ss a'
    : 'MMMM dd, yyyy hh:mm a';
  const formatLocalTime = (date: Date) => {
    return format(date, timeFormat);
  };

  const getTimezoneAbbreviation = (date: Date) => {
    return (
      date
        .toLocaleTimeString('en-US', {
          hour12: false,
          timeZoneName: 'short',
        })
        .split(' ')
        .pop() || 'UTC'
    );
  };

  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const timeDisplay = children || formatRelativeTime(dateObj);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button className="p-0 whitespace-nowrap" variant="link">
          {timeDisplay}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="min-w-fit flex flex-col gap-4">
        <div className="text-sm font-medium border-b border-border pb-2">
          Timezone Conversion
        </div>
        <div className="space-y-2">
          {showRelative && (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center rounded bg-muted px-2 py-1 text-xs font-medium">
                Relative
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-mono whitespace-nowrap">
                  {formatRelativeTime(dateObj)}
                </span>
                <CopyButton
                  showToast={true}
                  size="sm"
                  successMessage="Relative time copied"
                  text={formatRelativeTime(dateObj)}
                  variant="outline"
                />
              </div>
            </div>
          )}
          {showLocal && (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center rounded bg-muted px-2 py-1 text-xs font-medium space-x-2 whitespace-nowrap">
                <span>Your Device</span>
                <span className="text-muted-foreground">
                  {getTimezoneAbbreviation(dateObj)}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-mono whitespace-nowrap">
                  {formatLocalTime(dateObj)}
                </span>
                <CopyButton
                  showToast={true}
                  size="sm"
                  successMessage="Local time copied"
                  text={formatLocalTime(dateObj)}
                  variant="outline"
                />
              </div>
            </div>
          )}
          {showUTC && (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                UTC
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-mono whitespace-nowrap">
                  {format(
                    new Date(
                      dateObj.getTime() - dateObj.getTimezoneOffset() * 60000,
                    ),
                    timeFormat,
                  )}
                </span>
                <CopyButton
                  showToast={true}
                  size="sm"
                  successMessage="UTC time copied"
                  text={format(
                    new Date(
                      dateObj.getTime() - dateObj.getTimezoneOffset() * 60000,
                    ),
                    timeFormat,
                  )}
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
