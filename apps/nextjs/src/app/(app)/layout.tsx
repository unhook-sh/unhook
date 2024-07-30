import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { cn } from "@acme/ui";
import { ThemeProvider } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import "~/app/(app)/globals.css";

import { env } from "~/env";

export const metadata: Metadata = {
  description: "OnScript is an AI script-reading tool",
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://acme.vercel.app"
      : "http://localhost:3000",
  ),
  openGraph: {
    description: "OnScript is an AI script-reading tool",
    siteName: "OnScript",
    title: "OnScript",
    url: "https://acme.vercel.app",
  },
  title: "OnScript",
  twitter: {
    card: "summary_large_image",
    creator: "@seawatts",
    site: "@seawatts",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { color: "white", media: "(prefers-color-scheme: light)" },
    { color: "black", media: "(prefers-color-scheme: dark)" },
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "relative min-h-screen bg-background font-sans text-foreground antialiased",
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {props.children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
