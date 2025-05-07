import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';

import { createId } from '@unhook/id';

export const userRoleEnum = pgEnum('userRole', ['admin', 'superAdmin', 'user']);
export const tunnelStatusEnum = pgEnum('tunnelStatus', ['active', 'inactive']);
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
export const TunnelStatusType = z.enum(tunnelStatusEnum.enumValues).Enum;
export const LocalConnectionStatusType = z.enum(
  localConnectionStatusEnum.enumValues,
).Enum;
export const EventStatusType = z.enum(eventStatusEnum.enumValues).Enum;
export const RequestStatusType = z.enum(requestStatusEnum.enumValues).Enum;

export const Users = pgTable('user', {
  avatarUrl: text('avatarUrl'),
  clerkId: text('clerkId').unique(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  email: text('email').notNull().unique(),
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
  tunnels: many(Tunnels),
  connections: many(Connections),
  requests: many(Requests),
  events: many(Events),
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
  clerkOrgId: text('clerkOrgId'),
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
  tunnels: many(Tunnels),
  connections: many(Connections),
  requests: many(Requests),
}));

// Company Members Table
export const OrgMembers = pgTable('orgMembers', {
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
    .$defaultFn(() => createId({ prefix: 'member' }))
    .notNull()
    .primaryKey(),
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
});

export type OrgMembersType = typeof OrgMembers.$inferSelect & {
  user?: UserType;
  org?: OrgType;
};

export const OrgMembersRelations = relations(OrgMembers, ({ one }) => ({
  createdByUser: one(Users, {
    fields: [OrgMembers.createdByUserId],
    references: [Users.id],
    relationName: 'createdByUser',
  }),
  org: one(Orgs, {
    fields: [OrgMembers.orgId],
    references: [Orgs.id],
  }),
}));

// Add new type for tunnel config
export type TunnelConfig = {
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
    allowedFrom?: string[]; // Only allow specific paths/patterns
    blockedFrom?: string[]; // Block specific paths/patterns
    maxRequestsPerMinute?: number; // Rate limiting
    maxRetries?: number; // Maximum number of retries for failed requests
  };
};

export const Tunnels = pgTable('tunnels', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 't' }))
    .notNull()
    .primaryKey(),
  clientId: text('clientId').notNull(),
  port: integer('port').notNull(),
  lastConnectionAt: timestamp('lastConnectionAt', {
    mode: 'date',
    withTimezone: true,
  }),
  lastRequestAt: timestamp('lastRequestAt', {
    mode: 'date',
    withTimezone: true,
  }),
  requestCount: integer('requestCount').notNull().default(0),
  clientCount: integer('clientCount').notNull().default(0),
  localConnectionStatus: localConnectionStatusEnum('localConnectionStatus')
    .notNull()
    .default('disconnected'),
  localConnectionPid: integer('localConnectionPid'),
  localConnectionProcessName: text('localConnectionProcessName'),
  lastLocalConnectionAt: timestamp('lastLocalConnectionAt', {
    mode: 'date',
    withTimezone: true,
  }),
  lastLocalDisconnectionAt: timestamp('lastLocalDisconnectionAt', {
    mode: 'date',
    withTimezone: true,
  }),
  config: json('config')
    .$type<TunnelConfig>()
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
  status: tunnelStatusEnum('status').notNull().default('inactive'),
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
    .notNull(),
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull(),
});

export type TunnelType = typeof Tunnels.$inferSelect;

export const CreateTunnelTypeSchema = createInsertSchema(Tunnels, {
  clientId: z.string(),
  port: z.number(),
  status: z.enum(tunnelStatusEnum.enumValues).default('inactive'),
  localConnectionStatus: z
    .enum(localConnectionStatusEnum.enumValues)
    .default('disconnected'),
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
      allowedFrom: z.array(z.string()).optional(),
      blockedFrom: z.array(z.string()).optional(),
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

export const UpdateTunnelTypeSchema = createInsertSchema(Tunnels, {
  status: z.enum(tunnelStatusEnum.enumValues).default('inactive'),
  localConnectionStatus: z
    .enum(localConnectionStatusEnum.enumValues)
    .default('disconnected'),
  localConnectionPid: z.number().optional(),
  localConnectionProcessName: z.string().optional(),
  lastLocalConnectionAt: z.date().optional(),
  lastLocalDisconnectionAt: z.date().optional(),
  lastConnectionAt: z.date().optional(),
  lastRequestAt: z.date().optional(),
  requestCount: z.number().default(0),
}).omit({
  createdAt: true,
  updatedAt: true,
  userId: true,
  orgId: true,
});

export const TunnelsRelations = relations(Tunnels, ({ one, many }) => ({
  user: one(Users, {
    fields: [Tunnels.userId],
    references: [Users.id],
  }),
  org: one(Orgs, {
    fields: [Tunnels.orgId],
    references: [Orgs.id],
  }),
  requests: many(Requests),
  connections: many(Connections),
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
    tunnelId: varchar('tunnelId', { length: 128 })
      .references(() => Tunnels.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    // Original request payload that created this event
    originRequest: json('originRequest').$type<RequestPayload>().notNull(),
    from: text('from').notNull().default('*'),
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
      .notNull(),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
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
    index('events_tunnel_status_idx').on(table.tunnelId, table.status),
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
  from: z.string().default('*'),
  maxRetries: z.number().default(3),
  originRequest: RequestPayloadSchema,
  retryCount: z.number().default(0),
  status: z.enum(eventStatusEnum.enumValues).default('pending'),
  timestamp: z.date(),
  tunnelId: z.string(),
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
  tunnel: one(Tunnels, {
    fields: [Events.tunnelId],
    references: [Tunnels.id],
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
    tunnelId: varchar('tunnelId', { length: 128 })
      .references(() => Tunnels.id, {
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
    from: text('from').notNull().default('*'),
    to: json('to').notNull().$type<{
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
      .notNull(),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull(),
  },
  (table) => [
    // Foreign key indexes
    index('requests_tunnel_id_idx').on(table.tunnelId),
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
  from: z.string().default('*'),
  request: RequestPayloadSchema,
  response: ResponsePayloadSchema.optional(),
  responseTimeMs: z.number().default(0),
  status: z.enum(requestStatusEnum.enumValues).default('pending'),
  timestamp: z.date(),
  to: z.object({
    name: z.string(),
    url: z.string(),
  }),
  tunnelId: z.string(),
}).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  userId: true,
  orgId: true,
});

export const RequestsRelations = relations(Requests, ({ one }) => ({
  tunnel: one(Tunnels, {
    fields: [Requests.tunnelId],
    references: [Tunnels.id],
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
    tunnelId: varchar('tunnelId', { length: 128 })
      .references(() => Tunnels.id, {
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
      .notNull(),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
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

export const CreateConnectionTypeSchema = createInsertSchema(Connections, {
  tunnelId: z.string(),
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
  tunnelId: z.string(),
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
  tunnel: one(Tunnels, {
    fields: [Connections.tunnelId],
    references: [Tunnels.id],
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
    .notNull(),
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull(),
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
