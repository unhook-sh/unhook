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
        path: '/events',
        component: EventsLayout,
        label: 'Events',
        hotkey: 'e',
        showInMenu: isSignedIn && isAuthorizedForWebhook && !isCheckingWebhook,
      },
      {
        path: '/events/:id',
        component: EventLayout,
        label: 'Event Details',
        pattern: /^\/events\/(?<id>[^/]+)$/,
        showInMenu: isSignedIn && isAuthorizedForWebhook && !isCheckingWebhook,
      },
      {
        path: '/events/:id/:requestId',
        component: EventRequestLayout,
        label: 'Event Request Details',
        showInMenu: false,
        pattern: /^\/events\/(?<id>[^/]+)\/(?<requestId>[^/]+)$/,
      },
      {
        path: '/events/create-mock',
        component: CreateMockEventLayout,
        label: 'Mock Event',
        hotkey: 'm',
        showInMenu: false,
      },
      {
        path: '/logout',
        component: LogoutPage,
        label: 'Logout',
        hotkey: 'l',
      },
      {
        path: '/listen',
        component: InitLayout,
        label: 'Listen for Changes',
        showInMenu: false,
      },
    ];

    const debugRoute: AppRoute = {
      path: '/debug',
      component: DebugPage,
      label: 'Debug Info',
      hotkey: 'd',
    };

    const unauthenticatedRoutes: AppRoute[] = [
      {
        path: '/login',
        component: LoginLayout,
        label: 'Login',
        hotkey: 'l',
      },
    ];

    const commonRoutes: AppRoute[] = [
      {
        path: '/',
        component: MenuLayout,
        label: 'Menu',
        showInMenu: false,
      },
      {
        path: '/init',
        component: InitLayout,
        label: 'Initialize Project',
        showInMenu: false,
      },
      {
        path: '/hotkeys',
        component: HotkeysPage,
        label: 'Hotkeys',
        showInMenu: false,
        hotkey: '?',
      },
      {
        path: '/help',
        component: HelpPage,
        label: 'Help',
        showInMenu: false,
        hotkey: 'h',
      },
      {
        path: '/report-issue',
        component: () => null,
        label: 'Report Issue',
        hotkey: 'i',
        url: 'https://github.com/unhook-sh/unhook/issues/new?template=bug_report.yml',
      },
      {
        path: '/docs',
        component: () => null,
        label: 'Docs',
        hotkey: 'd',
        url: 'https://docs.unhook.sh',
      },
      {
        path: '/quit',
        component: QuitPage,
        label: 'Quit',
        hotkey: 'q',
      },
      {
        path: '/unauthorized',
        component: UnauthorizedPage,
        label: 'Unauthorized',
        showInMenu: false,
      },
      {
        path: '/not-found',
        component: NotFoundPage,
        label: 'Not Found',
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
