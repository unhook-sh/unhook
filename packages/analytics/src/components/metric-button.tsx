'use client';

import { Button, type buttonVariants } from '@unhook/ui/button';
import type { VariantProps } from 'class-variance-authority';
import posthog from 'posthog-js';
import type { ComponentProps } from 'react';

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export interface MetricButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** The metric name to track in PostHog */
  metric: string;
  /** Optional properties to include with the metric */
  properties?: Record<string, unknown>;
  /** Optional children to render */
  children: React.ReactNode;
  /** Optional className for styling */
  className?: string;
  /** Optional onClick handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * A Button component that automatically tracks metrics in PostHog when clicked.
 * Wraps the shadcn Button with analytics capabilities.
 */
export const MetricButton = ({
  metric,
  properties = {},
  children,
  className,
  onClick,
  ...buttonProps
}: MetricButtonProps) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Track the metric in PostHog
    posthog.capture(metric, properties);

    // Call the original onClick handler if provided
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <Button className={className} onClick={handleClick} {...buttonProps}>
      {children}
    </Button>
  );
};

MetricButton.displayName = 'MetricButton';
