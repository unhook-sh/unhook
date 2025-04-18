import type { RouteProps } from '~/stores/router-store';
import { LoginPage } from './page';

export function LoginLayout(props: RouteProps) {
  return <LoginPage {...props} />;
}
