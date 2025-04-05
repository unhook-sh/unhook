import type { Route } from '~/lib/router';
import { MenuPage } from './menu/page';
import { PortPage } from './port/page';
import { RequestsPage } from './requests/page';

export type AppRoutePath =
  | '/'
  | '/settings'
  | '/requests'
  | '/status'
  | '/metrics';

export type AppRoute = Route<AppRoutePath>;

export const routes: AppRoute[] = [
  {
    path: '/',
    component: MenuPage,
    label: 'Menu',
  },
  {
    path: '/settings',
    component: PortPage,
    label: 'Settings',
    hotkey: 'p',
  },
  {
    path: '/requests',
    component: RequestsPage,
    label: 'Requests',
    hotkey: 'r',
  },
  {
    path: '/status',
    component: () => null, // TODO: Implement status page
    label: 'Connection',
    hotkey: 's',
  },
  {
    path: '/metrics',
    component: () => null, // TODO: Implement metrics page
    label: 'View Metrics',
    hotkey: 'm',
  },
];
