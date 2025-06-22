import { useEffect, useState } from 'react';

/**
 * useForceUpdate
 * Returns a stable callback that, when called, forces a re-render of the component.
 */
export function useForceUpdate({
  intervalMs = 1000,
}: {
  intervalMs?: number;
} = {}) {
  const [, forceUpdate] = useState({});
  // Add timer effect to update the page every second
  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate({});
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);
}
