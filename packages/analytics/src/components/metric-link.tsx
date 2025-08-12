'use client';

import type { LinkProps } from 'next/link';
import NextLink from 'next/link';
import posthog from 'posthog-js';

export interface MetricLinkProps extends LinkProps {
  /** The metric name to track in PostHog */
  metric: string;
  /** Optional properties to include with the metric */
  properties?: Record<string, unknown>;
  /** Optional children to render */
  children: React.ReactNode;
  /** Optional className for styling */
  className?: string;
}

/**
 * A Link component that automatically tracks metrics in PostHog when clicked.
 * Extends Next.js Link with analytics capabilities.
 */
export const MetricLink = ({
  metric,
  properties = {},
  children,
  className,
  ref,
  ...linkProps
}: MetricLinkProps & { ref?: React.Ref<HTMLAnchorElement> }) => {
  const handleClick = () => {
    // Track the metric in PostHog
    posthog.capture(metric, properties);
  };

  return (
    <NextLink
      className={className}
      onClick={handleClick}
      ref={ref}
      {...linkProps}
    >
      {children}
    </NextLink>
  );
};

MetricLink.displayName = 'MetricLink';
