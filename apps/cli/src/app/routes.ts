import { useEffect, useState } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { useCliStore } from '~/stores/cli-store';
import type { Route } from '~/stores/router-store';
import { DebugPage } from './debug/page';
import { EventRequestLayout } from './events/[id]/[requestId]/layout';
import { EventLayout } from './events/[id]/layout';
import { CreateMockEventLayout } from './events/create-mock/layout';
import { EventsLayout } from './events/layout';
import { HelpPage } from './help/page';
import { HotkeysPage } from './hotkeys/page';
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
  | '/not-found'
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
  | '/help';

// Type for static routes (no parameters)
export type StaticAppRoutePath = Exclude<AppRoutePath, `${string}:${string}`>;

export type AppRoute = Route<AppRoutePath>;

const authenticatedRoutes: AppRoute[] = [
  // {
  //   path: '/settings',
  //   component: PortPage,
  //   label: 'Settings',
  //   hotkey: 'p',
  // },
  {
    path: '/events',
    component: EventsLayout,
    label: 'Events',
    hotkey: 'e',
  },
  {
    path: '/events/:id',
    component: EventLayout,
    label: 'Event Details',
    // TODO: Add pattern for event id
    pattern: /^\/events\/(?<id>[^/]+)$/,
    showInMenu: false,
  },
  {
    path: '/events/:id/:requestId',
    component: EventRequestLayout,
    label: 'Event Request Details',
    showInMenu: false,
    pattern: /^\/events\/(?<id>[^/]+)\/(?<requestId>[^/]+)$/,
  },
  // {
  //   path: '/status',
  //   component: () => null, // TODO: Implement status page
  //   label: 'Connection',
  //   hotkey: 's',
  // },
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

export function useRoutes() {
  const isSignedIn = useAuthStore.use.isSignedIn();
  const isDebug = useCliStore.use.debug?.();
  const [routes, setRoutes] = useState<AppRoute[]>([]);

  useEffect(() => {
    setRoutes([
      ...(isSignedIn ? authenticatedRoutes : unauthenticatedRoutes),
      ...(isSignedIn && isDebug ? [debugRoute] : []),
      ...commonRoutes,
    ]);
  }, [isSignedIn, isDebug]);

  return routes;
}
