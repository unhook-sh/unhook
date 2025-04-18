import type { RouteProps } from '~/stores/router-store';
import { RequestPage } from './page';

export function RequestsLayout(props: RouteProps) {
  return <RequestPage {...props} />;
}
