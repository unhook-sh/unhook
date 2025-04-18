import { Clerk } from '@clerk/clerk-js/headless';
import { env } from '~/env';
import { useAuthStore } from '../../stores/auth-store';

global.window = global.window || {};

const clerkFactory = (options: { publishableKey: string }) => {
  const { publishableKey } = options;
  let clerkInstance: Clerk;

  return async () => {
    const getToken = () => {
      const state = useAuthStore.getState();
      return state.token;
    };

    if (clerkInstance) {
      return clerkInstance;
    }

    clerkInstance = new Clerk(publishableKey);
    clerkInstance.__unstable__onBeforeRequest(async (requestInit) => {
      requestInit.credentials = 'omit';
      requestInit.url?.searchParams.append('_is_native', '1');
      const token = getToken();
      if (token) {
        (requestInit.headers as Headers).set('authorization', token);
      }
    });

    clerkInstance.__unstable__onAfterResponse(async (_, response) => {
      const authHeader = response?.headers.get('authorization');
      if (authHeader) {
        const currentState = useAuthStore.getState();
        if (currentState.token !== authHeader) {
          useAuthStore.setState({ token: authHeader });
        }
      }
    });

    await clerkInstance.load({ standardBrowser: false });
    return clerkInstance;
  };
};

export const createClerkClient = clerkFactory({
  publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});
