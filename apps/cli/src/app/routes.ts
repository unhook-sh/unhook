import { useAuth } from '~/lib/auth';
import { useCliStore } from '~/lib/cli-store';
import type { Route } from '~/lib/router';
import { DebugPage } from './debug/page';
import { CreateEventPage } from './events/create/page';
import { EventsPage } from './events/page';
import { HelpPage } from './help/page';
import { HotkeysPage } from './hotkeys/page';
import { LoginPage } from './login/page';
import { LogoutPage } from './logout/page';
import { MenuPage } from './menu/page';
import { QuitPage } from './quit/page';
import { RequestPage } from './requests/[id]/page';
import { RequestsPage } from './requests/page';

export type AppRoutePath =
  | '/'
  | '/login'
  | '/logout'
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
    component: RequestsPage,
    label: 'Events',
    hotkey: 'r',
  },
  {
    path: '/requests/:id',
    component: RequestPage,
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
    component: EventsPage,
    label: 'Events',
    hotkey: 'e',
    showInMenu: false,
  },
  {
    path: '/events/create',
    component: CreateEventPage,
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
    component: LoginPage,
    label: 'Login',
    hotkey: 'l',
  },
];

const commonRoutes: AppRoute[] = [
  {
    path: '/',
    component: MenuPage,
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
