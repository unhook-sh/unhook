'use client';

import { useReportWebVitals } from 'next/web-vitals';
import posthog from 'posthog-js';

export function WebVitals() {
  useReportWebVitals((metric) => {
    const { name } = metric;
    posthog.capture(name, metric);
  });

  return <div />;
}
