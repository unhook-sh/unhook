import { useAuth } from '~/hooks/use-auth';
import { useCliStore } from '~/stores/cli-store';
import type { Route } from '~/stores/router-store';
import { DebugPage } from './debug/page';
import { CreateEventLayout } from './events/create/layout';
import { EventsLayout } from './events/layout';
import { HelpPage } from './help/page';
import { HotkeysPage } from './hotkeys/page';
import { LoginLayout } from './login/layout';
import { LogoutPage } from './logout/page';
import { MenuLayout } from './menu/layout';
import { NotFoundPage } from './not-found/page';
import { QuitPage } from './quit/page';
import { RequestsLayout } from './requests/layout';
import { UnauthorizedPage } from './unauthorized/page';

export type AppRoutePath =
  | '/'
  | '/login'
  | '/logout'
  | '/unauthorized'
  | '/not-found'
  | '/quit'
  | '/settings'
  | '/requests'
  | '/requests/:id'
  | '/status'
  | '/metrics'
  | '/debug'
  | '/hotkeys'
  | '/help'
  | '/events'
  | '/events/create'
  | '/events/:id';

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
    path: '/requests',
    component: RequestsLayout,
    label: 'Events',
    hotkey: 'r',
  },
  {
    path: '/requests/:id',
    component: RequestsLayout,
    label: 'Request Details',
    pattern: /^\/requests\/(?<id>[^/]+)$/,
    showInMenu: false,
  },
  // {
  //   path: '/status',
  //   component: () => null, // TODO: Implement status page
  //   label: 'Connection',
  //   hotkey: 's',
  // },
  {
    path: '/events',
    component: EventsLayout,
    label: 'Events',
    hotkey: 'e',
    showInMenu: false,
  },
  {
    path: '/events/create',
    component: CreateEventLayout,
    label: 'Create Event',
    hotkey: 'c',
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
  const { isSignedIn } = useAuth();
  const isDebug = useCliStore.use.debug();

  const routes = [
    ...(isSignedIn ? authenticatedRoutes : unauthenticatedRoutes),
    ...(isSignedIn && isDebug ? [debugRoute] : []),
    ...commonRoutes,
  ];

  return routes;
}
