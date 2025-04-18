import type { FC } from 'react';
import type { AppRoutePath } from '~/app/routes';
import { type PathParams, useRouterStore } from '~/stores/router-store';

interface RedirectProps<T extends AppRoutePath> {
  to: T;
  params?: T extends `${string}:${string}` ? PathParams<T> : never;
}

export const Redirect: FC<RedirectProps<AppRoutePath>> = ({ to, params }) => {
  const navigate = useRouterStore.use.navigate();
  navigate(to, params as PathParams<typeof to>);
  return null;
};
