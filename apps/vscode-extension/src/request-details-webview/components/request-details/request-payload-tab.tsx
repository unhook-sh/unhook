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

interface RequestPayloadTabProps {
  payload: string;
}

const formatPayload = (payload: string, format: 'raw' | 'json' | 'yaml') => {
  try {
    const extractedBody = extractBody(payload);
    if (!extractedBody) return 'No payload data available';

    switch (format) {
      case 'raw': {
        return extractedBody;
      }
      case 'json': {
        // Try to parse and format as JSON
        const parsed = JSON.parse(extractedBody);
        return JSON.stringify(parsed, null, 2);
      }
      case 'yaml': {
        // Use js-yaml to generate proper YAML
        try {
          const parsed = JSON.parse(extractedBody);
          return dump(parsed);
        } catch {
          // If not valid JSON, return as raw
          return extractedBody;
        }
      }
      default: {
        return extractedBody;
      }
    }
  } catch (error) {
    console.error('Error formatting payload:', error);
    return payload;
  }
};

const canParseAsJson = (payload: string): boolean => {
  try {
    const extractedBody = extractBody(payload);
    if (!extractedBody) return false;
    JSON.parse(extractedBody);
    return true;
  } catch {
    return false;
  }
};

const getDefaultFormat = (payload: string): 'raw' | 'json' | 'yaml' => {
  return canParseAsJson(payload) ? 'json' : 'raw';
};

export function RequestPayloadTab({ payload }: RequestPayloadTabProps) {
  const [payloadFormat, setPayloadFormat] = useState<'raw' | 'json' | 'yaml'>(
    () => getDefaultFormat(payload),
  );
  const [codeEl, setCodeEl] = useState<HTMLDivElement | null>(null);

  // Update format when payload changes
  useEffect(() => {
    const newDefaultFormat = getDefaultFormat(payload);
    if (newDefaultFormat !== payloadFormat) {
      setPayloadFormat(newDefaultFormat);
    }
  }, [payload, payloadFormat]);

  // Render highlighted code for JSON/YAML using Shiki
  useEffect(() => {
    let isActive = true;
    async function renderHighlighted() {
      if (!codeEl) return;
      if (payloadFormat === 'raw') {
        if (codeEl) codeEl.innerHTML = '';
        return;
      }
      try {
        const formatted = formatPayload(payload, payloadFormat);
        if (!formatted || formatted === 'No payload data available') {
          codeEl.innerHTML = '';
          return;
        }

        const html = await codeToHtml(formatted, {
          lang: payloadFormat === 'yaml' ? 'yaml' : 'json',
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
  }, [payloadFormat, payload, codeEl]);

  const handlePayloadFormatChange = (format: 'raw' | 'json' | 'yaml') => {
    setPayloadFormat(format);
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted rounded-lg border max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
          <span className="text-sm font-medium text-foreground">
            Request Payload
          </span>
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(value) =>
                handlePayloadFormatChange(value as 'raw' | 'json' | 'yaml')
              }
              value={payloadFormat}
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
              text={formatPayload(payload, payloadFormat)}
              variant="outline"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {payloadFormat === 'raw' ? (
            <pre className="text-sm text-foreground w-full whitespace-pre-wrap break-all break-words font-mono leading-relaxed p-4">
              {formatPayload(payload, payloadFormat)}
            </pre>
          ) : (
            <div className="shiki text-xs font-mono p-4" ref={setCodeEl} />
          )}
        </div>
      </div>
    </div>
  );
}
