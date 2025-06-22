import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import open from 'open';
import type { FC } from 'react';
import { createStore } from 'zustand';
import type { AppRoutePath } from '~/app/routes';
import { capture } from '../lib/posthog';

const log = debug('unhook:cli:router-store');

// Route configuration type
export interface RouteProps {
  params?: Record<string, string>;
}

// Type to extract dynamic parameters from a path
export type ExtractRouteParams<T> = T extends `:${infer Param}/${infer Rest}`
  ? Param | ExtractRouteParams<Rest>
  : T extends `:${infer Param}`
    ? Param
    : never;

// Type for static routes (no parameters)
export type StaticRoutePath<T extends string> = Exclude<
  T,
  `${string}:${string}`
>;

export type PathParams<T extends string> = {
  [K in ExtractRouteParams<T>]: string;
};

export interface Route<TPath extends string = AppRoutePath> {
  path: TPath;
  component: FC<RouteProps>;
  label: string;
  hotkey?: string;
  pattern?: RegExp;
  showInMenu?: boolean;
  url?: string;
}

// Router state and actions
interface RouterState {
  currentPath: AppRoutePath;
  history: AppRoutePath[];
  routes: Route[];
}

interface RouterActions {
  navigate: {
    <T extends AppRoutePath>(
      path: T extends `${string}:${string}` ? never : T,
      options?: { resetHistory?: boolean; replace?: boolean },
    ): void;
    <T extends AppRoutePath>(
      template: T,
      params?: PathParams<T>,
      options?: { resetHistory?: boolean; replace?: boolean },
    ): void;
  };
  goBack: () => void;
  setRoutes: (routes: Route[]) => void;
  canGoBack: () => boolean;
}

type RouterStore = RouterState & RouterActions;

const defaultRouterState: RouterState = {
  currentPath: '/',
  history: ['/'],
  routes: [],
};

function buildPath<T extends string>(
  template: T,
  params: PathParams<T>,
): string {
  return template.replace(/:([^/]+)/g, (_, key) => {
    const value = params[key as keyof typeof params];
    if (typeof value !== 'string') {
      throw new Error(`Missing or invalid parameter: ${key}`);
    }
    return value;
  });
}

// Create and export the store instance
const store = createStore<RouterStore>()((set, get) => ({
  ...defaultRouterState,
  navigate: (<T extends AppRoutePath>(
    pathOrTemplate: T,
    params?: PathParams<T>,
    options?: { resetHistory?: boolean; replace?: boolean },
  ) => {
    const path = params ? buildPath(pathOrTemplate, params) : pathOrTemplate;
    const { currentPath, history, routes } = get();

    // Don't add to history if navigating to the same path
    if (path === currentPath) {
      log('navigate: already on path', { path });
      return;
    }

    // Find the route and open URL if it exists
    const route = routes.find((r) => r.path === path);
    log('navigate', {
      fromPath: currentPath,
      toPath: path,
      history,
    });

    capture({
      event: 'navigation',
      properties: {
        fromPath: currentPath,
        toPath: path,
        historyLength: history.length,
      },
    });

    if (route?.url) {
      void open(route.url);
      return;
    }

    set((state) => ({
      currentPath: path as AppRoutePath,
      history: options?.resetHistory
        ? [currentPath]
        : options?.replace
          ? [...state.history.slice(0, -1), currentPath]
          : [...state.history, currentPath],
    }));
  }) as RouterActions['navigate'],
  goBack: () => {
    const { currentPath, history } = get();
    if (history.length === 0) return;

    capture({
      event: 'back_button_pressed',
      properties: {
        path: currentPath,
        historyLength: history.length,
        previousPath: history.at(-1),
      },
    });

    const previousPath = history.at(-1);
    if (!previousPath) return;

    set((state) => ({
      currentPath: previousPath,
      history: state.history.slice(0, -1),
    }));
  },
  setRoutes: (routes) => {
    set((state) => ({
      routes,
      currentPath:
        state.currentPath || routes[0]?.path || ('/' as AppRoutePath),
    }));
  },
  canGoBack: () => {
    return get().history.length > 0;
  },
}));

export const useRouterStore = createSelectors(store);

// Helper function to match dynamic routes
export function matchRoute(
  path: AppRoutePath,
  routes: Route[],
): { route: Route | undefined; params: Record<string, string> } {
  // First try exact match
  const exactRoute = routes.find((route) => route.path === path);
  if (exactRoute) {
    return { route: exactRoute, params: {} };
  }

  // Then try pattern matching for dynamic routes
  for (const route of routes) {
    if (route.pattern) {
      const match = path.match(route.pattern);
      if (match) {
        // Extract named capture groups as params
        const params: Record<string, string> = {};
        if (match.groups) {
          for (const [key, value] of Object.entries(match.groups)) {
            if (value) params[key] = value;
          }
        }
        return { route, params };
      }
    }
  }

  return { route: undefined, params: {} };
}
