import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/api/webhooks/clerk',
  '/api/webhooks/stripe',
  '/api/trpc(.*)',
  '/blog(.*)',
  // Match webhook paths that start with /wh_ and end there
  '/wh_([^/]+)',
  '/',
  '/privacy-policy',
  '/terms-of-service',
]);

export default clerkMiddleware(async (auth, request) => {
  // Handle POST requests to root path with any webhook ID
  if (request.method === 'POST') {
    const match = request.nextUrl.pathname.match(/^\/wh_([^\/]+)$/);
    if (match) {
      const webhookId = match[1];
      const url = new URL(`/api/webhook/wh_${webhookId}`, request.url);
      url.search = request.nextUrl.search;
      return NextResponse.rewrite(url);
    }
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
