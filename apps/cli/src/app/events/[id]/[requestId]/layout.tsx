import type { RouteProps } from '~/stores/router-store';
import { EventRequestPage } from './page';

export function EventRequestLayout(props: RouteProps) {
  return <EventRequestPage {...props} />;
}
