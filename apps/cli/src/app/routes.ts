import { useAuth } from '~/lib/auth';
import type { Route } from '~/lib/router';
import { DebugPage } from './debug/page';
import { ExitPage } from './exit/page';
import { LoginPage } from './login/page';
import { LogoutPage } from './logout/page';
import { MenuPage } from './menu/page';
import { PortPage } from './port/page';
import { RequestPage } from './requests/[id]/page';
import { RequestsPage } from './requests/page';

export type AppRoutePath =
  | '/'
  | '/login'
  | '/logout'
  | '/exit'
  | '/settings'
  | '/requests'
  | '/requests/:id'
  | '/status'
  | '/metrics'
  | '/debug';

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
    label: 'Requests',
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
    path: '/debug',
    component: DebugPage,
    label: 'Debug Info',
    hotkey: 'd',
  },
  // {
  //   path: '/metrics',
  //   component: () => null, // TODO: Implement metrics page
  //   label: 'View Metrics',
  //   hotkey: 'm',
  // },
  {
    path: '/logout',
    component: LogoutPage,
    label: 'Logout',
    hotkey: 'l',
  },
];

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
    path: '/exit',
    component: ExitPage,
    label: 'Exit',
    hotkey: 'e',
  },
];

export function useRoutes() {
  const { isSignedIn } = useAuth();
  const routes = [
    ...(isSignedIn ? authenticatedRoutes : unauthenticatedRoutes),
    ...commonRoutes,
  ];

  return routes;
}
