'use client';

import { extractBody } from '@unhook/client/utils/extract-body';
import { extractEventName } from '@unhook/client/utils/extract-event-name';
import type {
  EventTypeWithRequest,
  RequestTypeWithEventType,
} from '@unhook/db/schema';
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

interface AiPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'event' | 'request';
  data: EventTypeWithRequest | RequestTypeWithEventType;
}

export function AiPromptDialog({
  open,
  onOpenChange,
  mode,
  data,
}: AiPromptDialogProps) {
  const generateEventPrompt = () => {
    const event = data as EventTypeWithRequest;
    const failedRequests = event.requests.filter(
      (req) => req.status === 'failed',
    );
    const slowRequests = event.requests.filter(
      (req) => req.responseTimeMs > 2000, // 2 second requirement
    );

    const headers = event.originRequest?.headers || {};
    const payload = event.originRequest?.body || '';
    const source = event.source || 'Unknown';
    const timestamp = event.timestamp
      ? new Date(event.timestamp).toISOString()
      : new Date().toISOString();
    const isRetry = event.retryCount > 0;
    const retryAttempt = event.retryCount || 0;

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

  const generateRequestPrompt = () => {
    const request = data as RequestTypeWithEventType;
    const event = request.event;

    if (!event) {
      return 'Unable to generate AI prompt: Event data not available for this request.';
    }

    const headers = event.originRequest?.headers || {};
    const payload = event.originRequest?.body || '';
    const source = event.source || 'Unknown';
    const timestamp = event.timestamp
      ? new Date(event.timestamp).toISOString()
      : new Date().toISOString();
    const eventName = event.originRequest?.body
      ? extractEventName(event.originRequest.body) || 'Unknown event'
      : 'Unknown event';

    return `I need help debugging a specific webhook request issue. Here's the complete context:

**Request Details:**
- Event Name: ${eventName}
- Source: ${source}
- Destination URL: ${request.destinationUrl}
- Request Status: ${request.status}
- Response Time: ${request.responseTimeMs}ms
- Timestamp: ${timestamp}

**Request Headers:**
${Object.entries(headers)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

**Request Payload:**
\`\`\`json
${(() => {
  const extractedBody = extractBody(payload);
  return extractedBody || 'No payload data available';
})()}
\`\`\`

**Response Details:**
- Status Code: ${request.response?.status || 'N/A'}
- Response Headers: ${request.response?.headers ? JSON.stringify(request.response.headers, null, 2) : 'N/A'}
- Response Body: ${(() => {
      if (request.response?.body) {
        const extractedResponseBody = extractBody(request.response.body);
        return extractedResponseBody || request.response.body;
      }
      return 'No response body available';
    })()}

**Issues Detected:**
${request.status === 'failed' ? `- Request failed: ${request.failedReason || 'Unknown reason'}` : ''}
${request.responseTimeMs > 2000 ? '- Request is slow (>2s response time)' : ''}
${request.response?.status && request.response.status >= 400 ? `- HTTP error: ${request.response.status}` : ''}
${request.status !== 'failed' && request.responseTimeMs <= 2000 && (!request.response?.status || request.response.status < 400) ? '- No obvious issues detected' : ''}

Please analyze this specific request and help me:
1. Identify why this request failed or performed poorly
2. Suggest specific fixes for the destination endpoint
3. Recommend optimizations for the request/response handling
4. Provide code examples if applicable
5. Suggest monitoring or alerting improvements

Focus on actionable solutions I can implement for this specific endpoint.`;
  };

  const generateAiPrompt = () => {
    return mode === 'event' ? generateEventPrompt() : generateRequestPrompt();
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
