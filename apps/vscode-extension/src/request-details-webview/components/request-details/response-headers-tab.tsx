'use client';

import { CopyButton } from '@unhook/ui/custom/copy-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unhook/ui/select';
import { dump } from 'js-yaml';
import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

interface ResponseHeadersTabProps {
  headers: Record<string, string>;
}

const formatHeaders = (
  headers: Record<string, string>,
  format: 'raw' | 'json' | 'yaml' | 'table',
) => {
  try {
    switch (format) {
      case 'raw': {
        return Object.entries(headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      }
      case 'json': {
        return JSON.stringify(headers, null, 2);
      }
      case 'yaml': {
        return dump(headers);
      }
      case 'table': {
        // Return empty for table as it's rendered separately
        return '';
      }
      default: {
        return JSON.stringify(headers, null, 2);
      }
    }
  } catch (error) {
    console.error('Error formatting headers:', error);
    return JSON.stringify(headers, null, 2);
  }
};

export function ResponseHeadersTab({ headers }: ResponseHeadersTabProps) {
  const [headersFormat, setHeadersFormat] = useState<
    'raw' | 'json' | 'yaml' | 'table'
  >('table');
  const [codeEl, setCodeEl] = useState<HTMLDivElement | null>(null);

  // Render highlighted code for JSON/YAML using Shiki
  useEffect(() => {
    let isActive = true;
    async function renderHighlighted() {
      if (!codeEl) return;
      if (headersFormat === 'raw' || headersFormat === 'table') {
        if (codeEl) codeEl.innerHTML = '';
        return;
      }
      try {
        const formatted = formatHeaders(headers, headersFormat);
        if (!formatted) {
          codeEl.innerHTML = '';
          return;
        }

        const html = await codeToHtml(formatted, {
          lang: headersFormat === 'yaml' ? 'yaml' : 'json',
          theme: 'github-dark-default',
        });
        if (isActive && codeEl) {
          codeEl.innerHTML = html;
        }
      } catch {
        // Fallback: do nothing; plain text will render via <pre>
      }
    }
    renderHighlighted();
    return () => {
      isActive = false;
    };
  }, [headersFormat, headers, codeEl]);

  const handleHeadersFormatChange = (
    format: 'raw' | 'json' | 'yaml' | 'table',
  ) => {
    setHeadersFormat(format);
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted rounded-lg border max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
          <span className="text-sm font-medium text-foreground">
            Response Headers
          </span>
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(value) =>
                handleHeadersFormatChange(
                  value as 'raw' | 'json' | 'yaml' | 'table',
                )
              }
              value={headersFormat}
            >
              <SelectTrigger className="w-32" size="sm">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="raw">Raw</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="yaml">YAML</SelectItem>
                <SelectItem value="table">Table</SelectItem>
              </SelectContent>
            </Select>
            <CopyButton
              className="gap-2"
              size="sm"
              text={
                headersFormat === 'table'
                  ? Object.entries(headers)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('\n')
                  : formatHeaders(headers, headersFormat)
              }
              variant="outline"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {headersFormat === 'raw' ? (
            <pre className="text-sm text-foreground w-full whitespace-pre-wrap break-all break-words font-mono leading-relaxed p-4">
              {formatHeaders(headers, headersFormat)}
            </pre>
          ) : headersFormat === 'table' ? (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 font-medium text-foreground sr-only">
                    Header
                  </th>
                  <th className="text-left p-2 font-medium text-foreground sr-only">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(headers).map(([key, value], index) => (
                  <tr
                    className={`border-b border-border/50 ${
                      index % 2 === 0
                        ? 'bg-[var(--vscode-textBlockQuote-background)]'
                        : 'bg-[var(--vscode-textBlockQuote-background)]/5'
                    }`}
                    key={key}
                  >
                    <td className="px-4 py-2 font-mono text-sm font-medium text-foreground whitespace-nowrap w-32">
                      {key}
                    </td>
                    <td className="px-4 py-2 font-mono text-sm text-foreground break-all pl-2">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="shiki text-xs font-mono p-4" ref={setCodeEl} />
          )}
        </div>
      </div>
    </div>
  );
}
