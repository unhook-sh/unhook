'use client';

import { useUser } from '@clerk/nextjs';
import posthog from 'posthog-js';
import { useEffect } from 'react';

export function PostHogIdentifyUser() {
  const user = useUser();

  useEffect(() => {
    if (user.user) {
      posthog.identify(user.user.id, {
        email: user.user.primaryEmailAddress?.emailAddress,
      });
    }
  }, [user]);
  return null;
}
