// biome-ignore lint/style/useFilenamingConvention: rename to app.tsx

import { debug } from '@unhook/logger';
import { cn } from '@unhook/ui/lib/utils';
import { useEffect, useRef, useState } from 'react';

const log = debug('unhook:vscode:request-details-webview');

// Types
interface RequestType {
  id: string;
  request: {
    method: string;
    sourceUrl: string;
    contentType: string;
    size: number;
    clientIp: string;
    headers: Record<string, string>;
    body?: string;
  };
  response?: {
    status: number;
    headers: Record<string, string>;
    body?: string;
  };
  responseTimeMs?: number;
  failedReason?: string;
}

// Icons
const ListFilterIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M21 6H19M21 12H16M21 18H16M7 20V13.5612C7 13.3532 7 13.2492 6.97958 13.1497C6.96147 13.0615 6.93151 12.9761 6.89052 12.8958C6.84431 12.8054 6.77934 12.7242 6.64939 12.5617L3.35061 8.43826C3.22066 8.27583 3.15569 8.19461 3.10948 8.10417C3.06849 8.02393 3.03853 7.93852 3.02042 7.85026C3 7.75078 3 7.64677 3 7.43875V5.6C3 5.03995 3 4.75992 3.10899 4.54601C3.20487 4.35785 3.35785 4.20487 3.54601 4.10899C3.75992 4 4.03995 4 4.6 4H13.4C13.9601 4 14.2401 4 14.454 4.10899C14.6422 4.20487 14.7951 4.35785 14.891 4.54601C15 4.75992 15 5.03995 15 5.6V7.43875C15 7.64677 15 7.75078 14.9796 7.85026C14.9615 7.93852 14.9315 8.02393 14.8905 8.10417C14.8443 8.19461 14.7793 8.27583 14.6494 8.43826L11.3506 12.5617C11.2207 12.7242 11.1557 12.8054 11.1095 12.8958C11.0685 12.9761 11.0385 13.0615 11.0204 13.1497C11 13.2492 11 13.3532 11 13.5612V17L7 20Z" />
  </svg>
);

// VSCode API type declaration
declare global {
  interface Window {
    acquireVsCodeApi?: () => {
      postMessage: (message: unknown) => void;
      getState: () => unknown;
      setState: (state: unknown) => void;
    };
  }
}

// Get the VS Code API
const vscode = window.acquireVsCodeApi?.() || {
  postMessage: (message: unknown) => {
    log('VSCode API not available, posting to parent', message);
    window.parent.postMessage(message, '*');
  },
};

function RequestDetails({ data }: { data: RequestType }) {
  const parseBody = (body?: string) => {
    if (!body) return null;
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  };

  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return 'bg-green-500 text-white';
    if (status >= 400) return 'bg-red-500 text-white';
    return 'bg-gray-500 text-white';
  };

  return (
    <div className="h-screen overflow-y-auto">
      <div className="space-y-4 p-4">
        {/* Request Card */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Request</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground">Method:</dt>
              <dd className="font-mono">{data.request.method}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground">URL:</dt>
              <dd className="font-mono break-all">{data.request.sourceUrl}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground">
                Content Type:
              </dt>
              <dd className="font-mono">{data.request.contentType}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground">Size:</dt>
              <dd>{data.request.size} bytes</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground">Client IP:</dt>
              <dd className="font-mono">{data.request.clientIp}</dd>
            </div>
          </dl>
        </div>

        {/* Request Headers Card */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Request Headers</h3>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
            <code>{JSON.stringify(data.request.headers, null, 2)}</code>
          </pre>
        </div>

        {/* Request Body Card */}
        {data.request.body && (
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Request Body</h3>
            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
              <code>
                {JSON.stringify(parseBody(data.request.body), null, 2)}
              </code>
            </pre>
          </div>
        )}

        {/* Response Section */}
        {data.response && (
          <>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Response</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <dt className="font-medium text-muted-foreground">Status:</dt>
                  <dd>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        getStatusColor(data.response.status),
                      )}
                    >
                      {data.response.status}
                    </span>
                  </dd>
                </div>
                {data.responseTimeMs && (
                  <div className="flex gap-2">
                    <dt className="font-medium text-muted-foreground">
                      Response Time:
                    </dt>
                    <dd>{data.responseTimeMs}ms</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Response Headers</h3>
              <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
                <code>{JSON.stringify(data.response.headers, null, 2)}</code>
              </pre>
            </div>

            {data.response.body && (
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold">Response Body</h3>
                <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
                  <code>
                    {JSON.stringify(parseBody(data.response.body), null, 2)}
                  </code>
                </pre>
              </div>
            )}
          </>
        )}

        {/* Error Card */}
        {data.failedReason && (
          <div className="rounded-lg border border-destructive bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-destructive">
              Failure Reason
            </h3>
            <p className="text-sm">{data.failedReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MainView() {
  const [filter, setFilter] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex h-screen flex-col p-4">
      {/* Filter Bar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Filter..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
          />
          <button
            ref={buttonRef}
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
            aria-label="Show filter menu"
          >
            <ListFilterIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1">
        <div className="h-full rounded-lg border bg-card p-6">
          <h2 className="text-2xl font-bold tracking-tight">Request Details</h2>
          <p className="text-muted-foreground mt-2">
            Select a request from the events view to see its details here.
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [requestData, setRequestData] = useState<RequestType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Setting up message handler');
    // Listen for messages from the extension
    const messageHandler = (event: MessageEvent) => {
      try {
        const message = event.data;
        console.log('Received message from extension', { message });
        switch (message.type) {
          case 'requestData':
            console.log('Setting request data', { requestId: message.data.id });
            setRequestData(message.data);
            setError(null);
            break;
          default:
            console.log('Unknown message type', { type: message.type });
        }
      } catch (err) {
        console.error('Error handling message', { error: err });
        setError('Error processing request data');
      }
    };

    window.addEventListener('message', messageHandler);
    // Notify the extension that the webview is ready
    log('Sending ready message to extension');
    vscode.postMessage({ type: 'ready' });

    return () => {
      console.log('Cleaning up message handler');
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold text-destructive">Error</h2>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (requestData) {
    return <RequestDetails data={requestData} />;
  }

  return <MainView />;
}

export default App;
