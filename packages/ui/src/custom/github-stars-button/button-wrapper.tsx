'use client';

import { Suspense } from 'react';
import { GitHubStarsButton } from './index';

export function GitHubStarsButtonWrapper({
  repo,
  className,
}: {
  repo: string;
  className?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="h-9 w-[120px] animate-pulse rounded-full bg-muted" />
      }
    >
      <GitHubStarsButton className={className} repo={repo} />
    </Suspense>
  );
}
