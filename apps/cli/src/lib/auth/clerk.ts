import { Clerk } from '@clerk/clerk-js/headless';
import { authStore } from './store';

global.window = global.window || {};

const clerkFactory = (options: { publishableKey: string }) => {
  const { publishableKey } = options;
  let clerkInstance: Clerk;

  return async () => {
    const getToken = () => {
      const state = authStore.getState();
      return state.token;
    };

    if (clerkInstance) {
      return clerkInstance;
    }

    clerkInstance = new Clerk(publishableKey);
    clerkInstance.__unstable__onBeforeRequest(async (requestInit) => {
      requestInit.credentials = 'omit';
      requestInit.url?.searchParams.append('_is_native', '1');
      (requestInit.headers as Headers).set('authorization', getToken() || '');
    });

    clerkInstance.__unstable__onAfterResponse(async (_, response) => {
      const authHeader = response?.headers.get('authorization');
      if (authHeader) {
        authStore.setState({ token: authHeader });
      }
    });

    await clerkInstance.load({ standardBrowser: false });
    return clerkInstance;
  };
};

export const createClerkClient = clerkFactory({
  publishableKey: 'pk_test_Y2xldmVyLXN0YXJmaXNoLTc2LmNsZXJrLmFjY291bnRzLmRldiQ',
});
