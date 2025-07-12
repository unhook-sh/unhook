import { subDays } from 'date-fns';
import { seed } from 'drizzle-seed';

import { db } from './client';
import {
  AuthCodes,
  Connections,
  Events,
  OrgMembers,
  Orgs,
  Requests,
  Users,
  WebhookAccessRequests,
  Webhooks,
} from './schema';

// Reset all tables

await db.delete(Users);
await db.delete(Orgs);
await db.delete(OrgMembers);
await db.delete(Webhooks);
await db.delete(Requests);
await db.delete(Connections);
await db.delete(Events);
await db.delete(AuthCodes);
await db.delete(WebhookAccessRequests);

await seed(db, {
  Connections,
  Events,
  OrgMembers,
  Orgs,
  Requests,
  Users,
  WebhookAccessRequests,
  Webhooks,
}).refine((funcs) => ({
  Connections: {
    columns: {
      orgId: funcs.default({ defaultValue: 'org_2vCR1xwHHTLxE5m20AYewlc5y2j' }),
    },
    count: 1,
  },
  Events: {
    columns: {
      originRequest: funcs.default({
        defaultValue: {
          body: Buffer.from(
            '{"type": "user.created", "data": {"id": "user_123"}}',
          ).toString('base64'),
          clientIp: '127.0.0.1',
          contentType: 'application/json',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          },
          id: 'req_123',
          method: 'POST',
          size: 100,
          sourceUrl: 'https://example.com/api/webhooks/clerk',
          timestamp: Date.now(),
        },
      }),
      source: funcs.valuesFromArray({
        values: ['stripe', 'clerk'],
      }),
    },
    count: 5,
  },
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
      clerkOrgId: funcs.default({
        defaultValue: 'org_2vCR1xwHHTLxE5m20AYewlc5y2j',
      }),
      id: funcs.default({ defaultValue: 'org_2vCR1xwHHTLxE5m20AYewlc5y2j' }),
    },
    count: 1,
  },
  Requests: {
    columns: {
      apiKey: funcs.default({ defaultValue: 'pk_123' }),
      createdAt: funcs.date({
        maxDate: new Date(),
        minDate: subDays(new Date(), 5),
      }),
      destination: funcs.default({
        defaultValue: [
          {
            name: 'clerk',
            url: 'http://localhost:3000/api/webhooks/clerk',
          },
        ],
      }),
      orgId: funcs.default({ defaultValue: 'org_2vCR1xwHHTLxE5m20AYewlc5y2j' }),
      request: funcs.default({
        defaultValue: {
          body: Buffer.from(
            '{"type": "user.created", "data": {"id": "user_123"}}',
          ).toString('base64'),
          clientIp: '127.0.0.1',
          contentType: 'application/json',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent':
              'Stripe/1.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          },
          id: 'req_123',
          method: 'POST',
          size: 100,
          sourceUrl: 'https://example.com/api/webhooks/clerk',
          timestamp: Date.now(),
        },
      }),
      response: funcs.default({
        defaultValue: {
          body: '{"message": "confirmed"}',
          headers: {
            'Content-Type': 'application/json',
          },
          status: 200,
        },
      }),
      responseTimeMs: funcs.int({ maxValue: 10000, minValue: 0 }),
      source: funcs.valuesFromArray({
        values: ['stripe', 'clerk', '*'],
      }),
      status: funcs.valuesFromArray({
        values: ['pending', 'completed', 'failed'],
      }),
    },
    count: 100,
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
  WebhookAccessRequests: {
    columns: {
      webhookId: funcs.default({ defaultValue: 'wh_internal' }),
    },
    count: 1,
  },
  Webhooks: {
    columns: {
      clientCount: funcs.int({ maxValue: 1000, minValue: 0 }),
      clientId: funcs.default({ defaultValue: 'cl_123' }),
      config: funcs.default({
        defaultValue: {
          headers: {},
          requests: {
            allowedFrom: ['.*'],
            allowedMethods: ['POST'],
            blockedFrom: [],
            maxRequestsPerMinute: 100,
          },
          storage: {
            maxRequestBodySize: 1048576,
            maxResponseBodySize: 1048576,
            storeHeaders: true,
            storeRequestBody: true,
            storeResponseBody: true,
          },
        },
      }),
      id: funcs.default({ defaultValue: 'wh_seawatts' }),
      orgId: funcs.default({ defaultValue: 'org_2vCR1xwHHTLxE5m20AYewlc5y2j' }),
      port: funcs.int({ maxValue: 65535, minValue: 1024 }),
      requestCount: funcs.int({ maxValue: 1000, minValue: 0 }),
      status: funcs.default({ defaultValue: 'active' }),
    },
    count: 1,
  },
}));

process.exit(0);
