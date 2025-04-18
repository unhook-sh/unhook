import type { RouteProps } from '~/stores/router-store';
import { MenuPage } from './page';

export function MenuLayout(props: RouteProps) {
  return <MenuPage {...props} />;
}
