'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const isDevelopment = process.env.NODE_ENV === 'development';

export function ReactScan(): null {
  const pathParams = useSearchParams();
  const enabled = pathParams.get('react-scan') === 'true';

  useEffect(() => {
    if (enabled && isDevelopment) {
      import('react-scan').then(({ scan }) => {
        scan({
          enabled,
        });
      });
    }
  }, [enabled]);

  return null;
}
