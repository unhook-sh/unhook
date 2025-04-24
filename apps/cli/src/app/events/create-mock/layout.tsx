import type { RouteProps } from '~/stores/router-store';
import { CreateEventPage } from './page';

export function CreateMockEventLayout(props: RouteProps) {
  return <CreateEventPage {...props} />;
}
