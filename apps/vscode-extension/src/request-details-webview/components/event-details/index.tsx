'use client';

import type { EventTypeWithRequest } from '@unhook/db/schema';
import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import { Card, CardContent } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@unhook/ui/dialog';
import Link from 'next/link';
import { useState } from 'react';

// Simple toast hook for this component
const useToast = () => {
  const toast = (options: {
    title: string;
    description?: string;
    duration?: number;
  }) => {
    // Simple console log for now - in a real app this would show a toast notification
    console.log(`Toast: ${options.title}`, options.description || '');
  };
  return { toast };
};

// Mock webhook data for demonstration
const mockWebhookData = {
  config: {
    maxResponseTime: '3s',
    requiredResponseTime: '2s', // Slack requirement
    retryAttempts: 3,
    retryDelay: 'exponential',
  },
  forwardedRequests: [
    {
      id: 'fwd_001',
      isRetry: false,
      response: { processed: true, received: true },
      responseTime: '145ms',
      status: 200,
      url: 'http://localhost:3000/api/webhooks/stripe',
    },
    {
      id: 'fwd_002',
      isRetry: true,
      response: { error: 'Database connection failed' },
      responseTime: '2.3s',
      retryAttempt: 2,
      status: 500,
      url: 'http://localhost:8080/webhooks/customer',
    },
    {
      id: 'fwd_003',
      isRetry: false,
      response: { customerId: 'cus_1234567890', success: true },
      responseTime: '89ms',
      status: 200,
      url: 'http://localhost:4000/api/stripe-events',
    },
  ],
  headers: {
    Accept: '*/*',
    'Content-Length': '1247',
    'Content-Type': 'application/json',
    'Stripe-Signature': 'v1=abc123def456...',
    'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
    'X-Forwarded-For': '54.187.174.169',
    'X-Stripe-Retry': '2',
  },
  isRetry: true,
  originalEventId: 'evt_1234567889',
  payload: {
    api_version: '2023-10-16',
    created: 1705315845,
    data: {
      object: {
        address: {
          city: 'San Francisco',
          country: 'US',
          line1: '123 Main St',
          postal_code: '94105',
          state: 'CA',
        },
        created: 1705315845,
        email: 'john.doe@example.com',
        id: 'cus_1234567890',
        name: 'John Doe',
        object: 'customer',
        phone: '+1234567890',
      },
    },
    id: 'evt_1234567890',
    livemode: false,
    object: 'event',
    pending_webhooks: 1,
    request: {
      id: 'req_1234567890',
      idempotency_key: null,
    },
    type: 'customer.created',
  },
  retryAttempt: 2,
  source: 'Stripe',
  timestamp: '2024-01-15T10:30:45Z',
  type: 'customer.created',
};

export interface EventDetailsProps {
  data: EventTypeWithRequest;
}

export function EventDetails({ data }: EventDetailsProps) {
  const [activeTab, setActiveTab] = useState<
    'payload' | 'headers' | 'forwards'
  >('payload');
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      duration: 2000,
      title: 'Copied to clipboard',
    });
  };

  const replayEvent = () => {
    toast({
      description: 'Webhook event has been sent to all endpoints',
      duration: 3000,
      title: 'Event replayed',
    });
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300)
      return <Icons.Check className="size-4 text-green-500" />;
    if (status >= 500) return <Icons.X className="size-4 text-red-500" />;
    return <Icons.Clock className="size-4 text-amber-500" />;
  };

  const isSlowResponse = (responseTime: string) => {
    const timeMs = Number.parseFloat(responseTime.replace(/[^\d.]/g, ''));
    const unit = responseTime.includes('s') ? 1000 : 1;
    return timeMs * unit > 2000; // 2 second requirement
  };

  const generateAiPrompt = () => {
    const failedRequests = mockWebhookData.forwardedRequests.filter(
      (req) => req.status >= 400,
    );
    const slowRequests = mockWebhookData.forwardedRequests.filter((req) =>
      isSlowResponse(req.responseTime),
    );

    return `I need help debugging a webhook issue. Here's the complete context:

**Webhook Event:**
- Source: ${mockWebhookData.source}
- Type: ${mockWebhookData.type}
- Timestamp: ${mockWebhookData.timestamp}
- Is Retry: ${mockWebhookData.isRetry ? `Yes (attempt ${mockWebhookData.retryAttempt})` : 'No'}
${mockWebhookData.isRetry ? `- Original Event ID: ${mockWebhookData.originalEventId}` : ''}

**Configuration:**
- Required Response Time: ${mockWebhookData.config.requiredResponseTime}
- Max Response Time: ${mockWebhookData.config.maxResponseTime}
- Retry Attempts: ${mockWebhookData.config.retryAttempts}
- Retry Strategy: ${mockWebhookData.config.retryDelay}

**Headers:**
${Object.entries(mockWebhookData.headers)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

**Payload:**
\`\`\`json
${JSON.stringify(mockWebhookData.payload, null, 2)}
\`\`\`

**Forwarded Requests (${mockWebhookData.forwardedRequests.length} total):**
${mockWebhookData.forwardedRequests
  .map(
    (req) => `
- URL: ${req.url}
- Status: ${req.status}
- Response Time: ${req.responseTime}${isSlowResponse(req.responseTime) ? ' ⚠️ SLOW' : ''}
- Is Retry: ${req.isRetry ? `Yes (attempt ${req.retryAttempt})` : 'No'}
- Response: ${JSON.stringify(req.response, null, 2)}
`,
  )
  .join('\n')}

**Issues Detected:**
${failedRequests.length > 0 ? `- ${failedRequests.length} failed request(s) (status >= 400)` : ''}
${slowRequests.length > 0 ? `- ${slowRequests.length} slow request(s) (>${mockWebhookData.config.requiredResponseTime})` : ''}
${mockWebhookData.isRetry ? '- This is a retry event, indicating previous failures' : ''}
${failedRequests.length === 0 && slowRequests.length === 0 && !mockWebhookData.isRetry ? '- No obvious issues detected' : ''}

Please analyze this webhook debugging data and help me:
1. Identify the root cause of any failures or performance issues
2. Suggest specific fixes for the failing endpoints
3. Recommend optimizations for slow responses
4. Provide code examples if applicable
5. Suggest monitoring or alerting improvements

Focus on actionable solutions I can implement in my webhook handlers.`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge className="bg-blue-600 text-white px-3 py-1">
              {mockWebhookData.source}
            </Badge>
            <code className="text-sm font-mono text-gray-600">
              {mockWebhookData.type}
            </code>
            {mockWebhookData.isRetry && (
              <Badge
                className="gap-1 text-amber-600 border-amber-300"
                variant="outline"
              >
                <Icons.ArrowUpDown className="size-3" />
                Retry {mockWebhookData.retryAttempt}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 font-mono">
              {new Date(mockWebhookData.timestamp).toLocaleString()}
            </div>
            <Dialog onOpenChange={setShowAiPrompt} open={showAiPrompt}>
              <DialogTrigger asChild>
                <Button
                  className="gap-2 bg-transparent"
                  size="sm"
                  variant="outline"
                >
                  <Icons.Sparkles className="size-4" />
                  Debug with AI
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Icons.Sparkles className="size-5" />
                    Copy Prompt for Cursor
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Copy this comprehensive debugging prompt and paste it into
                    Cursor's chat to get AI assistance:
                  </p>
                  <div className="bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between p-3 border-b bg-gray-100 rounded-t-lg">
                      <span className="text-sm font-medium text-gray-700">
                        Debugging Prompt
                      </span>
                      <Button
                        className="gap-2"
                        onClick={() => copyToClipboard(generateAiPrompt())}
                        size="sm"
                        variant="ghost"
                      >
                        <Icons.Copy className="size-4" />
                        Copy All
                      </Button>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                        {generateAiPrompt()}
                      </pre>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button className="gap-2" onClick={replayEvent} size="sm">
              <Icons.ArrowUpDown className="size-4" />
              Replay Event
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-sm bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Icons.Clock className="size-4 text-blue-600" />
                <span className="text-gray-600">Response required within</span>
                <Badge
                  className="font-mono text-blue-700 border-blue-300"
                  variant="outline"
                >
                  {mockWebhookData.config.requiredResponseTime}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Max retries:</span>
                <Badge className="font-mono" variant="outline">
                  {mockWebhookData.config.retryAttempts}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Retry strategy:</span>
                <Badge className="font-mono" variant="outline">
                  {mockWebhookData.config.retryDelay}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: 'payload', label: 'Payload' },
              { key: 'headers', label: 'Headers' },
              { key: 'forwards', label: 'Forwards' },
            ].map((tab) => (
              <button
                className={`py-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                key={tab.key}
                onClick={() =>
                  setActiveTab(tab.key as 'payload' | 'headers' | 'forwards')
                }
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {activeTab === 'payload' && (
              <div>
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(mockWebhookData.payload, null, 2),
                      )
                    }
                    size="sm"
                    variant="outline"
                  >
                    <Icons.Copy className="size-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                  <pre className="text-green-400 text-sm font-mono">
                    {JSON.stringify(mockWebhookData.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="space-y-3">
                {Object.entries(mockWebhookData.headers).map(([key, value]) => (
                  <div
                    className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 rounded"
                    key={key}
                  >
                    <div className="font-mono text-sm font-medium text-gray-700 sm:w-48 flex-shrink-0">
                      {key}
                    </div>
                    <div className="font-mono text-sm text-gray-900 break-all">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'forwards' && (
              <div className="space-y-4">
                {mockWebhookData.forwardedRequests.map((request) => (
                  <Link href={`/request?id=${request.id}`} key={request.id}>
                    <Card className="border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(request.status)}
                            <Badge
                              className="font-mono"
                              variant={
                                request.status >= 200 && request.status < 300
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {request.status}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-mono ${isSlowResponse(request.responseTime) ? 'text-amber-600 font-medium' : 'text-gray-500'}`}
                              >
                                {request.responseTime}
                              </span>
                              {isSlowResponse(request.responseTime) && (
                                <Icons.AlertTriangle className="size-4 text-amber-500" />
                              )}
                            </div>
                            {request.isRetry && (
                              <Badge
                                className="gap-1 text-amber-600 border-amber-300"
                                variant="outline"
                              >
                                <Icons.ArrowUpDown className="size-3" />
                                Retry {request.retryAttempt}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="font-mono text-sm text-gray-700 mb-3 break-all">
                          {request.url}
                        </div>
                        <div className="bg-gray-50 rounded p-3">
                          <pre className="text-sm font-mono text-gray-800">
                            {JSON.stringify(request.response, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
