import { useMemo } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { useCliStore } from '~/stores/cli-store';
import type { Route } from '~/stores/router-store';
import { useWebhookStore } from '~/stores/webhook-store';
import { DebugPage } from './debug/page';
import { EventRequestLayout } from './events/[id]/[requestId]/layout';
import { EventLayout } from './events/[id]/layout';
import { CreateMockEventLayout } from './events/create-mock/layout';
import { EventsLayout } from './events/layout';
import { HelpPage } from './help/page';
import { HotkeysPage } from './hotkeys/page';
import { InitLayout } from './init/layout';
import { LoginLayout } from './login/layout';
import { LogoutPage } from './logout/page';
import { MenuLayout } from './menu/layout';
import { NotFoundPage } from './not-found/page';
import { QuitPage } from './quit/page';
import { UnauthorizedPage } from './unauthorized/page';

export type AppRoutePath =
  | '/'
  | '/login'
  | '/logout'
  | '/unauthorized'
  | '/docs'
  | '/not-found'
  | '/report-issue'
  | '/quit'
  | '/settings'
  | '/events'
  | '/events/:id'
  | '/events/:id/:requestId'
  | '/events/create-mock'
  | '/status'
  | '/metrics'
  | '/debug'
  | '/hotkeys'
  | '/help'
  | '/init'
  | '/listen';

// Type for static routes (no parameters)
export type StaticAppRoutePath = Exclude<AppRoutePath, `${string}:${string}`>;

export type AppRoute = Route<AppRoutePath>;

export function useRoutes() {
  const isSignedIn = useAuthStore.use.isSignedIn();
  const isDebug = useCliStore.use.verbose?.();
  const isAuthorizedForWebhook = useWebhookStore.use.isAuthorizedForWebhook();
  const isCheckingWebhook = useWebhookStore.use.isCheckingWebhook();

  return useMemo(() => {
    const authenticatedRoutes: AppRoute[] = [
      {
        component: EventsLayout,
        hotkey: 'e',
        label: 'Events',
        path: '/events',
        showInMenu: isSignedIn && isAuthorizedForWebhook && !isCheckingWebhook,
      },
      {
        component: EventLayout,
        label: 'Event Details',
        path: '/events/:id',
        pattern: /^\/events\/(?<id>[^/]+)$/,
        showInMenu: isSignedIn && isAuthorizedForWebhook && !isCheckingWebhook,
      },
      {
        component: EventRequestLayout,
        label: 'Event Request Details',
        path: '/events/:id/:requestId',
        pattern: /^\/events\/(?<id>[^/]+)\/(?<requestId>[^/]+)$/,
        showInMenu: false,
      },
      {
        component: CreateMockEventLayout,
        hotkey: 'm',
        label: 'Mock Event',
        path: '/events/create-mock',
        showInMenu: false,
      },
      {
        component: LogoutPage,
        hotkey: 'l',
        label: 'Logout',
        path: '/logout',
      },
      {
        component: InitLayout,
        label: 'Listen for Changes',
        path: '/listen',
        showInMenu: false,
      },
    ];

    const debugRoute: AppRoute = {
      component: DebugPage,
      hotkey: 'd',
      label: 'Debug Info',
      path: '/debug',
    };

    const unauthenticatedRoutes: AppRoute[] = [
      {
        component: LoginLayout,
        hotkey: 'l',
        label: 'Login',
        path: '/login',
      },
    ];

    const commonRoutes: AppRoute[] = [
      {
        component: MenuLayout,
        label: 'Menu',
        path: '/',
        showInMenu: false,
      },
      {
        component: InitLayout,
        label: 'Initialize Project',
        path: '/init',
        showInMenu: false,
      },
      {
        component: HotkeysPage,
        hotkey: '?',
        label: 'Hotkeys',
        path: '/hotkeys',
        showInMenu: false,
      },
      {
        component: HelpPage,
        hotkey: 'h',
        label: 'Help',
        path: '/help',
        showInMenu: false,
      },
      {
        component: () => null,
        hotkey: 'i',
        label: 'Report Issue',
        path: '/report-issue',
        url: 'https://github.com/unhook-sh/unhook/issues/new?template=bug_report.yml',
      },
      {
        component: () => null,
        hotkey: 'd',
        label: 'Docs',
        path: '/docs',
        url: 'https://docs.unhook.sh',
      },
      {
        component: QuitPage,
        hotkey: 'q',
        label: 'Quit',
        path: '/quit',
      },
      {
        component: UnauthorizedPage,
        label: 'Unauthorized',
        path: '/unauthorized',
        showInMenu: false,
      },
      {
        component: NotFoundPage,
        label: 'Not Found',
        path: '/not-found',
        showInMenu: false,
      },
    ];

    return [
      ...(isSignedIn ? authenticatedRoutes : unauthenticatedRoutes),
      ...(isSignedIn && isDebug ? [debugRoute] : []),
      ...commonRoutes,
    ];
  }, [isSignedIn, isDebug, isAuthorizedForWebhook, isCheckingWebhook]);
}
