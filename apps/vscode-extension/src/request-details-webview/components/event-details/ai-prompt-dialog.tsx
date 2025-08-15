'use client';

import { extractBody } from '@unhook/client/utils/extract-body';
import { Button } from '@unhook/ui/button';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Icons } from '@unhook/ui/custom/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@unhook/ui/dialog';
import { vscode } from '../../lib/vscode';
import { useEvent } from './event-context';

interface AiPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiPromptDialog({ open, onOpenChange }: AiPromptDialogProps) {
  const { event, source, timestamp, isRetry, retryAttempt, headers, payload } =
    useEvent();

  const generateAiPrompt = () => {
    const failedRequests = event.requests.filter(
      (req) => req.status === 'failed',
    );
    const slowRequests = event.requests.filter(
      (req) => req.responseTimeMs > 2000, // 2 second requirement
    );

    return `I need help debugging a webhook issue. Here's the complete context:

**Webhook Event:**
- Source: ${source}
- Type: ${event.status}
- Timestamp: ${timestamp}
- Is Retry: ${isRetry ? `Yes (attempt ${retryAttempt})` : 'No'}

**Configuration:**
- Max Retries: ${event.maxRetries || 3}
- Retry Strategy: exponential backoff

**Headers:**
${Object.entries(headers)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

**Payload:**
\`\`\`json
${(() => {
  const extractedBody = extractBody(payload);
  return extractedBody || 'No payload data available';
})()}
\`\`\`

**Forwarded Requests (${event.requests.length} total):**
${event.requests
  .map(
    (req) => `
- URL: ${req.destinationUrl}
- Status: ${req.status}
- Response Time: ${req.responseTimeMs}ms${req.responseTimeMs > 2000 ? ' ⚠️ SLOW' : ''}
- Failed Reason: ${req.failedReason ? req.failedReason : 'None'}
- Response: ${(() => {
      if (req.response?.body) {
        const extractedResponseBody = extractBody(req.response.body);
        return extractedResponseBody || req.response.body;
      }
      return JSON.stringify(req.response, null, 2);
    })()}
`,
  )
  .join('\n')}

**Issues Detected:**
${failedRequests.length > 0 ? `- ${failedRequests.length} failed request(s) (status: failed)` : ''}
${slowRequests.length > 0 ? `- ${slowRequests.length} slow request(s) (>2s)` : ''}
${isRetry ? '- This is a retry event, indicating previous failures' : ''}
${failedRequests.length === 0 && slowRequests.length === 0 && !isRetry ? '- No obvious issues detected' : ''}

Please analyze this webhook debugging data and help me:
1. Identify the root cause of any failures or performance issues
2. Suggest specific fixes for the failing endpoints
3. Recommend optimizations for slow responses
4. Provide code examples if applicable
5. Suggest monitoring or alerting improvements

Focus on actionable solutions I can implement in my webhook handlers.`;
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="min-w-2/3 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icons.Sparkles className="size-5" />
            Copy Prompt for AI
          </DialogTitle>
          <DialogDescription>
            Copy this comprehensive debugging prompt and paste it into your AI
            assistant to get assistance:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted rounded-lg border max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
              <span className="text-sm font-medium text-foreground">
                Debugging Prompt
              </span>
              <div className="flex items-center gap-2">
                <Button
                  className="gap-2"
                  onClick={() => vscode.postMessage({ type: 'setupMcpServer' })}
                  size="sm"
                  variant="outline"
                >
                  Setup MCP Server
                </Button>
                <CopyButton
                  className="gap-2"
                  size="sm"
                  text={generateAiPrompt()}
                  variant="outline"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <pre className="text-sm text-foreground w-full whitespace-pre-wrap break-all break-words font-mono leading-relaxed p-4">
                {generateAiPrompt()}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
