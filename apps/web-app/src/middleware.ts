import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/api/webhooks(.*)',
  '/api/tunnel(.*)',
  '/api/trpc(.*)',
  // Match any path that contains t_ for tunnel-specific webhook endpoints
  '/(.*t_.*)/',
]);

export default clerkMiddleware(
  async (auth, request) => {
    // Handle POST requests to root path with any tunnel ID
    if (request.method === 'POST' && request.nextUrl.pathname === '/') {
      const match = request.nextUrl.pathname.match(/^\/([^\/]+)$/);
      if (match) {
        const tunnelId = match[1];
        const url = new URL(`/api/tunnel/${tunnelId}`, request.url);
        url.search = request.nextUrl.search;
        return NextResponse.rewrite(url);
      }
    }

    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  },
  {
    // debug: true,
  },
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
