'use client';

import { FileIcon } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { cn } from '../lib/utils';

export type CodeBlockProps = {
  children?: React.ReactNode;
  className?: string;
  filename?: string;
} & React.HTMLProps<HTMLDivElement>;

function CodeBlock({
  children,
  className,
  filename,
  ...props
}: CodeBlockProps) {
  return (
    <div
      className={cn(
        'not-prose flex w-full flex-col overflow-clip border',
        'border-border bg-card text-card-foreground rounded-xl',
        className,
      )}
      {...props}
    >
      {filename && (
        <div className="flex items-center border-b border-border bg-accent p-2 text-sm text-foreground">
          <FileIcon className="mr-2 size-4" />
          {filename}
        </div>
      )}
      {children}
    </div>
  );
}

export type CodeBlockCodeProps = {
  code: string;
  language?: string;
  theme?: string;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

function CodeBlockCode({
  code,
  language = 'tsx',
  theme = 'github-light',
  className,
  ...props
}: CodeBlockCodeProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  useEffect(() => {
    async function highlight() {
      const html = await codeToHtml(code, { lang: language, theme });
      setHighlightedHtml(html);
    }
    highlight();
  }, [code, language, theme]);

  const classNames = cn(
    'w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4',
    className,
  );

  // SSR fallback: render plain code if not hydrated yet
  return highlightedHtml ? (
    <div
      className={classNames}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: pre-processed code highlighting
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      {...props}
    />
  ) : (
    <div className={classNames} {...props}>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export type CodeBlockGroupProps = React.HTMLAttributes<HTMLDivElement>;

function CodeBlockGroup({
  children,
  className,
  ...props
}: CodeBlockGroupProps) {
  return (
    <div
      className={cn('flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { CodeBlockGroup, CodeBlockCode, CodeBlock };
