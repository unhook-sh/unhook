import { Clerk } from '@clerk/clerk-js/headless';
import { debug } from '@unhook/logger';
import { env } from '~/env';
// import { useAuthStore } from '../../stores/auth-store';

const log = debug('unhook:cli:auth-clerk');
global.window = global.window || {};
// TODO: this needs to be cleared when the user signs out or maybe just when we finish the auth flow
let token: string | undefined;

const clerkFactory = (options: {
  publishableKey: string;
}) => {
  const { publishableKey } = options;
  let clerkInstance: Clerk;
  log('Initializing Clerk factory with publishable key: %s', publishableKey);

  return async () => {
    if (clerkInstance) {
      log('Returning existing Clerk instance');
      return clerkInstance;
    }

    log('Creating new Clerk instance');
    clerkInstance = new Clerk(publishableKey);
    clerkInstance.__unstable__onBeforeRequest(async (requestInit) => {
      log('Preparing Clerk request: %s', requestInit.url?.toString());
      requestInit.credentials = 'omit';
      requestInit.url?.searchParams.append('_is_native', '1');
      if (token) {
        log('Adding authorization token to request', token);
        (requestInit.headers as Headers).set('authorization', token);
      } else {
        log('No authorization token available');
      }
    });

    clerkInstance.__unstable__onAfterResponse(async (_, response) => {
      log('Processing Clerk response');
      const authHeader = response?.headers.get('authorization');
      if (authHeader) {
        log('Received new authorization token');
        // const currentState = useAuthStore.getState();
        // const token = await currentState.getToken();

        if (token !== authHeader) {
          log('Updating auth store with new token', authHeader);
          token = authHeader;
          // useAuthStore.setState({ token: authHeader });
          // throw new Error('TODO');
        } else {
          log('Token unchanged, skipping store update');
        }
      } else {
        log('No authorization token in response');
      }
    });

    log('Loading Clerk instance');
    await clerkInstance.load({ standardBrowser: false });
    log('Clerk instance loaded successfully');
    return clerkInstance;
  };
};

export const createClerkClient = clerkFactory({
  publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});
