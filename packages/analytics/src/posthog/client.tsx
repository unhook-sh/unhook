'use client';

import { useUser } from '@clerk/nextjs';
import posthog from 'posthog-js';
import { useEffect, useRef } from 'react';

export function PostHogIdentifyUser() {
  const user = useUser();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user.user) {
      // Only identify if the user ID has changed
      if (previousUserId.current !== user.user.id) {
        posthog.identify(user.user.id, {
          email: user.user.primaryEmailAddress?.emailAddress,
        });
        previousUserId.current = user.user.id;
      }
    } else if (previousUserId.current && !user.user) {
      // User was previously identified but is now undefined
      // Don't automatically track this as a sign out event
      // Only track when explicitly called via signOut()
      previousUserId.current = null;
    }
  }, [user]);

  return null;
}
