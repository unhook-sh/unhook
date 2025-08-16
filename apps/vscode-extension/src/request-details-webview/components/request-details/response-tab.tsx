'use client';

import { extractBody } from '@unhook/client/utils/extract-body';
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
import { useRequest } from './request-context';

interface ResponseTabProps {
  responseBody: string;
}

const formatResponseBody = (
  responseBody: string,
  format: 'raw' | 'json' | 'yaml',
) => {
  try {
    const extractedBody = extractBody(responseBody);
    if (!extractedBody) return 'No response data available';

    // Check if the extracted body is valid JSON
    let isJson = false;
    try {
      JSON.parse(extractedBody);
      isJson = true;
    } catch {
      // Not valid JSON
    }

    switch (format) {
      case 'raw': {
        return extractedBody;
      }
      case 'json': {
        if (isJson) {
          // Parse and format as JSON
          const parsed = JSON.parse(extractedBody);
          return JSON.stringify(parsed, null, 2);
        }
        // If not JSON, return as raw with a note
        return `// Not valid JSON - displaying as raw\n${extractedBody}`;
      }
      case 'yaml': {
        if (isJson) {
          // Use js-yaml to generate proper YAML
          const parsed = JSON.parse(extractedBody);
          return dump(parsed);
        }
        // If not valid JSON, return as raw
        return extractedBody;
      }
      default: {
        return extractedBody;
      }
    }
  } catch (error) {
    console.error('Error formatting response body:', error);
    return responseBody;
  }
};

export function ResponseTab({ responseBody }: ResponseTabProps) {
  const { isCompleted, isFailed } = useRequest();

  // Determine if the response body is valid JSON to set default format
  const isJsonResponse = (() => {
    try {
      const extractedBody = extractBody(responseBody);
      if (!extractedBody) return false;
      JSON.parse(extractedBody);
      return true;
    } catch {
      return false;
    }
  })();

  const [bodyFormat, setBodyFormat] = useState<'raw' | 'json' | 'yaml'>(
    isJsonResponse ? 'json' : 'raw',
  );
  const [bodyCodeEl, setBodyCodeEl] = useState<HTMLDivElement | null>(null);

  // Render highlighted code for response body
  useEffect(() => {
    let isActive = true;
    async function renderHighlighted() {
      if (!bodyCodeEl) return;
      if (bodyFormat === 'raw') {
        if (bodyCodeEl) bodyCodeEl.innerHTML = '';
        return;
      }
      try {
        const formatted = formatResponseBody(responseBody, bodyFormat);
        if (!formatted || formatted === 'No response data available') {
          bodyCodeEl.innerHTML = '';
          return;
        }

        const html = await codeToHtml(formatted, {
          lang: bodyFormat === 'yaml' ? 'yaml' : 'json',
          theme: 'github-dark-default',
        });
        if (isActive && bodyCodeEl) {
          bodyCodeEl.innerHTML = html;
        }
      } catch {
        // Fallback: do nothing
      }
    }
    renderHighlighted();
    return () => {
      isActive = false;
    };
  }, [bodyFormat, responseBody, bodyCodeEl]);

  if (!isCompleted && !isFailed) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Response not yet available</p>
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-lg border max-h-[70vh] flex flex-col">
      <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
        <span className="text-sm font-medium text-foreground">
          Response Body
        </span>
        <div className="flex items-center gap-2">
          <Select
            onValueChange={(value) =>
              setBodyFormat(value as 'raw' | 'json' | 'yaml')
            }
            value={bodyFormat}
          >
            <SelectTrigger className="w-32" size="sm">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="raw">Raw</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="yaml">YAML</SelectItem>
            </SelectContent>
          </Select>
          <CopyButton
            className="gap-2"
            size="sm"
            text={formatResponseBody(responseBody, bodyFormat)}
            variant="outline"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {bodyFormat === 'raw' ? (
          <pre className="text-sm text-foreground w-full whitespace-pre-wrap break-all break-words font-mono leading-relaxed p-4">
            {formatResponseBody(responseBody, bodyFormat)}
          </pre>
        ) : (
          <div className="shiki text-xs font-mono p-4" ref={setBodyCodeEl} />
        )}
      </div>
    </div>
  );
}
