import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';

import { PostHogProvider } from '@unhook/analytics/posthog/client';
import { ThemeProvider } from '@unhook/ui/custom/theme';
import { cn } from '@unhook/ui/lib/utils';
import { Toaster } from '@unhook/ui/sonner';

import '@unhook/ui/globals.css';

import { SiteBanner } from '~/components/site-banner';
import { SiteFooter } from '~/components/site-footer';
import { SiteHeader } from '~/components/site-header';

export const metadata: Metadata = {
  description: 'CoFounder AI',
  metadataBase: new URL('https://unhook.vercel.app'),
  openGraph: {
    description: 'CoFounder AI the founders fundraising platform',
    siteName: 'CoFounder AI',
    title: 'CoFounder AI',
    url: 'https://unhook.vercel.app',
  },
  title: 'CoFounder AI',
  twitter: {
    card: 'summary_large_image',
    creator: '@seawatts',
    site: '@seawatts',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { color: 'white', media: '(prefers-color-scheme: light)' },
    { color: 'black', media: '(prefers-color-scheme: dark)' },
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans text-foreground antialiased',
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <SiteBanner />
            <SiteHeader />
            {props.children}
            <SiteFooter />
            <Toaster />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
