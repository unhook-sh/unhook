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

export const UserRoleType = z.enum(userRoleEnum.enumValues).Enum;
export const WebhookStatusType = z.enum(webhookStatusEnum.enumValues).Enum;
export const LocalConnectionStatusType = z.enum(
  localConnectionStatusEnum.enumValues,
).Enum;
export const EventStatusType = z.enum(eventStatusEnum.enumValues).Enum;
export const RequestStatusType = z.enum(requestStatusEnum.enumValues).Enum;

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
  orgMembers: many(OrgMembers),
  webhooks: many(Webhooks),
  connections: many(Connections),
  requests: many(Requests),
  events: many(Events),
  authCodes: many(AuthCodes),
}));

export type UserType = typeof Users.$inferSelect;

export const CreateUserSchema = createInsertSchema(Users, {
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  online: z.boolean(),
}).omit({
  createdAt: true,
  id: true,
  updatedAt: true,
});

export const Orgs = pgTable('orgs', {
  clerkOrgId: text('clerkOrgId').unique().notNull(),
  name: text('name').notNull(),
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
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
});

export type OrgType = typeof Orgs.$inferSelect;

export const updateOrgSchema = createInsertSchema(Orgs, {}).omit({
  createdAt: true,
  createdByUserId: true,
  id: true,
  updatedAt: true,
});

export const OrgsRelations = relations(Orgs, ({ one, many }) => ({
  createdByUser: one(Users, {
    fields: [Orgs.createdByUserId],
    references: [Users.id],
  }),
  orgMembers: many(OrgMembers),
  webhooks: many(Webhooks),
  connections: many(Connections),
  requests: many(Requests),
  authCodes: many(AuthCodes),
}));

// Company Members Table
export const OrgMembers = pgTable(
  'orgMembers',
  {
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    }).defaultNow(),
    userId: varchar('userId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'sub'`),
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
  user: one(Users, {
    fields: [OrgMembers.userId],
    references: [Users.id],
  }),
  org: one(Orgs, {
    fields: [OrgMembers.orgId],
    references: [Orgs.id],
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
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'wh' }))
    .notNull()
    .primaryKey(),
  name: text('name').notNull(),
  requestCount: integer('requestCount').notNull().default(0),
  config: json('config')
    .$type<WebhookConfig>()
    .default({
      storage: {
        storeHeaders: true,
        storeRequestBody: true,
        storeResponseBody: true,
        maxRequestBodySize: 1024 * 1024, // 1MB
        maxResponseBodySize: 1024 * 1024, // 1MB
      },
      headers: {},
      requests: {},
    })
    .notNull(),
  status: webhookStatusEnum('status').notNull().default('active'),
  isPrivate: boolean('isPrivate').notNull().default(false),
  apiKey: text('apiKey')
    .$defaultFn(() => createId({ prefix: 'whsk' }))
    .notNull()
    .unique(),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  }).defaultNow(),
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
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(sql`auth.jwt()->>'org_id'`),
});

export type WebhookType = typeof Webhooks.$inferSelect;

export const CreateWebhookTypeSchema = createInsertSchema(Webhooks, {
  name: z.string(),
  isPrivate: z.boolean().default(false).optional(),
  status: z.enum(webhookStatusEnum.enumValues).default('active'),
  config: z.object({
    storage: z.object({
      storeHeaders: z.boolean(),
      storeRequestBody: z.boolean(),
      storeResponseBody: z.boolean(),
      maxRequestBodySize: z.number(),
      maxResponseBodySize: z.number(),
    }),
    headers: z.object({
      allowList: z.array(z.string()).optional(),
      blockList: z.array(z.string()).optional(),
      sensitiveHeaders: z.array(z.string()).optional(),
    }),
    requests: z.object({
      allowedMethods: z.array(z.string()).optional(),
      allowedSource: z.array(z.string()).optional(),
      blockedSource: z.array(z.string()).optional(),
      maxRequestsPerMinute: z.number().optional(),
      maxRetries: z.number().optional(),
    }),
  }),
}).omit({
  createdAt: true,
  updatedAt: true,
  userId: true,
  orgId: true,
});

export const UpdateWebhookTypeSchema = createInsertSchema(Webhooks, {
  name: z.string().optional(),
  status: z.enum(webhookStatusEnum.enumValues).default('inactive'),
  isPrivate: z.boolean().default(false),
  requestCount: z.number().default(0),
}).omit({
  createdAt: true,
  updatedAt: true,
  userId: true,
  orgId: true,
});

export const WebhooksRelations = relations(Webhooks, ({ one, many }) => ({
  user: one(Users, {
    fields: [Webhooks.userId],
    references: [Users.id],
  }),
  org: one(Orgs, {
    fields: [Webhooks.orgId],
    references: [Orgs.id],
  }),
  requests: many(Requests),
  connections: many(Connections),
  events: many(Events),
}));

export const RequestPayloadSchema = z.object({
  id: z.string(),
  method: z.string(),
  sourceUrl: z.string(),
  headers: z.record(z.string()),
  size: z.number(),
  body: z.string().optional(),
  contentType: z.string(),
  clientIp: z.string(),
});

export type RequestPayload = z.infer<typeof RequestPayloadSchema>;

export const ResponsePayloadSchema = z.object({
  status: z.number(),
  headers: z.record(z.string()),
  body: z.string().optional(),
});

export type ResponsePayload = z.infer<typeof ResponsePayloadSchema>;

export const Events = pgTable(
  'events',
  {
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'evt' }))
      .notNull()
      .primaryKey(),
    webhookId: varchar('webhookId', { length: 128 })
      .references(() => Webhooks.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    // Original request payload that created this event
    originRequest: json('originRequest').$type<RequestPayload>().notNull(),
    source: text('source').notNull().default('*'),
    // Number of retry attempts made
    retryCount: integer('retryCount').notNull().default(0),
    // Maximum number of retries allowed
    maxRetries: integer('maxRetries').notNull().default(3),
    // Current status of the event
    status: eventStatusEnum('status').notNull().default('pending'),
    apiKey: text('apiKey'),
    // If failed, store the reason
    failedReason: text('failedReason'),
    timestamp: timestamp('timestamp', {
      mode: 'date',
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
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
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'org_id'`),
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

export const CreateEventTypeSchema = createInsertSchema(Events, {
  apiKey: z.string().optional(),
  failedReason: z.string().optional(),
  source: z.string().default('*'),
  maxRetries: z.number().default(3),
  originRequest: RequestPayloadSchema,
  retryCount: z.number().default(0),
  status: z.enum(eventStatusEnum.enumValues).default('pending'),
  timestamp: z.date(),
  webhookId: z.string(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  orgId: true,
});

export const UpdateEventTypeSchema = createUpdateSchema(Events, {
  status: z.enum(eventStatusEnum.enumValues).default('pending'),
  retryCount: z.number().default(0),
  failedReason: z.string().optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
  userId: true,
  orgId: true,
});

export const EventsRelations = relations(Events, ({ one, many }) => ({
  webhook: one(Webhooks, {
    fields: [Events.webhookId],
    references: [Webhooks.id],
  }),
  user: one(Users, {
    fields: [Events.userId],
    references: [Users.id],
  }),
  org: one(Orgs, {
    fields: [Events.orgId],
    references: [Orgs.id],
  }),
  requests: many(Requests),
}));

export const Requests = pgTable(
  'requests',
  {
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'req' }))
      .notNull()
      .primaryKey(),
    webhookId: varchar('webhookId', { length: 128 })
      .references(() => Webhooks.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    eventId: varchar('eventId', { length: 128 }).references(() => Events.id, {
      onDelete: 'cascade',
    }),
    apiKey: text('apiKey'),
    connectionId: varchar('connectionId', { length: 128 }).references(
      () => Connections.id,
      {
        onDelete: 'cascade',
      },
    ),
    request: json('request').notNull().$type<RequestPayload>(),
    source: text('source').notNull().default('*'),
    destination: json('destination').notNull().$type<{
      name: string;
      url: string;
    }>(),
    status: requestStatusEnum('status').notNull(),
    failedReason: text('failedReason'),
    timestamp: timestamp('timestamp', {
      mode: 'date',
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completedAt', {
      mode: 'date',
      withTimezone: true,
    }),
    response: json('response').$type<ResponsePayload>(),
    responseTimeMs: integer('responseTimeMs').notNull().default(0),
    userId: varchar('userId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'sub'`),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'org_id'`),
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

export const CreateRequestTypeSchema = createInsertSchema(Requests, {
  apiKey: z.string().optional(),
  connectionId: z.string().optional(),
  eventId: z.string().optional(),
  failedReason: z.string().optional(),
  source: z.string().default('*'),
  request: RequestPayloadSchema,
  response: ResponsePayloadSchema.optional(),
  responseTimeMs: z.number().default(0),
  status: z.enum(requestStatusEnum.enumValues).default('pending'),
  timestamp: z.date(),
  destination: z.object({
    name: z.string(),
    url: z.string(),
  }),
  webhookId: z.string(),
}).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  userId: true,
  orgId: true,
});

export const RequestsRelations = relations(Requests, ({ one }) => ({
  webhook: one(Webhooks, {
    fields: [Requests.webhookId],
    references: [Webhooks.id],
  }),
  user: one(Users, {
    fields: [Requests.userId],
    references: [Users.id],
  }),
  org: one(Orgs, {
    fields: [Requests.orgId],
    references: [Orgs.id],
  }),
  connection: one(Connections, {
    fields: [Requests.connectionId],
    references: [Connections.id],
  }),
  event: one(Events, {
    fields: [Requests.eventId],
    references: [Events.id],
  }),
}));

export const Connections = pgTable(
  'connections',
  {
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'c' }))
      .notNull()
      .primaryKey(),
    webhookId: varchar('webhookId', { length: 128 })
      .references(() => Webhooks.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    ipAddress: text('ipAddress').notNull(),
    clientId: text('clientId').notNull(),
    clientVersion: text('clientVersion'),
    clientOs: text('clientOs'),
    clientHostname: text('clientHostname'),
    connectedAt: timestamp('connectedAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    disconnectedAt: timestamp('disconnectedAt', {
      mode: 'date',
      withTimezone: true,
    }),
    lastPingAt: timestamp('lastPingAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    userId: varchar('userId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'sub'`),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(sql`auth.jwt()->>'org_id'`),
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

export const CreateConnectionTypeSchema = createInsertSchema(Connections, {
  webhookId: z.string(),
  ipAddress: z.string(),
  clientId: z.string(),
  clientVersion: z.string().optional(),
  clientOs: z.string().optional(),
  clientHostname: z.string().optional(),
  connectedAt: z.date(),
  disconnectedAt: z.date().optional(),
  lastPingAt: z.date(),
  userId: z.string(),
  orgId: z.string(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  orgId: true,
});

export const UpdateConnectionTypeSchema = createUpdateSchema(Connections, {
  webhookId: z.string(),
  ipAddress: z.string(),
  clientId: z.string(),
  clientVersion: z.string().optional(),
  clientOs: z.string().optional(),
  clientHostname: z.string().optional(),
  connectedAt: z.date(),
  disconnectedAt: z.date().optional(),
  lastPingAt: z.date(),
  userId: z.string(),
  orgId: z.string(),
}).omit({
  createdAt: true,
  updatedAt: true,
  userId: true,
  orgId: true,
});

export const ConnectionsRelations = relations(Connections, ({ one, many }) => ({
  webhook: one(Webhooks, {
    fields: [Connections.webhookId],
    references: [Webhooks.id],
  }),
  user: one(Users, {
    fields: [Connections.userId],
    references: [Users.id],
  }),
  org: one(Orgs, {
    fields: [Connections.orgId],
    references: [Orgs.id],
  }),
  requests: many(Requests),
}));

export const AuthCodes = pgTable('authCodes', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'ac' }))
    .notNull()
    .primaryKey(),
  expiresAt: timestamp('expiresAt', {
    mode: 'date',
    withTimezone: true,
  })
    .$defaultFn(() => new Date(Date.now() + 1000 * 60 * 30)) // 30 minutes
    .notNull(),
  sessionId: text('sessionId').notNull(),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
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
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(sql`auth.jwt()->>'org_id'`),
});

export type AuthCodeType = typeof AuthCodes.$inferSelect;

export const AuthCodesRelations = relations(AuthCodes, ({ one }) => ({
  user: one(Users, {
    fields: [AuthCodes.userId],
    references: [Users.id],
  }),
  org: one(Orgs, {
    fields: [AuthCodes.orgId],
    references: [Orgs.id],
  }),
}));
