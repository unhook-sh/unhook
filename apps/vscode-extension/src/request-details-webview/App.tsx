// biome-ignore lint/style/useFilenamingConvention: <explanation>
import type { RequestType } from '@unhook/db/schema';
import { Icons } from '@unhook/ui/custom/icons';
import { useEffect, useRef, useState } from 'react';

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
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu on outside click or escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKey);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

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
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icons.ListFilter size="sm" variant="muted" />
        </button>
        {menuOpen && (
          <div
            ref={menuRef}
            tabIndex={-1}
            style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              minWidth: 180,
              background: 'var(--vscode-menu-background)',
              color: 'var(--vscode-menu-foreground)',
              border: '1px solid var(--vscode-menu-border)',
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 10,
              padding: '0.25rem 0',
            }}
            role="menu"
            aria-label="Filter options"
          >
            <button
              type="button"
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                padding: '0.5rem 1rem',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '1em',
              }}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              Featured
            </button>
            <button
              type="button"
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                padding: '0.5rem 1rem',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '1em',
              }}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              Most Popular
            </button>
            <button
              type="button"
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                padding: '0.5rem 1rem',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '1em',
              }}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              Recently Published
            </button>
          </div>
        )}
      </div>
      {/* Main Content */}
      <h1>Unhook API</h1>
      <div className="content">
        <p>Welcome to the Unhook VS Code extension!</p>
        <div className="card">
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            Count is {count}
          </button>
          <p>
            Edit <code>src/webview/App.tsx</code> and save to test HMR
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [requestData, setRequestData] = useState<RequestType | null>(null);

  useEffect(() => {
    // Listen for messages from the extension
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'requestData':
          setRequestData(message.data);
          break;
      }
    };

    window.addEventListener('message', messageHandler);
    // Notify the extension that the webview is ready
    window.vscode.postMessage({ type: 'ready' });

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  if (requestData) {
    return <RequestDetails data={requestData} />;
  }

  return <MainView />;
}

export default App;
