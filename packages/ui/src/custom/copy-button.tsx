'use client';

import { IconCheck, IconCopy, IconLoader2 } from '@tabler/icons-react';
import { cva, type VariantProps } from 'class-variance-authority';
import type React from 'react';
import { useState } from 'react';
import { Button } from '../components/button';
import { toast } from '../components/sonner';
import { cn } from '../lib/utils';

export type CopyState = 'idle' | 'copying' | 'copied';

const copyButtonVariants = cva('relative', {
  defaultVariants: {
    size: 'default',
    variant: 'ghost',
  },
  variants: {
    size: {
      default: 'h-9 w-9',
      lg: 'h-10 w-10',
      sm: 'h-7 w-7',
    },
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      outline:
        'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    },
  },
});

export interface CopyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof copyButtonVariants> {
  text: string;
  onCopied?: () => void;
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export function CopyButton({
  className,
  text,
  onCopied,
  size,
  variant,
  showToast = true,
  successMessage = 'Copied to clipboard',
  errorMessage = 'Failed to copy to clipboard',
  ...props
}: CopyButtonProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const copyToClipboard = async () => {
    setCopyState('copying');
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
      if (showToast) {
        toast.success(successMessage);
      }
      onCopied?.();
      setTimeout(() => setCopyState('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      if (showToast) {
        toast.error(errorMessage);
      }
      setCopyState('idle');
    }
  };

  return (
    <Button
      aria-label={copyState === 'copied' ? 'Copied' : 'Copy to clipboard'}
      className={cn(copyButtonVariants({ size, variant }), className)}
      onClick={copyToClipboard}
      type="button"
      {...props}
    >
      {copyState === 'copying' ? (
        <IconLoader2
          className="text-muted-foreground animate-spin"
          size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18}
        />
      ) : copyState === 'copied' ? (
        <IconCheck
          className="text-primary"
          size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18}
        />
      ) : (
        <IconCopy
          className="text-muted-foreground"
          size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18}
        />
      )}
    </Button>
  );
}
