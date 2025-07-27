import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define routes that require authentication
const isPrivateRoute = createRouteMatcher([
  // Dashboard and app routes
  '/app(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Handle POST requests to root path with any webhook ID
  if (request.method === 'POST') {
    const match = request.nextUrl.pathname.match(/^\/wh_([^/]+)$/);
    if (match) {
      const webhookId = match[1];
      const url = new URL(`/api/webhook/wh_${webhookId}`, request.url);
      url.search = request.nextUrl.search;
      return NextResponse.rewrite(url);
    }
  }

  // Protect private routes - everything else is public by default
  if (isPrivateRoute(request)) {
    const authResponse = await auth.protect();
    if (
      authResponse.userId &&
      !authResponse.orgId &&
      !request.nextUrl.pathname.startsWith('/app/onboarding')
    ) {
      console.log('Redirecting to onboarding', {
        isOnboarding: request.nextUrl.pathname.startsWith('/app/onboarding'),
        orgId: authResponse.orgId,
        pathname: request.nextUrl.pathname,
        url: request.nextUrl,
        userId: authResponse.userId,
      });
      const url = request.nextUrl.clone();
      url.pathname = '/app/onboarding';
      const redirectTo = request.nextUrl.searchParams.get('redirectTo');
      const source = request.nextUrl.searchParams.get('source');

      if (redirectTo) {
        url.searchParams.set('redirectTo', redirectTo);
      }

      if (source) {
        url.searchParams.set('source', source);
      }

      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    '/app(.*)',
  ],
};
