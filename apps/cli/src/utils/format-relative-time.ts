import { differenceInMinutes, format, formatDistanceToNow } from 'date-fns';

export function formatRelativeTime(
  date: Date,
  { addSuffix = true }: { addSuffix?: boolean } = {},
) {
  const now = new Date();
  const time = new Date(date);
  let timeText: string;

  const diffInMinutes = differenceInMinutes(now, time);
  const isInFuture = time > now;

  if (Math.abs(diffInMinutes) < 60) {
    // Less than an hour - show minutes/seconds
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (Math.abs(diffInSeconds) < 60) {
      // Less than a minute - show seconds
      timeText = `${Math.abs(diffInSeconds)} seconds`;
    } else {
      // Minutes
      timeText = formatDistanceToNow(time, {
        includeSeconds: false,
      });
      // Remove the "about" prefix if it exists
      timeText = timeText.replace('about ', '');
    }

    if (addSuffix) {
      timeText = isInFuture ? `in ${timeText}` : `${timeText} ago`;
    }
  } else {
    // More than an hour - use standard format
    timeText = format(time, 'MMM d, HH:mm:ss');
  }

  return timeText;
}
