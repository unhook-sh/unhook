import { createId } from '@unhook/id';
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';

export const userRoleEnum = pgEnum('userRole', ['admin', 'superAdmin', 'user']);
export const webhookStatusEnum = pgEnum('webhookStatus', [
  'active',
  'inactive',
]);
export const localConnectionStatusEnum = pgEnum('localConnectionStatus', [
  'connected',
  'disconnected',
]);
export const eventStatusEnum = pgEnum('eventStatus', [
  'pending',
  'processing',
  'completed',
  'failed',
]);
export const requestStatusEnum = pgEnum('requestStatus', [
  'pending',
  'completed',
  'failed',
]);
export const stripeSubscriptionStatusEnum = pgEnum('stripeSubscriptionStatus', [
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'paused',
  'trialing',
  'unpaid',
]);

export const apiKeyUsageTypeEnum = pgEnum('apiKeyUsageType', [
  'webhook-event',
  'mcp-server',
  'webhook-event-request',
]);

export const UserRoleType = z.enum(userRoleEnum.enumValues).Enum;
export const WebhookStatusType = z.enum(webhookStatusEnum.enumValues).Enum;
export const LocalConnectionStatusType = z.enum(
  localConnectionStatusEnum.enumValues,
).Enum;
export const EventStatusType = z.enum(eventStatusEnum.enumValues).Enum;
export const RequestStatusType = z.enum(requestStatusEnum.enumValues).Enum;
export const StripeSubscriptionStatusType = z.enum(
  stripeSubscriptionStatusEnum.enumValues,
).Enum;
export const ApiKeyUsageTypeType = z.enum(apiKeyUsageTypeEnum.enumValues).Enum;

export const Users = pgTable('user', {
  avatarUrl: text('avatarUrl'),
  clerkId: text('clerkId').unique().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  email: text('email').notNull(),
  firstName: text('firstName'),
  id: varchar('id', { length: 128 }).notNull().primaryKey(),
  lastLoggedInAt: timestamp('lastLoggedInAt', {
    mode: 'date',
    withTimezone: true,
  }),
  lastName: text('lastName'),
  online: boolean('online').default(false).notNull(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
});

export const UsersRelations = relations(Users, ({ many }) => ({
  apiKeys: many(ApiKeys),
  apiKeyUsage: many(ApiKeyUsage),
  authCodes: many(AuthCodes),
  connections: many(Connections),
  events: many(Events),
  forwardingDestinations: many(ForwardingDestinations),
  forwardingExecutions: many(ForwardingExecutions),
  forwardingRules: many(ForwardingRules),
  orgMembers: many(OrgMembers),
  requests: many(Requests),
  webhookAccessRequestsAsRequester: many(WebhookAccessRequests, {
    relationName: 'requester',
  }),
  webhookAccessRequestsAsResponder: many(WebhookAccessRequests, {
    relationName: 'responder',
  }),
  webhooks: many(Webhooks),
}));

export type UserType = typeof Users.$inferSelect;

export const CreateUserSchema = createInsertSchema(Users).omit({
  createdAt: true,
  id: true,
  updatedAt: true,
});

export const Orgs = pgTable('orgs', {
  clerkOrgId: text('clerkOrgId').unique().notNull(),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  }).defaultNow(),
  createdByUserId: varchar('createdByUserId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'org' }))
    .notNull()
    .primaryKey(),
  name: text('name').notNull(),
  // Stripe fields
  stripeCustomerId: text('stripeCustomerId'),
  stripeSubscriptionId: text('stripeSubscriptionId'),
  stripeSubscriptionStatus: stripeSubscriptionStatusEnum(
    'stripeSubscriptionStatus',
  ),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
});

export type OrgType = typeof Orgs.$inferSelect;

export const updateOrgSchema = createInsertSchema(Orgs).omit({
  createdAt: true,
  createdByUserId: true,
  id: true,
  updatedAt: true,
});

export const OrgsRelations = relations(Orgs, ({ one, many }) => ({
  apiKeys: many(ApiKeys),
  apiKeyUsage: many(ApiKeyUsage),
  authCodes: many(AuthCodes),
  connections: many(Connections),
  createdByUser: one(Users, {
    fields: [Orgs.createdByUserId],
    references: [Users.id],
  }),
  forwardingDestinations: many(ForwardingDestinations),
  forwardingExecutions: many(ForwardingExecutions),
  forwardingRules: many(ForwardingRules),
  orgMembers: many(OrgMembers),
  requests: many(Requests),
  webhookAccessRequests: many(WebhookAccessRequests),
  webhooks: many(Webhooks),
}));

// Company Members Table
export const OrgMembers = pgTable(
  'orgMembers',
  {
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    }).defaultNow(),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'member' }))
      .notNull()
      .primaryKey(),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'org_id'`),
    role: userRoleEnum('role').default('user').notNull(),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
    userId: varchar('userId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'sub'`),
  },
  (table) => [
    // Add unique constraint for userId and orgId combination using the simpler syntax
    unique().on(table.userId, table.orgId),
  ],
);

export type OrgMembersType = typeof OrgMembers.$inferSelect & {
  user?: UserType;
  org?: OrgType;
};

export const OrgMembersRelations = relations(OrgMembers, ({ one }) => ({
  org: one(Orgs, {
    fields: [OrgMembers.orgId],
    references: [Orgs.id],
  }),
  user: one(Users, {
    fields: [OrgMembers.userId],
    references: [Users.id],
  }),
}));

// Add new type for webhook config
export type WebhookConfig = {
  // Request/Response Storage Options
  storage: {
    storeHeaders: boolean;
    storeRequestBody: boolean;
    storeResponseBody: boolean;
    maxRequestBodySize: number; // in bytes
    maxResponseBodySize: number; // in bytes
  };
  // Header Filtering
  headers: {
    allowList?: string[]; // Only store these headers
    blockList?: string[]; // Never store these headers
    sensitiveHeaders?: string[]; // Replace these header values with "[REDACTED]"
  };
  // Request Filtering
  requests: {
    allowedMethods?: string[]; // Only allow specific HTTP methods
    allowedSource?: string[]; // Only allow specific paths/patterns
    blockedSource?: string[]; // Block specific paths/patterns
    maxRequestsPerMinute?: number; // Rate limiting
    maxRetries?: number; // Maximum number of retries for failed requests
  };
};

export const Webhooks = pgTable('webhooks', {
  apiKeyId: varchar('apiKeyId', { length: 128 })
    .references(() => ApiKeys.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  config: json('config')
    .$type<WebhookConfig>()
    .default({
      headers: {},
      requests: {},
      storage: {
        maxRequestBodySize: 1024 * 1024,
        maxResponseBodySize: 1024 * 1024,
        storeHeaders: true,
        storeRequestBody: true, // 1MB
        storeResponseBody: true, // 1MB
      },
    })
    .notNull(),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  }).defaultNow(),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'wh' }))
    .notNull()
    .primaryKey(),
  isPrivate: boolean('isPrivate').notNull().default(false),
  name: text('name').notNull(),
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(sql`auth.jwt()->>'org_id'`),
  requestCount: integer('requestCount').notNull().default(0),
  status: webhookStatusEnum('status').notNull().default('active'),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
  userId: varchar('userId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(sql`auth.jwt()->>'sub'`),
});

export type WebhookType = typeof Webhooks.$inferSelect;

export const CreateWebhookTypeSchema = createInsertSchema(Webhooks).omit({
  createdAt: true,
  orgId: true,
  updatedAt: true,
  userId: true,
});

export const UpdateWebhookTypeSchema = createInsertSchema(Webhooks).omit({
  createdAt: true,
  orgId: true,
  updatedAt: true,
  userId: true,
});

export const WebhooksRelations = relations(Webhooks, ({ one, many }) => ({
  accessRequests: many(WebhookAccessRequests),
  apiKey: one(ApiKeys, {
    fields: [Webhooks.apiKeyId],
    references: [ApiKeys.id],
  }),
  connections: many(Connections),
  events: many(Events),
  forwardingRules: many(ForwardingRules),
  orgId: one(Orgs, {
    fields: [Webhooks.orgId],
    references: [Orgs.id],
  }),
  requests: many(Requests),
  userId: one(Users, {
    fields: [Webhooks.userId],
    references: [Users.id],
  }),
}));

export const RequestPayloadSchema = z.object({
  body: z.string().optional(),
  clientIp: z.string(),
  contentType: z.string(),
  headers: z.record(z.string()),
  id: z.string(),
  method: z.string(),
  size: z.number(),
  sourceUrl: z.string(),
});

export type RequestPayload = z.infer<typeof RequestPayloadSchema>;

export const ResponsePayloadSchema = z.object({
  body: z.string().optional(),
  headers: z.record(z.string()),
  status: z.number(),
});

export type ResponsePayload = z.infer<typeof ResponsePayloadSchema>;

export const Events = pgTable(
  'events',
  {
    apiKeyId: varchar('apiKeyId', { length: 128 })
      .references(() => ApiKeys.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    // If failed, store the reason
    failedReason: text('failedReason'),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'evt' }))
      .notNull()
      .primaryKey(),
    // Maximum number of retries allowed
    maxRetries: integer('maxRetries').notNull().default(3),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'org_id'`),
    // Original request payload that created this event
    originRequest: json('originRequest').$type<RequestPayload>().notNull(),
    // Number of retry attempts made
    retryCount: integer('retryCount').notNull().default(0),
    source: text('source').notNull().default('*'),
    // Current status of the event
    status: eventStatusEnum('status').notNull().default('pending'),
    timestamp: timestamp('timestamp', {
      mode: 'date',
      withTimezone: true,
    }).notNull(),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
    userId: varchar('userId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'sub'`),
    webhookId: varchar('webhookId', { length: 128 })
      .references(() => Webhooks.id, {
        onDelete: 'cascade',
      })
      .notNull(),
  },
  (table) => [
    // Composite indexes for common access patterns
    index('events_org_status_timestamp_idx').on(
      table.orgId,
      table.status,
      table.timestamp,
    ),
    index('events_webhook_status_idx').on(table.webhookId, table.status),
    // Partial index for pending events that need processing
    index('events_pending_idx')
      .on(table.timestamp)
      .where(sql`${table.status} = 'pending'`),
  ],
);

export type EventType = typeof Events.$inferSelect;

export type EventTypeWithRequest = EventType & {
  requests: RequestType[];
};

export const CreateEventTypeSchema = createInsertSchema(Events).omit({
  createdAt: true,
  id: true,
  orgId: true,
  updatedAt: true,
  userId: true,
});

export const UpdateEventTypeSchema = createUpdateSchema(Events).omit({
  createdAt: true,
  orgId: true,
  updatedAt: true,
  userId: true,
});

export const EventsRelations = relations(Events, ({ one, many }) => ({
  apiKey: one(ApiKeys, {
    fields: [Events.apiKeyId],
    references: [ApiKeys.id],
  }),
  forwardingExecutions: many(ForwardingExecutions),
  org: one(Orgs, {
    fields: [Events.orgId],
    references: [Orgs.id],
  }),
  requests: many(Requests),
  user: one(Users, {
    fields: [Events.userId],
    references: [Users.id],
  }),
  webhook: one(Webhooks, {
    fields: [Events.webhookId],
    references: [Webhooks.id],
  }),
}));

export const Requests = pgTable(
  'requests',
  {
    apiKeyId: varchar('apiKeyId', { length: 128 })
      .references(() => ApiKeys.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    completedAt: timestamp('completedAt', {
      mode: 'date',
      withTimezone: true,
    }),
    connectionId: varchar('connectionId', { length: 128 }).references(
      () => Connections.id,
      {
        onDelete: 'cascade',
      },
    ),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    destination: json('destination').notNull().$type<{
      name: string;
      url: string;
    }>(),
    eventId: varchar('eventId', { length: 128 }).references(() => Events.id, {
      onDelete: 'cascade',
    }),
    failedReason: text('failedReason'),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'req' }))
      .notNull()
      .primaryKey(),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'org_id'`),
    request: json('request').notNull().$type<RequestPayload>(),
    response: json('response').$type<ResponsePayload>(),
    responseTimeMs: integer('responseTimeMs').notNull().default(0),
    source: text('source').notNull().default('*'),
    status: requestStatusEnum('status').notNull(),
    timestamp: timestamp('timestamp', {
      mode: 'date',
      withTimezone: true,
    }).notNull(),
    userId: varchar('userId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'sub'`),
    webhookId: varchar('webhookId', { length: 128 })
      .references(() => Webhooks.id, {
        onDelete: 'cascade',
      })
      .notNull(),
  },
  (table) => [
    // Foreign key indexes
    index('requests_webhook_id_idx').on(table.webhookId),
    index('requests_event_id_idx').on(table.eventId),
    // Composite indexes for common access patterns
    index('requests_org_status_timestamp_idx').on(
      table.orgId,
      table.status,
      table.timestamp,
    ),
    index('requests_connection_timestamp_idx').on(
      table.connectionId,
      table.timestamp,
    ),
    // Partial index for slow requests
    index('requests_slow_idx')
      .on(table.timestamp)
      .where(sql`${table.responseTimeMs} > 1000`),
    // Partial index for pending requests
    index('requests_pending_idx')
      .on(table.timestamp)
      .where(sql`${table.status} = 'pending'`),
  ],
);

export type RequestType = typeof Requests.$inferSelect;

export const CreateRequestTypeSchema = createInsertSchema(Requests).omit({
  completedAt: true,
  createdAt: true,
  id: true,
  orgId: true,
  userId: true,
});

export const RequestsRelations = relations(Requests, ({ one }) => ({
  apiKey: one(ApiKeys, {
    fields: [Requests.apiKeyId],
    references: [ApiKeys.id],
  }),
  connection: one(Connections, {
    fields: [Requests.connectionId],
    references: [Connections.id],
  }),
  event: one(Events, {
    fields: [Requests.eventId],
    references: [Events.id],
  }),
  org: one(Orgs, {
    fields: [Requests.orgId],
    references: [Orgs.id],
  }),
  user: one(Users, {
    fields: [Requests.userId],
    references: [Users.id],
  }),
  webhook: one(Webhooks, {
    fields: [Requests.webhookId],
    references: [Webhooks.id],
  }),
}));

export const Connections = pgTable(
  'connections',
  {
    clientHostname: text('clientHostname'),
    clientId: text('clientId').notNull(),
    clientOs: text('clientOs'),
    clientVersion: text('clientVersion'),
    connectedAt: timestamp('connectedAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    disconnectedAt: timestamp('disconnectedAt', {
      mode: 'date',
      withTimezone: true,
    }),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'c' }))
      .notNull()
      .primaryKey(),
    ipAddress: text('ipAddress').notNull(),
    lastPingAt: timestamp('lastPingAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'org_id'`),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
    userId: varchar('userId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'sub'`),
    webhookId: varchar('webhookId', { length: 128 })
      .references(() => Webhooks.id, {
        onDelete: 'cascade',
      })
      .notNull(),
  },
  (table) => [
    // Composite index for org-based queries
    index('connections_org_status_idx').on(
      table.orgId,
      table.disconnectedAt,
      table.lastPingAt,
    ),
    // Simple index for client version analysis
    index('connections_client_version_idx').on(table.clientVersion),
  ],
);

export type ConnectionType = typeof Connections.$inferSelect;

export const CreateConnectionTypeSchema = createInsertSchema(Connections).omit({
  createdAt: true,
  id: true,
  orgId: true,
  updatedAt: true,
  userId: true,
});

export const UpdateConnectionTypeSchema = createUpdateSchema(Connections).omit({
  createdAt: true,
  orgId: true,
  updatedAt: true,
  userId: true,
});

export const ConnectionsRelations = relations(Connections, ({ one, many }) => ({
  org: one(Orgs, {
    fields: [Connections.orgId],
    references: [Orgs.id],
  }),
  requests: many(Requests),
  user: one(Users, {
    fields: [Connections.userId],
    references: [Users.id],
  }),
  webhook: one(Webhooks, {
    fields: [Connections.webhookId],
    references: [Webhooks.id],
  }),
}));

// Webhook Access Request Status
export const webhookAccessRequestStatusEnum = pgEnum(
  'webhookAccessRequestStatus',
  ['pending', 'approved', 'rejected', 'expired'],
);

export const WebhookAccessRequestStatusType = z.enum(
  webhookAccessRequestStatusEnum.enumValues,
).Enum;

export const WebhookAccessRequests = pgTable(
  'webhookAccessRequests',
  {
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expiresAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .$defaultFn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'war' }))
      .notNull()
      .primaryKey(),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'org_id'`),
    requesterEmail: text('requesterEmail').notNull(),
    requesterId: varchar('requesterId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'sub'`),
    requesterMessage: text('requesterMessage'),
    respondedAt: timestamp('respondedAt', {
      mode: 'date',
      withTimezone: true,
    }),
    responderId: varchar('responderId').references(() => Users.id, {
      onDelete: 'set null',
    }),
    responseMessage: text('responseMessage'), // 7 days from now
    status: webhookAccessRequestStatusEnum('status')
      .notNull()
      .default('pending'),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
    webhookId: varchar('webhookId', { length: 128 })
      .references(() => Webhooks.id, {
        onDelete: 'cascade',
      })
      .notNull(),
  },
  (table) => [
    // Index for finding pending requests for a webhook
    index('webhook_access_requests_webhook_status_idx').on(
      table.webhookId,
      table.status,
    ),
    // Index for finding requests by requester
    index('webhook_access_requests_requester_idx').on(table.requesterId),
    // Index for finding pending requests that need to expire
    index('webhook_access_requests_pending_expires_idx')
      .on(table.expiresAt)
      .where(sql`${table.status} = 'pending'`),
  ],
);

export type WebhookAccessRequestType =
  typeof WebhookAccessRequests.$inferSelect;

export const CreateWebhookAccessRequestSchema = createInsertSchema(
  WebhookAccessRequests,
).omit({
  createdAt: true,
  expiresAt: true,
  id: true,
  orgId: true,
  requesterEmail: true,
  requesterId: true,
  respondedAt: true,
  responderId: true,
  responseMessage: true,
  status: true,
  updatedAt: true,
});

export const RespondToWebhookAccessRequestSchema = z.object({
  id: z.string(),
  responseMessage: z.string().optional(),
  status: z.enum(['approved', 'rejected']),
});

export const WebhookAccessRequestsRelations = relations(
  WebhookAccessRequests,
  ({ one }) => ({
    org: one(Orgs, {
      fields: [WebhookAccessRequests.orgId],
      references: [Orgs.id],
    }),
    requester: one(Users, {
      fields: [WebhookAccessRequests.requesterId],
      references: [Users.id],
      relationName: 'requester',
    }),
    responder: one(Users, {
      fields: [WebhookAccessRequests.responderId],
      references: [Users.id],
      relationName: 'responder',
    }),
    webhook: one(Webhooks, {
      fields: [WebhookAccessRequests.webhookId],
      references: [Webhooks.id],
    }),
  }),
);

export const AuthCodes = pgTable('authCodes', {
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp('expiresAt', {
    mode: 'date',
    withTimezone: true,
  })
    .$defaultFn(() => new Date(Date.now() + 1000 * 60 * 30)) // 30 minutes
    .notNull(),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'ac' }))
    .notNull()
    .primaryKey(),
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(sql`auth.jwt()->>'org_id'`),
  sessionId: text('sessionId').notNull(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
  usedAt: timestamp('usedAt', {
    mode: 'date',
    withTimezone: true,
  }),
  userId: varchar('userId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(sql`auth.jwt()->>'sub'`),
});

export type AuthCodeType = typeof AuthCodes.$inferSelect;

export const AuthCodesRelations = relations(AuthCodes, ({ one }) => ({
  org: one(Orgs, {
    fields: [AuthCodes.orgId],
    references: [Orgs.id],
  }),
  user: one(Users, {
    fields: [AuthCodes.userId],
    references: [Users.id],
  }),
}));

// API Keys Table
export const ApiKeys = pgTable('apiKeys', {
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp('expiresAt', {
    mode: 'date',
    withTimezone: true,
  }),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'ak' }))
    .notNull()
    .primaryKey(),
  isActive: boolean('isActive').notNull().default(true),
  key: text('key')
    .notNull()
    .unique()
    .$defaultFn(() => createId({ prefix: 'usk', prefixSeparator: '-live-' })),
  lastUsedAt: timestamp('lastUsedAt', {
    mode: 'date',
    withTimezone: true,
  }),
  name: text('name').notNull(),
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(sql`auth.jwt()->>'org_id'`),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
  userId: varchar('userId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(sql`auth.jwt()->>'sub'`),
});

export type ApiKeyType = typeof ApiKeys.$inferSelect;

export const CreateApiKeySchema = createInsertSchema(ApiKeys).omit({
  createdAt: true,
  id: true,
  lastUsedAt: true,
  orgId: true,
  updatedAt: true,
  userId: true,
});

export const UpdateApiKeySchema = createUpdateSchema(ApiKeys).omit({
  createdAt: true,
  id: true,
  orgId: true,
  updatedAt: true,
  userId: true,
});

export const ApiKeysRelations = relations(ApiKeys, ({ one, many }) => ({
  events: many(Events),
  org: one(Orgs, {
    fields: [ApiKeys.orgId],
    references: [Orgs.id],
  }),
  requests: many(Requests),
  usage: many(ApiKeyUsage),
  user: one(Users, {
    fields: [ApiKeys.userId],
    references: [Users.id],
  }),
  webhooks: many(Webhooks),
}));

// API Key Usage Table
export const ApiKeyUsage = pgTable('apiKeyUsage', {
  apiKeyId: varchar('apiKeyId', { length: 128 })
    .references(() => ApiKeys.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'aku' }))
    .notNull()
    .primaryKey(),
  // Generic metadata for different usage types
  metadata: json('metadata').$type<{
    webhookId?: string;
    requestId?: string;
    eventId?: string;
    // Add more fields as needed for different usage types
  }>(),
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(sql`auth.jwt()->>'org_id'`),
  type: apiKeyUsageTypeEnum('type').notNull(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
  userId: varchar('userId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(sql`auth.jwt()->>'sub'`),
});

export type ApiKeyUsageType = typeof ApiKeyUsage.$inferSelect;

export const CreateApiKeyUsageSchema = createInsertSchema(ApiKeyUsage).omit({
  createdAt: true,
  id: true,
  orgId: true,
  updatedAt: true,
  userId: true,
});

export const ApiKeyUsageRelations = relations(ApiKeyUsage, ({ one }) => ({
  apiKey: one(ApiKeys, {
    fields: [ApiKeyUsage.apiKeyId],
    references: [ApiKeys.id],
  }),
  org: one(Orgs, {
    fields: [ApiKeyUsage.orgId],
    references: [Orgs.id],
  }),
  user: one(Users, {
    fields: [ApiKeyUsage.userId],
    references: [Users.id],
  }),
}));

// Forwarding Destination Types
export const destinationTypeEnum = pgEnum('destinationType', [
  'slack',
  'discord',
  'teams',
  'webhook',
  'email',
]);

export const DestinationTypeType = z.enum(destinationTypeEnum.enumValues).Enum;

// Forwarding Destinations Table
export const ForwardingDestinations = pgTable('forwardingDestinations', {
  // Configuration for the destination (webhook URL, Slack webhook URL, etc.)
  config: json('config')
    .$type<{
      url?: string; // For webhook type
      slackWebhookUrl?: string; // For Slack
      slackChannel?: string; // Optional Slack channel override
      discordWebhookUrl?: string; // For Discord
      teamsWebhookUrl?: string; // For Teams
      email?: string; // For email
      // Additional provider-specific config
      headers?: Record<string, string>;
      authentication?: {
        type: 'bearer' | 'basic' | 'apiKey';
        token?: string;
        username?: string;
        password?: string;
        apiKey?: string;
        apiKeyHeader?: string;
      };
    }>()
    .notNull(),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  }).defaultNow(),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'dest' }))
    .notNull()
    .primaryKey(),
  isActive: boolean('isActive').notNull().default(true),
  name: text('name').notNull(),
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(sql`auth.jwt()->>'org_id'`),
  type: destinationTypeEnum('type').notNull(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
  userId: varchar('userId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(sql`auth.jwt()->>'sub'`),
});

export type ForwardingDestinationType =
  typeof ForwardingDestinations.$inferSelect;

export const ForwardingDestinationsRelations = relations(
  ForwardingDestinations,
  ({ one, many }) => ({
    forwardingRules: many(ForwardingRules),
    org: one(Orgs, {
      fields: [ForwardingDestinations.orgId],
      references: [Orgs.id],
    }),
    user: one(Users, {
      fields: [ForwardingDestinations.userId],
      references: [Users.id],
    }),
  }),
);

// Forwarding Rules Table
export const ForwardingRules = pgTable(
  'forwardingRules',
  {
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    }).defaultNow(),
    createdByUserId: varchar('createdByUserId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'sub'`),
    description: text('description'),
    destinationId: varchar('destinationId', { length: 128 })
      .references(() => ForwardingDestinations.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    errorCount: integer('errorCount').notNull().default(0),
    // Execution statistics
    executionCount: integer('executionCount').notNull().default(0),
    // Filter configuration
    filters: json('filters')
      .$type<{
        // Event name filters (e.g., "payment.succeeded", "user.created")
        eventNames?: string[];
        // HTTP method filters
        methods?: string[];
        // Path filters (regex patterns)
        pathPatterns?: string[];
        // Header filters
        headers?: Record<string, string | string[]>;
        // Custom JavaScript filter function (as string)
        customFilter?: string;
      }>()
      .notNull()
      .default({}),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'rule' }))
      .notNull()
      .primaryKey(),
    isActive: boolean('isActive').notNull().default(true),
    lastError: text('lastError'),
    lastErrorAt: timestamp('lastErrorAt', {
      mode: 'date',
      withTimezone: true,
    }),
    lastExecutedAt: timestamp('lastExecutedAt', {
      mode: 'date',
      withTimezone: true,
    }),
    name: text('name').notNull(),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'org_id'`),
    // Rule execution order (lower numbers execute first)
    priority: integer('priority').notNull().default(0),
    // JavaScript transformation function (as string)
    transformation: text('transformation'),
    // Transformation examples for testing
    transformationExamples: json('transformationExamples')
      .$type<
        Array<{
          input: unknown;
          expectedOutput: unknown;
          description?: string;
        }>
      >()
      .default([]),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
    userId: varchar('userId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'sub'`),
    webhookId: varchar('webhookId', { length: 128 })
      .references(() => Webhooks.id, {
        onDelete: 'cascade',
      })
      .notNull(),
  },
  (table) => [
    // Index for finding active rules for a webhook
    index('forwarding_rules_webhook_active_idx').on(
      table.webhookId,
      table.isActive,
    ),
    // Index for priority ordering
    index('forwarding_rules_priority_idx').on(table.priority),
  ],
);

export type ForwardingRuleType = typeof ForwardingRules.$inferSelect;

export const ForwardingRulesRelations = relations(
  ForwardingRules,
  ({ one, many }) => ({
    createdByUser: one(Users, {
      fields: [ForwardingRules.createdByUserId],
      references: [Users.id],
    }),
    destination: one(ForwardingDestinations, {
      fields: [ForwardingRules.destinationId],
      references: [ForwardingDestinations.id],
    }),
    executions: many(ForwardingExecutions),
    org: one(Orgs, {
      fields: [ForwardingRules.orgId],
      references: [Orgs.id],
    }),
    user: one(Users, {
      fields: [ForwardingRules.userId],
      references: [Users.id],
    }),
    webhook: one(Webhooks, {
      fields: [ForwardingRules.webhookId],
      references: [Webhooks.id],
    }),
  }),
);

// Forwarding Executions Log Table
export const ForwardingExecutions = pgTable(
  'forwardingExecutions',
  {
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    // Response from the destination
    destinationResponse: json('destinationResponse').$type<{
      status: number;
      headers: Record<string, string>;
      body: unknown;
    }>(),
    error: text('error'),
    eventId: varchar('eventId', { length: 128 })
      .references(() => Events.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    executionTimeMs: integer('executionTimeMs'),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'fexec' }))
      .notNull()
      .primaryKey(),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'org_id'`),
    // Original payload before transformation
    originalPayload: json('originalPayload').notNull(),
    ruleId: varchar('ruleId', { length: 128 })
      .references(() => ForwardingRules.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    success: boolean('success').notNull(),
    // Transformed payload after JavaScript execution
    transformedPayload: json('transformedPayload'),
    userId: varchar('userId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'sub'`),
  },
  (table) => [
    // Index for finding executions by rule
    index('forwarding_executions_rule_idx').on(table.ruleId),
    // Index for finding executions by event
    index('forwarding_executions_event_idx').on(table.eventId),
    // Index for finding recent executions
    index('forwarding_executions_created_idx').on(table.createdAt),
  ],
);

export type ForwardingExecutionType = typeof ForwardingExecutions.$inferSelect;

export const ForwardingExecutionsRelations = relations(
  ForwardingExecutions,
  ({ one }) => ({
    event: one(Events, {
      fields: [ForwardingExecutions.eventId],
      references: [Events.id],
    }),
    org: one(Orgs, {
      fields: [ForwardingExecutions.orgId],
      references: [Orgs.id],
    }),
    rule: one(ForwardingRules, {
      fields: [ForwardingExecutions.ruleId],
      references: [ForwardingRules.id],
    }),
    user: one(Users, {
      fields: [ForwardingExecutions.userId],
      references: [Users.id],
    }),
  }),
);

// Create schemas for validation
export const CreateForwardingDestinationSchema = createInsertSchema(
  ForwardingDestinations,
).omit({
  createdAt: true,
  id: true,
  orgId: true,
  updatedAt: true,
});

export const CreateForwardingRuleSchema = createInsertSchema(
  ForwardingRules,
).omit({
  createdAt: true,
  createdByUserId: true,
  errorCount: true,
  executionCount: true,
  id: true,
  lastError: true,
  lastErrorAt: true,
  lastExecutedAt: true,
  orgId: true,
  updatedAt: true,
});

export const UpdateForwardingRuleSchema = createUpdateSchema(
  ForwardingRules,
).omit({
  createdAt: true,
  createdByUserId: true,
  destinationId: true,
  errorCount: true,
  executionCount: true,
  id: true,
  lastError: true,
  lastErrorAt: true,
  lastExecutedAt: true,
  orgId: true,
  updatedAt: true,
  webhookId: true,
});
