import type { RouteProps } from '~/stores/router-store';
import { EventsPage } from './page';

export function EventsLayout(props: RouteProps) {
  return <EventsPage {...props} />;
}
