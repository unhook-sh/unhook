import type { RouteProps } from '~/stores/router-store';
import { CreateEventPage } from './page';

export function CreateEventLayout(props: RouteProps) {
  return <CreateEventPage {...props} />;
}
