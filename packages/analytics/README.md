# @unhook/analytics

Analytics package for Unhook with PostHog integration and Next.js components.

## Components

### MetricLink

A Link component that extends Next.js Link with automatic PostHog analytics tracking.

#### Usage

```tsx
import { MetricLink } from '@unhook/analytics/components';

// Basic usage
<MetricLink href="/dashboard" metric="navigation_dashboard_clicked">
  Go to Dashboard
</MetricLink>

// With custom properties
<MetricLink
  href="/settings"
  metric="navigation_settings_clicked"
  properties={{
    section: 'user_preferences',
    user_type: 'premium'
  }}
>
  Settings
</MetricLink>

// With styling
<MetricLink
  href="/profile"
  metric="navigation_profile_clicked"
  className="text-blue-600 hover:text-blue-800"
>
  Profile
</MetricLink>
```

#### Props

- `metric` (required): The metric name to track in PostHog
- `properties` (optional): Additional properties to include with the metric
- `children`: The content to render inside the link
- `className` (optional): CSS classes for styling
- All other props from Next.js Link are supported

#### How it works

When a user clicks on a MetricLink, it automatically calls `posthog.capture(metric, properties)` before navigating to the specified URL. This allows you to track user interactions without manually adding analytics code to your click handlers.

## PostHog Integration

The package includes PostHog client and server-side integrations for various environments:

- **Client**: `@unhook/analytics/posthog/client`
- **Server**: `@unhook/analytics/posthog/server`
- **Chrome Extension**: `@unhook/analytics/posthog/chrome-extension`
- **VS Code Extension**: `@unhook/analytics/posthog/vscode`

## Analytics Providers

Use the `AnalyticsProviders` component to wrap your app with analytics services:

```tsx
import { AnalyticsProviders } from '@unhook/analytics';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AnalyticsProviders identifyUser={true}>
          {children}
        </AnalyticsProviders>
      </body>
    </html>
  );
}
```

## Environment Variables

Make sure to set the following environment variables:

- `NEXT_PUBLIC_POSTHOG_KEY`: Your PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST`: Your PostHog instance host (optional, defaults to PostHog Cloud)
