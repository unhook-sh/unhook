import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { AnalyticsProviders } from '@acme/analytics/providers'
import { ThemeProvider } from '@acme/ui/custom/theme'
import { cn } from '@acme/ui/lib/utils'
import { SidebarProvider } from '@acme/ui/sidebar'
import { Toaster } from '@acme/ui/sonner'

import '@acme/ui/globals.css'

import { ClerkProvider } from '@clerk/nextjs'

import { TRPCReactProvider } from '@acme/api/client'

import { AppSidebar } from '~/components/app-sidebar'
import { env } from '~/env.server'

export const metadata: Metadata = {
  description: 'ShelterBuddy is a tool for shelters to manage their animals',
  metadataBase: new URL(
    env.VERCEL_ENV === 'production'
      ? 'https://shelterbuddy.vercel.app'
      : 'http://localhost:3000',
  ),
  openGraph: {
    description: 'ShelterBuddy is a tool for shelters to manage their animals',
    siteName: 'ShelterBuddy',
    title: 'ShelterBuddy',
    url: 'https://shelterbuddy.vercel.app',
  },
  title: 'ShelterBuddy',
  twitter: {
    card: 'summary_large_image',
    creator: '@seawatts',
    site: '@seawatts',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { color: 'white', media: '(prefers-color-scheme: light)' },
    { color: 'black', media: '(prefers-color-scheme: dark)' },
  ],
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true'

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'bg-background text-foreground relative min-h-screen font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
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
                    <main className="flex-1">{props.children}</main>
                  </SidebarProvider>
                  <Toaster />
                </ThemeProvider>
              </AnalyticsProviders>
            </ClerkProvider>
          </TRPCReactProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
