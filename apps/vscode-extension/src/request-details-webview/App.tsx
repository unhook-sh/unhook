// biome-ignore lint/style/useFilenamingConvention: <explanation>
import type { RequestType } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { Icons } from '@unhook/ui/custom/icons';
import { useEffect, useRef, useState } from 'react';

const log = debug('unhook:vscode:request-details-app');

// Declare the vscode global
declare global {
  interface Window {
    vscode: {
      postMessage: (message: unknown) => void;
    };
  }
}

function RequestDetails({ data }: { data: RequestType }) {
  const parseBody = (body?: string) => {
    if (!body) return null;
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  };

  return (
    <div className="app">
      <div className="section">
        <div className="section-title">Request</div>
        <pre>
          Method: <span className="key">{data.request.method}</span>
          URL: <span className="value">{data.request.sourceUrl}</span>
          Content Type:{' '}
          <span className="value">{data.request.contentType}</span>
          Size: <span className="value">{data.request.size} bytes</span>
          Client IP: <span className="value">{data.request.clientIp}</span>
        </pre>
      </div>

      <div className="section">
        <div className="section-title">Request Headers</div>
        <pre>{JSON.stringify(data.request.headers, null, 2)}</pre>
      </div>

      {data.request.body && (
        <div className="section">
          <div className="section-title">Request Body</div>
          <pre>{JSON.stringify(parseBody(data.request.body), null, 2)}</pre>
        </div>
      )}

      {data.response && (
        <>
          <div className="section">
            <div className="section-title">Response</div>
            <pre>
              Status:{' '}
              <span
                className={`status status-${Math.floor(
                  data.response.status / 100,
                )}xx`}
              >
                {data.response.status}
              </span>
              {data.responseTimeMs && (
                <>
                  Response Time:{' '}
                  <span className="value">{data.responseTimeMs}ms</span>
                </>
              )}
            </pre>
          </div>

          <div className="section">
            <div className="section-title">Response Headers</div>
            <pre>{JSON.stringify(data.response.headers, null, 2)}</pre>
          </div>

          {data.response.body && (
            <div className="section">
              <div className="section-title">Response Body</div>
              <pre>
                {JSON.stringify(parseBody(data.response.body), null, 2)}
              </pre>
            </div>
          )}
        </>
      )}

      {data.failedReason && (
        <div className="section">
          <div className="section-title">Failure Reason</div>
          <pre>{data.failedReason}</pre>
        </div>
      )}
    </div>
  );
}

function MainView() {
  const [filter, setFilter] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="app">
      {/* Filter Bar with Popout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--vscode-input-background)',
          border: '1px solid var(--vscode-input-border)',
          borderRadius: 2,
          padding: '0.25rem 0.5rem',
          marginBottom: '1rem',
          gap: '0.5rem',
          position: 'relative',
        }}
      >
        <input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--vscode-input-foreground)',
            fontSize: '1em',
          }}
        />
        <button
          ref={buttonRef}
          type="button"
          aria-label="Show filter menu"
          style={{
            background: 'none',
            border: 'none',
            padding: 4,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--vscode-input-foreground)',
          }}
          onClick={() => {}}
        >
          <Icons.ListFilter size="sm" variant="muted" />
        </button>
      </div>

      <div className="content">
        <div className="card">
          <h1>Request Details</h1>
          <p>Select a request from the events view to see its details here.</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [requestData, setRequestData] = useState<RequestType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    log('Setting up message handler');
    // Listen for messages from the extension
    const messageHandler = (event: MessageEvent) => {
      try {
        const message = event.data;
        log('Received message from extension', { message });
        switch (message.type) {
          case 'requestData':
            log('Setting request data', { requestId: message.data.id });
            setRequestData(message.data);
            setError(null);
            break;
          default:
            log('Unknown message type', { type: message.type });
        }
      } catch (err) {
        log('Error handling message', { error: err });
        setError('Error processing request data');
      }
    };

    window.addEventListener('message', messageHandler);
    // Notify the extension that the webview is ready
    log('Sending ready message to extension');
    window.vscode.postMessage({ type: 'ready' });

    return () => {
      log('Cleaning up message handler');
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  if (error) {
    return (
      <div className="app">
        <div className="card">
          <h1>Error</h1>
          <p>{error}</p>
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
