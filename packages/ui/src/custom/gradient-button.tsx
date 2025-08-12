import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../lib/utils';

const gradientButtonVariants = cva(
  'inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-8 text-base',
        sm: 'h-8 rounded-md px-3 text-xs',
      },
      variant: {
        default:
          'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600',
        outline:
          'border border-neutral-800 bg-transparent text-white hover:bg-neutral-800 hover:text-white',
      },
    },
  },
);

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(gradientButtonVariants({ className, size, variant }))}
        ref={ref}
        {...props}
      />
    );
  },
);
GradientButton.displayName = 'GradientButton';

export { GradientButton, gradientButtonVariants };
