import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowRight } from 'lucide-react';
import type * as React from 'react';
import { cn } from '../lib/utils';

const glowButtonVariants = cva(
  'relative inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    defaultVariants: {
      showArrow: false,
      size: 'default',
      variant: 'default',
    },
    variants: {
      showArrow: {
        false: '',
        true: 'pr-12',
      },
      size: {
        default: 'h-12 px-6 py-2',
        lg: 'h-14 px-8 text-base',
        sm: 'h-9 rounded-md px-3 text-xs',
      },
      variant: {
        default: 'text-white',
        outline: 'text-white',
      },
    },
  },
);

function GlowButton({
  className,
  variant,
  size,
  showArrow,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof glowButtonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(
        'group relative',
        glowButtonVariants({ className, showArrow, size, variant }),
      )}
      data-slot="glow-button"
      {...props}
    >
      {/* Glow effect container */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 transition duration-1000" />

      {/* Button content */}
      <div className="relative bg-black border border-transparent rounded-full px-6 py-2">
        {children}
        {showArrow && <ArrowRight className="absolute right-6 size-5" />}
      </div>
    </Comp>
  );
}

export { GlowButton, glowButtonVariants };
