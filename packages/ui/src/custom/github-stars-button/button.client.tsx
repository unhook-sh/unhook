'use client';

import { Icons } from '@unhook/ui/custom/icons';
import { cn } from '@unhook/ui/lib/utils';

export function GitHubStarsButtonClient({
  className,
  repo,
}: { stars: number; className?: string; repo: string }) {
  const _formater = Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 0,
  });

  return (
    <a
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        'h-8.5 md:h-9',
        className,
      )}
      aria-label={`Star ${repo} on GitHub`}
    >
      {/* <span className="flex items-center gap-2 pl-4 pr-2 py-2 border-r border-border"> */}
      <span className="flex items-center gap-2 px-4 py-2">
        <Icons.Github size="sm" variant="primary" />
        <span>Star</span>
      </span>
      {/* <span className="flex items-center w-12 h-full justify-center px-3 py-2 bg-accent/50 rounded-r-full"> */}
      {/* <NumberTicker
          value={stars}
          direction="up"
          formatter={(num) => formater.format(num)}
        /> */}
      {/* Open Source */}
      {/* </span> */}
    </a>
  );
}
