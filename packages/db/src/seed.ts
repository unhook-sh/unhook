import { seed } from 'drizzle-seed';
import { subDays } from 'date-fns';

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
await db.delete(OrgMembers);
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
      clerkOrgId: funcs.default({ defaultValue: 'org_2vCR1xwHHTLxE5m20AYewlc5y2j' }),
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
      orgId: funcs.default({ defaultValue: 'org_2vCR1xwHHTLxE5m20AYewlc5y2j' }),
      status: funcs.default({ defaultValue: 'active' }),
      requestCount: funcs.int({ maxValue: 1000, minValue: 0 }),
      clientCount: funcs.int({ maxValue: 1000, minValue: 0 }),
      config: funcs.default({
        defaultValue: {
          storage: {
            storeHeaders: true,
            storeRequestBody: true,
            storeResponseBody: true,
            maxRequestBodySize: 1048576,
            maxResponseBodySize: 1048576,
          },
          headers: {
            allowList: ['Authorization', 'Content-Type', 'Svix-Id', 'Svix-Timestamp', 'Svix-Signature'],
            blockList: ['Cookie', 'Set-Cookie'],
            sensitiveHeaders: ['Authorization'],
          },
          requests: {
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedPaths: ['/api/webhooks/.*'],
            blockedPaths: [],
            maxRequestsPerMinute: 100,
          },
        },
      }),
    },
    count: 1,
  },
  Requests: {
    columns: {
      orgId: funcs.default({ defaultValue: 'org_2vCR1xwHHTLxE5m20AYewlc5y2j' }),
      apiKey: funcs.default({ defaultValue: 'pk_123' }),
      status: funcs.valuesFromArray({
        values: ['pending', 'completed', 'failed'],
      }),
      request: funcs.default({
        defaultValue: {
          id: 'req_123',
          size: 100,
          url: '/api/webhooks/clerk',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          },
          body: '{"name": "John Doe"}',
          clientIp: '127.0.0.1',
          timestamp: Date.now(),
          contentType: 'application/json',

        },
      }),
      response: funcs.default({
        defaultValue: {
          status: 200,
          body: 'Hello, world!',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      }),
      createdAt: funcs.date({
        minDate: subDays(new Date(), 5),
        maxDate: new Date()
      }),
      responseTimeMs: funcs.int({ maxValue: 10000, minValue: 0 }),
    },
    count: 10,
  },
  Connections: {
    columns: {
      orgId: funcs.default({ defaultValue: 'org_2vCR1xwHHTLxE5m20AYewlc5y2j' }),
    },
    count: 1,
  },
}));

process.exit(0);
