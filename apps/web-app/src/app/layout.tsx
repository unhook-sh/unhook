import { ReactScan } from '@acme/ui/custom/react-scan';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { AnalyticsProviders } from '@acme/analytics';
import { ThemeProvider } from '@acme/ui/custom/theme';
import { cn } from '@acme/ui/lib/utils';
import { SidebarInset, SidebarProvider } from '@acme/ui/sidebar';
import { Toaster } from '@acme/ui/sonner';

import '@acme/ui/globals.css';

import { ClerkProvider } from '@clerk/nextjs';

import { TRPCReactProvider } from '@acme/api/client';
import { AppSidebar } from '~/components/app-sidebar';
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

export default async function RootLayout(props: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true';

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'bg-background text-foreground relative min-h-screen font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <ReactScan />
        <NuqsAdapter>
          <TRPCReactProvider>
            <ClerkProvider>
              <AnalyticsProviders identifyUser>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="dark"
                  enableSystem
                >
                  <SidebarProvider defaultOpen={defaultOpen}>
                    <AppSidebar />
                    <SidebarInset className="max-w-[calc(100vw-var(--sidebar-width))] peer-data-[collapsible=offcanvas]:peer-data-[state=collapsed]:max-w-[100vw] peer-data-[state=collapsed]:max-w-[calc(100vw-var(--sidebar-width-icon))]">
                      {props.children}
                    </SidebarInset>
                  </SidebarProvider>
                  <Toaster />
                </ThemeProvider>
              </AnalyticsProviders>
            </ClerkProvider>
          </TRPCReactProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
