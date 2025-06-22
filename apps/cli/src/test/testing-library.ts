import { afterEach, expect } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { WebSocket } from 'ws';

// Register happy-dom globals
GlobalRegistrator.register();

// Add WebSocket to global scope
// biome-ignore lint/suspicious/noExplicitAny: WebSocket is a global
global.WebSocket = WebSocket as any;

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock window events
const originalDispatchEvent = window.dispatchEvent;
window.dispatchEvent = (event: Event) => {
  if (event.type === 'online' || event.type === 'offline') {
    // Simulate network state change
    Object.defineProperty(navigator, 'onLine', {
      value: event.type === 'online',
      configurable: true,
    });
  }
  return originalDispatchEvent.call(window, event);
};

// // Mock React DevTools
// vi.mock('react-devtools-core', () => ({
//   createDevTools: vi.fn(),
// }));

// // Mock ink components
// vi.mock('ink', () => ({
//   Box: ({ children }: { children: React.ReactNode }) => children,
//   Text: ({ children }: { children: React.ReactNode }) => children,
//   useFocusManager: () => ({
//     focus: vi.fn(),
//   }),
// }));
