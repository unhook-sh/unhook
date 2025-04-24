import * as clerk from './clerk';
import * as stripe from './stripe';

export const fixtures = [...clerk.fixtures, ...stripe.fixtures];
