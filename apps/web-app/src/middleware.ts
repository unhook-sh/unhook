import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define routes that require authentication
const isPrivateRoute = createRouteMatcher([
  // Dashboard and app routes
  '/app(.*)',
]);

// Define routes that should be handled by Next.js pages (not webhooks)
const isNextJsRoute = createRouteMatcher([
  // Marketing pages
  '/',
  '/blog(.*)',
  '/glossary(.*)',
  '/oss-friends(.*)',
  '/comparisons(.*)',
  '/vscode(.*)',
  '/mcp(.*)',
  '/jetbrains(.*)',
  '/privacy-policy(.*)',
  '/terms-of-service(.*)',
  // App routes
  '/app(.*)',
  // API routes
  '/api(.*)',
  // Static assets and Next.js internals
  '/_next(.*)',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  // Test route
  '/test',
]);

export default clerkMiddleware(async (auth, request) => {
  // Handle POST requests to any path that's not in the Next.js route allowlist
  if (request.method === 'POST') {
    const pathname = request.nextUrl.pathname;

    // Skip if it's a Next.js route
    if (isNextJsRoute(request)) {
      // Continue with normal Next.js handling
    } else {
      // This is a webhook route - extract org name and webhook name from the pathname
      // Expected format: /{orgName}/{webhookName}
      const pathParts = pathname.replace(/^\/+|\/+$/g, '').split('/');

      if (pathParts.length === 2) {
        const [orgName, webhookName] = pathParts;

        if (orgName && webhookName) {
          const url = new URL(
            `/api/webhook/${orgName}/${webhookName}`,
            request.url,
          );
          url.search = request.nextUrl.search;
          return NextResponse.rewrite(url);
        }
      }
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
