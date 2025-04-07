import { Text } from 'ink';
import type { FC, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

// Route configuration type
export interface RouteProps {
  params?: Record<string, string>;
}

export interface Route<TPath extends string = string> {
  path: TPath;
  component: FC<RouteProps>;
  label: string;
  hotkey?: string;
  pattern?: RegExp;
  showInMenu?: boolean;
}

// Router context and provider
interface RouterContextType<TPath extends string = string> {
  currentPath: TPath;
  navigate: (path: TPath) => void;
  goBack: () => void;
  canGoBack: boolean;
  routes: Route<TPath>[];
}

const RouterContext = createContext<RouterContextType<string> | undefined>(
  undefined,
);

interface RouterProviderProps<TPath extends string = string> {
  children: ReactNode;
  routes: Route<TPath>[];
  initialPath?: TPath;
  initialHistory?: TPath[];
}

export function RouterProvider<TPath extends string = string>({
  children,
  routes,
  initialPath,
  initialHistory,
}: RouterProviderProps<TPath>) {
  const [currentPath, setCurrentPath] = useState<TPath>(
    initialPath ?? routes[0]?.path ?? ('/' as TPath),
  );
  const [history, setHistory] = useState<TPath[]>(initialHistory ?? []);

  const navigate = (path: TPath) => {
    // Don't add to history if navigating to the same path
    if (path === currentPath) return;

    setHistory((prev) => [...prev, currentPath]);
    setCurrentPath(path);
  };

  const goBack = () => {
    if (history.length === 0) return;

    const previousPath = history.at(-1);
    if (!previousPath) return;

    setHistory((prev) => prev.slice(0, -1));
    setCurrentPath(previousPath);
  };

  const value: RouterContextType<TPath> = {
    currentPath,
    navigate,
    goBack,
    canGoBack: history.length > 0,
    routes,
  };

  return (
    <RouterContext.Provider
      value={value as unknown as RouterContextType<string>}
    >
      {children}
    </RouterContext.Provider>
  );
}

// Router hooks
export function useRouter<TPath extends string = string>() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within RouterProvider');
  }
  return context as unknown as RouterContextType<TPath>;
}

// Helper function to match dynamic routes
function matchRoute(
  path: string,
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

// Route rendering component
export const RouteRenderer: FC = () => {
  const { currentPath, routes } = useRouter();
  const { route: matchedRoute, params } = matchRoute(currentPath, routes);

  if (!matchedRoute?.component) {
    return <Text color="red">404: Page not found</Text>;
  }

  const CurrentComponent = matchedRoute.component;
  return <CurrentComponent params={params} />;
};
