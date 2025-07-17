import { ReactScan } from '@unhook/ui/custom/react-scan';
import { ThemeProvider } from '@unhook/ui/custom/theme';
import { cn } from '@unhook/ui/lib/utils';
import { Toaster } from '@unhook/ui/sonner';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import '@unhook/ui/globals.css';

import { ClerkProvider } from '@clerk/nextjs';
import { AnalyticsProviders } from '@unhook/analytics/providers';
import { TRPCReactProvider } from '@unhook/api/react';
import { Suspense } from 'react';
import { env } from '~/env.server';

export const metadata: Metadata = {
  description: 'Unhook is a tool for developers to manage their webhooks',
  metadataBase: new URL(
    env.VERCEL_ENV === 'production'
      ? 'https://unhook.sh'
      : 'http://localhost:3000',
  ),
  openGraph: {
    description: 'Unhook is a tool for developers to manage their webhooks',
    siteName: 'Unhook',
    title: 'Unhook',
    url: 'https://unhook.sh',
  },
  title: 'Unhook',
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

const isDevelopment = process.env.NODE_ENV === 'development';

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'bg-background text-foreground relative min-h-screen font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        {isDevelopment && <ReactScan />}
        <NuqsAdapter>
          <TRPCReactProvider>
            <Suspense>
              <ClerkProvider>
                <AnalyticsProviders identifyUser>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                  >
                    {props.children}
                    <Toaster />
                  </ThemeProvider>
                </AnalyticsProviders>
              </ClerkProvider>
            </Suspense>
          </TRPCReactProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
