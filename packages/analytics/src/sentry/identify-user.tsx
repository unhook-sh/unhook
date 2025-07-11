'use client';

import { useUser } from '@clerk/nextjs';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export function SentryIdentifyUser() {
  const user = useUser();

  useEffect(() => {
    if (user.user) {
      Sentry.setUser({
        email: user.user.primaryEmailAddress?.emailAddress,
        id: user.user.id,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  return null;
}
