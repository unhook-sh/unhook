import type {
  EventTypeWithRequest,
  RequestTypeWithEventType,
} from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import { useEffect, useState } from 'react';
import { ErrorState } from './components/error-state';
import { EventDetails } from './components/event-details';
import { LoadingState } from './components/loading-state';
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
        type: 'requestData' | 'eventData' | 'openRequestDetails';
      }>,
    ) => {
      try {
        const message = event.data;
        console.log('Webview received message:', message);
        console.log('Message type:', message.type);
        console.log('Message data:', message.data);

        switch (message.type) {
          case 'requestData':
            console.log('Setting request data:', message.data);
            setRequestData(message.data as RequestTypeWithEventType);
            setEventData(null);
            setError(null);
            break;
          case 'eventData':
            console.log('Setting event data:', message.data);
            setEventData(message.data as EventTypeWithRequest);
            setRequestData(null);
            setError(null);
            break;
          case 'openRequestDetails':
            console.log('Opening request details:', message.data);
            // Send message to extension to open request details
            vscode.postMessage({
              data: message.data,
              type: 'openRequestDetails',
            });
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        setError('Error processing data');
      }
    };

    window.addEventListener('message', messageHandler);
    log('Sending ready message to extension');
    console.log('Sending ready message to extension');
    vscode.postMessage({ type: 'ready' });

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  if (error) return <ErrorState error={error} />;
  if (requestData) return <RequestDetails data={requestData} />;
  if (eventData) return <EventDetails data={eventData} />;
  // First-time load: show a friendly loading screen before any data arrives
  return <LoadingState />;
}

export default App;
