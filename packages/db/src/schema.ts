import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

import { createId } from '@acme/id';

export const userRoleEnum = pgEnum('userRole', ['admin', 'superAdmin', 'user']);
export const tunnelStatusEnum = pgEnum('tunnelStatus', ['active', 'inactive']);

export const UserRoleType = z.enum(userRoleEnum.enumValues).Enum;
export const TunnelStatusType = z.enum(tunnelStatusEnum.enumValues).Enum;

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
  orgMembers: many(OrgMembers, {
    relationName: 'user',
  }),
  tunnels: many(Tunnels, {
    relationName: 'user',
  }),
  connections: many(Connections, {
    relationName: 'user',
  }),
  requests: many(Requests, {
    relationName: 'user',
  }),
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
  // batch: varchar("batch", { length: 50 }),
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
export const OrgMembers = pgTable(
  'orgMembers',
  {
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
    userId: varchar('userId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull(),
  },
  (table) => ({
    orgUserUnique: unique().on(table.orgId, table.userId),
  }),
);

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
  user: one(Users, {
    fields: [OrgMembers.userId],
    references: [Users.id],
    relationName: 'user',
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
    allowedPaths?: string[]; // Only allow specific paths/patterns
    blockedPaths?: string[]; // Block specific paths/patterns
    maxRequestsPerMinute?: number; // Rate limiting
  };
};

export const Tunnels = pgTable('tunnels', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 't' }))
    .notNull()
    .primaryKey(),
  clientId: text('clientId').notNull(),
  apiKey: text('apiKey').notNull(),
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

export const Requests = pgTable('requests', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'wr' }))
    .notNull()
    .primaryKey(),
  tunnelId: varchar('tunnelId', { length: 128 })
    .references(() => Tunnels.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  apiKey: text('apiKey').notNull(),
  connectionId: varchar('connectionId', { length: 128 }).references(
    () => Connections.id,
    {
      onDelete: 'cascade',
    },
  ),
  request: json('request').notNull().$type<{
    id: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    size: number;
    body?: string;
    timestamp: number;
    contentType: string;
    clientIp: string;
  }>(),
  status: varchar('status', {
    enum: ['pending', 'completed', 'failed'],
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
  response: json('response').$type<{
    status: number;
    headers: Record<string, string>;
    body?: string;
  }>(),
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
}));

export const Connections = pgTable('connections', {
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

export type ConnectionType = typeof Connections.$inferSelect;

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
