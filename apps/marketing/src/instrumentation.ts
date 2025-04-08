import * as Sentry from '@sentry/nextjs';

const config = {
  dsn: 'https://d950a870d91dc887fdcdf31411095f01@o4508560513171456.ingest.us.sentry.io/4509116181970944',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
};

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init(config);
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(config);
  }
}

export const onRequestError = Sentry.captureRequestError;
