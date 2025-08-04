'use client';

import { Check, Copy } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from 'next-themes';
import { type HTMLAttributes, useEffect, useState } from 'react';
import { Button } from '../components/button';
import { cn } from '../lib/utils';

interface ScriptCopyBtnProps extends HTMLAttributes<HTMLDivElement> {
  showMultiplePackageOptions?: boolean;
  codeLanguage: string;
  lightTheme: string;
  darkTheme: string;
  commandMap: Record<string, string>;
  className?: string;
}

export function ScriptCopyBtn({
  showMultiplePackageOptions = true,
  codeLanguage,
  lightTheme,
  darkTheme,
  commandMap,
  className,
}: ScriptCopyBtnProps) {
  const packageManagers = Object.keys(commandMap);
  const [packageManager, setPackageManager] = useState<string>(
    packageManagers[0] ?? '',
  );
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');
  const { theme } = useTheme();
  const command = commandMap[packageManager] ?? '';

  useEffect(() => {
    async function loadHighlightedCode() {
      try {
        const { codeToHtml } = await import('shiki');
        const highlighted = await codeToHtml(command, {
          defaultColor: theme === 'dark' ? 'dark' : 'light',
          lang: codeLanguage,
          themes: {
            dark: darkTheme,
            light: lightTheme,
          },
        });
        setHighlightedCode(highlighted);
      } catch (error) {
        console.error('Error highlighting code:', error);
        setHighlightedCode(`<pre>${command}</pre>`);
      }
    }

    loadHighlightedCode();
  }, [command, theme, codeLanguage, lightTheme, darkTheme]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'mx-auto flex max-w-md items-center justify-center',
        className,
      )}
    >
      <div className="w-full space-y-2">
        <div className="mb-2 flex items-center justify-center">
          {showMultiplePackageOptions && (
            <div className="relative">
              <div className="inline-flex overflow-hidden rounded-md border border-border text-xs">
                {packageManagers.map((pm, index) => (
                  <div className="flex items-center" key={pm}>
                    {index > 0 && (
                      <div aria-hidden="true" className="h-4 w-px bg-border" />
                    )}
                    <Button
                      className={`relative rounded-none bg-background px-2 py-1 hover:bg-background ${
                        packageManager === pm
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                      onClick={() => setPackageManager(pm)}
                      size="sm"
                      variant="ghost"
                    >
                      {pm}
                      {packageManager === pm && (
                        <motion.div
                          className="absolute inset-x-0 bottom-[1px] mx-auto h-0.5 w-[90%] bg-primary"
                          initial={false}
                          layoutId="activeTab"
                          transition={{
                            damping: 30,
                            stiffness: 500,
                            type: 'spring',
                          }}
                        />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="relative flex items-center">
          <div className="min-w-[300px] grow font-mono">
            {highlightedCode ? (
              <div
                className={`[&>pre]:overflow-x-auto [&>pre]:rounded-md [&>pre]:p-1.5 [&>pre]:px-4 [&>pre]:font-mono bg-background rounded ${
                  theme === 'dark' ? 'dark' : 'light'
                }`}
                // biome-ignore lint/security/noDangerouslySetInnerHtml: ok
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            ) : (
              <pre className="rounded-md border border-border bg-white p-2 px-4 font-mono dark:bg-black">
                {command}
              </pre>
            )}
          </div>
          <Button
            aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            className="relative ml-2 rounded-md hidden md:block"
            onClick={copyToClipboard}
            size="icon"
            variant="outline"
          >
            <span className="sr-only">{copied ? 'Copied' : 'Copy'}</span>
            <Copy
              className={`absolute inset-0 m-auto h-4 w-4 transition-all duration-300 ${
                copied ? 'scale-0' : 'scale-100'
              }`}
            />
            <Check
              className={`absolute inset-0 m-auto h-4 w-4 transition-all duration-300 ${
                copied ? 'scale-100' : 'scale-0'
              }`}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
