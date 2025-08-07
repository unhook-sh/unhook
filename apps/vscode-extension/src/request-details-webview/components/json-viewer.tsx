import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@unhook/ui/collapsible';
import { Icons } from '@unhook/ui/custom/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { codeToHtml } from 'shiki';

interface JsonViewerProps {
  data: string | object;
  title?: string;
  defaultExpanded?: boolean;
  className?: string;
  maxHeight?: number;
}

interface JsonNodeProps {
  data: unknown;
  keyName?: string;
  level: number;
  isLast?: boolean;
}

function JsonNode({ data, keyName, level }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  function computeArrayItemKey(value: unknown): string {
    if (
      value &&
      typeof value === 'object' &&
      'id' in (value as Record<string, unknown>)
    ) {
      const id = (value as Record<string, unknown>).id;
      if (typeof id === 'string' || typeof id === 'number') return String(id);
    }
    try {
      const s = JSON.stringify(value);
      return s ?? '[item]';
    } catch {
      return String(value);
    }
  }

  if (data === null) {
    return (
      <div className="flex items-center gap-2">
        {keyName && (
          <span className="text-primary font-medium">"{keyName}":</span>
        )}
        <span className="text-muted-foreground italic">null</span>
      </div>
    );
  }

  if (typeof data === 'string') {
    return (
      <div className="flex items-center gap-2">
        {keyName && (
          <span className="text-primary font-medium">"{keyName}":</span>
        )}
        <span className="text-foreground">"{data}"</span>
      </div>
    );
  }

  if (typeof data === 'number') {
    return (
      <div className="flex items-center gap-2">
        {keyName && (
          <span className="text-primary font-medium">"{keyName}":</span>
        )}
        <span className="text-foreground">{data}</span>
      </div>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        {keyName && (
          <span className="text-primary font-medium">"{keyName}":</span>
        )}
        <span className="text-foreground">{data.toString()}</span>
      </div>
    );
  }

  if (Array.isArray(data)) {
    const arr = data as unknown[];
    const isEmpty = arr.length === 0;

    return (
      <div className="select-none">
        <Collapsible onOpenChange={setIsExpanded} open={isExpanded}>
          <div className="flex items-center gap-2">
            {keyName && (
              <span className="text-primary font-medium">"{keyName}":</span>
            )}
            <CollapsibleTrigger asChild>
              <Button
                className="h-auto p-1 hover:bg-accent/50 rounded-sm"
                size="sm"
                variant="ghost"
              >
                <span className="flex items-center gap-1">
                  {isExpanded ? (
                    <Icons.ChevronDown className="h-3 w-3" />
                  ) : (
                    <Icons.ChevronRight className="h-3 w-3" />
                  )}
                  <span className="text-muted-foreground">
                    [{isEmpty ? '' : `${arr.length} items`}]
                  </span>
                </span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            {!isEmpty && (
              <div className="ml-4 border-l border-border pl-4 space-y-1">
                {arr.map((item, index) => (
                  <JsonNode
                    data={item}
                    isLast={index === arr.length - 1}
                    key={computeArrayItemKey(item)}
                    keyName={index.toString()}
                    level={level + 1}
                  />
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data as Record<string, unknown>);
    const isEmpty = keys.length === 0;

    return (
      <div className="select-none">
        <Collapsible onOpenChange={setIsExpanded} open={isExpanded}>
          <div className="flex items-center gap-2">
            {keyName && (
              <span className="text-primary font-medium">"{keyName}":</span>
            )}
            <CollapsibleTrigger asChild>
              <Button
                className="h-auto p-1 hover:bg-accent/50 rounded-sm"
                size="sm"
                variant="ghost"
              >
                <span className="flex items-center gap-1">
                  {isExpanded ? (
                    <Icons.ChevronDown className="h-3 w-3" />
                  ) : (
                    <Icons.ChevronRight className="h-3 w-3" />
                  )}
                  <span className="text-muted-foreground">
                    {`{${isEmpty ? '' : `${keys.length} properties`}}`}
                  </span>
                </span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            {!isEmpty && (
              <div className="ml-4 border-l border-border pl-4 space-y-1">
                {(keys as string[]).map((key, index) => (
                  <JsonNode
                    data={(data as Record<string, unknown>)[key]}
                    isLast={index === keys.length - 1}
                    key={key}
                    keyName={key}
                    level={level + 1}
                  />
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  return null;
}

export function JsonViewer({
  data,
  title = 'JSON Data',
  defaultExpanded = true,
  className = '',
  maxHeight = 600,
}: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showRaw, setShowRaw] = useState(false);
  const codeRef = useRef<HTMLDivElement | null>(null);

  const jsonData = useMemo(() => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return data;
  }, [data]);

  const jsonString = useMemo(() => {
    return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  }, [data]);

  useEffect(() => {
    let isActive = true;
    async function renderShiki() {
      if (!showRaw || !codeRef.current) return;
      try {
        const html = await codeToHtml(jsonString, {
          lang: 'json',
          theme: 'github-dark-default',
        });
        if (isActive && codeRef.current) {
          codeRef.current.innerHTML = html;
        }
      } catch {
        // Fallback: plain text
        if (isActive && codeRef.current) {
          codeRef.current.textContent = jsonString;
        }
      }
    }
    renderShiki();
    return () => {
      isActive = false;
    };
  }, [showRaw, jsonString]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!data) {
    return (
      <div className="text-center text-muted-foreground py-8 border border-dashed border-border rounded-lg">
        <Icons.X className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No data to display</p>
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-lg ${className}`}>
      <Collapsible onOpenChange={setIsExpanded} open={isExpanded}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <Icons.ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Icons.ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <h3 className="font-semibold text-foreground">{title}</h3>
              </div>
              <Badge className="text-xs" variant="secondary">
                {typeof jsonData === 'object'
                  ? Array.isArray(jsonData)
                    ? `${jsonData.length} items`
                    : `${Object.keys(jsonData).length} properties`
                  : typeof jsonData}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRaw((prev) => !prev);
                }}
                size="sm"
                variant="ghost"
              >
                {showRaw ? 'Tree' : 'Raw'}
              </Button>
              <Button
                className="opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard();
                }}
                size="sm"
                variant="ghost"
              >
                {copied ? (
                  <>
                    <Icons.Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Icons.Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {showRaw ? (
            <div
              className="p-4 font-mono text-sm overflow-auto bg-muted/50"
              style={{ maxHeight: `${maxHeight}px` }}
            >
              <div className="shiki" ref={codeRef} />
            </div>
          ) : (
            <div
              className="p-4 font-mono text-sm overflow-auto"
              style={{ maxHeight: `${maxHeight}px` }}
            >
              <div className="space-y-1">
                <JsonNode data={jsonData} level={0} />
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
