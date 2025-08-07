import type {
  EventTypeWithRequest,
  RequestTypeWithEventType,
} from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { useEffect, useState } from 'react';
import { EmptyState } from './components/empty-state';
import { ErrorState } from './components/error-state';
import { EventDetails } from './components/event-details';
import { RequestDetails } from './components/request-details';
import { vscode } from './lib/vscode';

const log = debug('unhook:vscode:request-details-webview');

function App() {
  const [requestData, setRequestData] =
    useState<RequestTypeWithEventType | null>(null);
  const [eventData, setEventData] = useState<EventTypeWithRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const messageHandler = (
      event: MessageEvent<{
        data: RequestTypeWithEventType | EventTypeWithRequest;
        type: 'requestData' | 'eventData';
      }>,
    ) => {
      try {
        const message = event.data;
        switch (message.type) {
          case 'requestData':
            setRequestData(message.data as RequestTypeWithEventType);
            setEventData(null);
            setError(null);
            break;
          case 'eventData':
            setEventData(message.data as EventTypeWithRequest);
            setRequestData(null);
            setError(null);
            break;
          default:
            log('Unknown message type', { type: message.type });
        }
      } catch {
        setError('Error processing data');
      }
    };

    window.addEventListener('message', messageHandler);
    log('Sending ready message to extension');
    vscode.postMessage({ type: 'ready' });

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  if (error) return <ErrorState error={error} />;
  if (requestData) return <RequestDetails data={requestData} />;
  if (eventData) return <EventDetails data={eventData} />;
  return <EmptyState />;
}

export default App;
