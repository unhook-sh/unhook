'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { event } from 'nextjs-google-analytics';

export function WebVitals() {
  useReportWebVitals(({ name, label, id, value }) => {
    event(name, {
      category: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
      // values must be integers
      label: id,
      // id unique to current page load
      nonInteraction: true,
      value: Math.round(name === 'CLS' ? value * 1000 : value), // avoids affecting bounce rate.
    });
  });

  return <div />;
}
