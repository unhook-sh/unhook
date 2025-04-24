import type { RouteProps } from '~/stores/router-store';
import { EventPage } from './page';

export function EventLayout(props: RouteProps) {
  return <EventPage {...props} />;
}
