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

export const UserRoleType = z.enum(userRoleEnum.enumValues).Enum;

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
  tunnelConnections: many(TunnelConnections, {
    relationName: 'user',
  }),
  webhookRequests: many(WebhookRequests, {
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
  tunnelConnections: many(TunnelConnections),
  webhookRequests: many(WebhookRequests),
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

export const Tunnels = pgTable('tunnels', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'tunnel' }))
    .notNull()
    .primaryKey(),
  clientId: text('clientId').notNull(),
  apiKey: text('apiKey').notNull(),
  port: integer('port').notNull(),
  lastSeenAt: timestamp('lastSeenAt', {
    mode: 'date',
    withTimezone: true,
  }).notNull(),
  status: text('status').notNull().default('disconnected'),
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
  webhookRequests: many(WebhookRequests),
  connections: many(TunnelConnections),
}));

export const WebhookRequests = pgTable('webhookRequests', {
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
  connectionId: varchar('connectionId', { length: 128 })
    .references(() => TunnelConnections.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  request: json('request').notNull().$type<{
    id: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    timestamp: number;
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

export const WebhookRequestsRelations = relations(
  WebhookRequests,
  ({ one }) => ({
    tunnel: one(Tunnels, {
      fields: [WebhookRequests.tunnelId],
      references: [Tunnels.id],
    }),
    user: one(Users, {
      fields: [WebhookRequests.userId],
      references: [Users.id],
    }),
    org: one(Orgs, {
      fields: [WebhookRequests.orgId],
      references: [Orgs.id],
    }),
    connection: one(TunnelConnections, {
      fields: [WebhookRequests.connectionId],
      references: [TunnelConnections.id],
    }),
  }),
);

export const TunnelConnections = pgTable('tunnelConnections', {
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'tc' }))
    .notNull()
    .primaryKey(),
  tunnelId: varchar('tunnelId', { length: 128 })
    .references(() => Tunnels.id, {
      onDelete: 'cascade',
    })
    .notNull(),
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

export type TunnelConnectionType = typeof TunnelConnections.$inferSelect;

export const TunnelConnectionsRelations = relations(
  TunnelConnections,
  ({ one, many }) => ({
    tunnel: one(Tunnels, {
      fields: [TunnelConnections.tunnelId],
      references: [Tunnels.id],
    }),
    user: one(Users, {
      fields: [TunnelConnections.userId],
      references: [Users.id],
    }),
    org: one(Orgs, {
      fields: [TunnelConnections.orgId],
      references: [Orgs.id],
    }),
    webhookRequests: many(WebhookRequests),
  }),
);
