import { seed } from 'drizzle-seed';

import { db } from './client';
import {
  Connections,
  OrgMembers,
  Orgs,
  Requests,
  Tunnels,
  Users,
} from './schema';

// Reset all tables

await db.delete(Users);
await db.delete(Orgs);
await db.delete(Tunnels);
await db.delete(Requests);
await db.delete(Connections);

await seed(db, {
  Orgs,
  OrgMembers,
  Users,
  Tunnels,
  Requests,
  Connections,
}).refine((funcs) => ({
  OrgMembers: {
    columns: {
      orgId: funcs.default({ defaultValue: 'org_2vCR1xwHHTLxE5m20AYewlc5y2j' }),
      userId: funcs.default({
        defaultValue: 'user_2vCQ1eiMB46gXpAUNeK8LvO7CwT',
      }),
    },
    count: 1,
  },
  Orgs: {
    columns: {
      id: funcs.default({ defaultValue: 'org_2vCR1xwHHTLxE5m20AYewlc5y2j' }),
    },
    count: 1,
  },
  Users: {
    columns: {
      clerkId: funcs.default({
        defaultValue: 'user_2vCQ1eiMB46gXpAUNeK8LvO7CwT',
      }),
      email: funcs.email(),
      firstName: funcs.firstName(),
      id: funcs.default({ defaultValue: 'user_2vCQ1eiMB46gXpAUNeK8LvO7CwT' }),
      lastName: funcs.lastName(),
      online: funcs.boolean(),
    },
    count: 1,
  },
  Tunnels: {
    columns: {
      apiKey: funcs.default({ defaultValue: 'pk_123' }),
      clientId: funcs.default({ defaultValue: 'cl_123' }),
      port: funcs.int({ maxValue: 65535, minValue: 1024 }),
      status: funcs.default({ defaultValue: 'active' }),
    },
    count: 1,
  },
}));

process.exit(0);
