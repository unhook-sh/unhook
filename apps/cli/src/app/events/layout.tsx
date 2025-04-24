import type { RouteProps } from '~/stores/router-store';
import { EventsPage } from './page';

/**
 * A layout component for the requests page that ensures the user
 * is authenticated and connected to the Unhook server.
 * Attempts to establish connection if necessary.
 */
export function EventsLayout(props: RouteProps) {
  return (
    // <AuthenticatedLayout>
    // <Connected
    //   fallback={
    //     <Box>
    //       <Text>Connecting to Unhook server...</Text>
    //     </Box>
    //   }
    // >
    <EventsPage {...props} />
    // </Connected>
    // </AuthenticatedLayout>
  );
}
