import type { RouteProps } from '~/stores/router-store';
import { InitPage } from './page';

export function InitLayout(props: RouteProps) {
  return <InitPage {...props} />;
}
