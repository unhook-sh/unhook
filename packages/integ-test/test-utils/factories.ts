import { faker } from '@faker-js/faker';
import * as schema from '@unhook/db/schema';
import { createId } from '@unhook/id';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export class TestFactories {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async createUser(
    overrides?: Partial<schema.UserType>,
  ): Promise<schema.UserType> {
    const user = {
      avatarUrl: faker.image.avatar(),
      clerkId: `clerk_${faker.string.alphanumeric(20)}`,
      createdAt: new Date(),
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      id: createId({ prefix: 'user' }),
      lastName: faker.person.lastName(),
      online: false,
      ...overrides,
    };

    const [created] = await this.db
      .insert(schema.Users)
      .values(user)
      .returning();
    if (!created) {
      throw new Error('Failed to create user');
    }
    return created;
  }

  async createOrg(
    overrides?: Partial<schema.OrgType>,
  ): Promise<schema.OrgType> {
    const user = await this.createUser();

    const org = {
      clerkOrgId: `org_${faker.string.alphanumeric(20)}`,
      createdAt: new Date(),
      createdByUserId: user.id,
      id: createId({ prefix: 'org' }),
      name: faker.company.name(),
      stripeCustomerId: faker.string.alphanumeric(20),
      stripeSubscriptionId: faker.string.alphanumeric(20),
      stripeSubscriptionStatus: 'active' as const,
      ...overrides,
    };

    const [created] = await this.db.insert(schema.Orgs).values(org).returning();
    if (!created) {
      throw new Error('Failed to create org');
    }
    return created;
  }

  async createOrgMember(
    userId: string,
    orgId: string,
    role: 'user' | 'admin' | 'superAdmin' = 'user',
  ): Promise<schema.OrgMembersType> {
    const member = {
      createdAt: new Date(),
      id: createId({ prefix: 'member' }),
      orgId,
      role,
      userId,
    };

    const [created] = await this.db
      .insert(schema.OrgMembers)
      .values(member)
      .returning();
    if (!created) {
      throw new Error('Failed to create org member');
    }
    return created;
  }

  async createWebhook(
    userId: string,
    orgId: string,
    overrides?: Partial<schema.WebhookType>,
  ): Promise<schema.WebhookType> {
    const webhook = {
      apiKeyId: createId({ prefix: 'whsk' }),
      config: {
        headers: {},
        requests: {},
        storage: {
          maxRequestBodySize: 1024 * 1024,
          maxResponseBodySize: 1024 * 1024,
          storeHeaders: true,
          storeRequestBody: true,
          storeResponseBody: true,
        },
      },
      createdAt: new Date(),
      id: createId({ prefix: 'wh' }),
      isPrivate: false,
      name: faker.lorem.words(2),
      orgId,
      requestCount: 0,
      status: 'active' as const,
      userId,
      ...overrides,
    };

    const [created] = await this.db
      .insert(schema.Webhooks)
      .values(webhook)
      .returning();
    if (!created) {
      throw new Error('Failed to create webhook');
    }
    return created;
  }

  async createEvent(
    webhookId: string,
    userId: string,
    orgId: string,
    overrides?: Partial<schema.EventType>,
  ): Promise<schema.EventType> {
    const event = {
      apiKeyId: 'apiKeyId',
      createdAt: new Date(),
      id: createId({ prefix: 'evt' }),
      maxRetries: 3,
      orgId,
      originRequest: {
        body: JSON.stringify({ test: true }),
        clientIp: faker.internet.ipv4(),
        contentType: 'application/json',
        headers: {
          'content-type': 'application/json',
          'user-agent': faker.internet.userAgent(),
        },
        id: createId({ prefix: 'req' }),
        method: 'POST',
        size: faker.number.int({ max: 10000, min: 100 }),
        sourceUrl: faker.internet.url(),
      },
      retryCount: 0,
      source: '*',
      status: 'pending' as const,
      timestamp: new Date(),
      userId,
      webhookId,
      ...overrides,
    };

    const [created] = await this.db
      .insert(schema.Events)
      .values(event)
      .returning();
    if (!created) {
      throw new Error('Failed to create event');
    }
    return created;
  }

  async createRequest(
    webhookId: string,
    userId: string,
    orgId: string,
    overrides?: Partial<schema.RequestType>,
  ): Promise<schema.RequestType> {
    const request = {
      apiKeyId: 'apiKeyId',
      createdAt: new Date(),
      destination: {
        name: 'Test Destination',
        url: 'http://localhost:3000',
      },
      id: createId({ prefix: 'req' }),
      orgId,
      request: {
        body: JSON.stringify({ test: true }),
        clientIp: faker.internet.ipv4(),
        contentType: 'application/json',
        headers: {
          'content-type': 'application/json',
          'user-agent': faker.internet.userAgent(),
        },
        id: createId({ prefix: 'req' }),
        method: 'POST',
        size: faker.number.int({ max: 10000, min: 100 }),
        sourceUrl: faker.internet.url(),
      },
      response: {
        body: JSON.stringify({ success: true }),
        headers: {
          'content-type': 'application/json',
        },
        status: 200,
      },
      source: '*',
      status: 'completed' as const,
      timestamp: new Date(),
      userId,
      webhookId,
      ...overrides,
    };

    const [created] = await this.db
      .insert(schema.Requests)
      .values(request)
      .returning();
    if (!created) {
      throw new Error('Failed to create request');
    }
    return created;
  }

  async createConnection(
    webhookId: string,
    userId: string,
    orgId: string,
    overrides?: Partial<schema.ConnectionType>,
  ): Promise<schema.ConnectionType> {
    const [created] = await this.db
      .insert(schema.Connections)
      .values({
        clientId: `client_${faker.string.alphanumeric(10)}`,
        connectedAt: new Date(),
        createdAt: new Date(),
        id: createId({ prefix: 'conn' }),
        ipAddress: faker.internet.ipv4(),
        orgId,
        userId,
        webhookId,
        ...overrides,
      })
      .returning();
    if (!created) {
      throw new Error('Failed to create connection');
    }
    return created;
  }

  async createForwardingDestination(
    _userId: string,
    orgId: string,
    overrides?: Partial<schema.ForwardingDestinationType>,
  ): Promise<schema.ForwardingDestinationType> {
    const [created] = await this.db
      .insert(schema.ForwardingDestinations)
      .values({
        config: {
          url: faker.internet.url(),
        },
        createdAt: new Date(),
        id: createId({ prefix: 'dest' }),
        name: faker.lorem.words(2),
        orgId,
        type: 'webhook',
        ...overrides,
      })
      .returning();
    if (!created) {
      throw new Error('Failed to create forwarding destination');
    }
    return created;
  }

  async createCompleteWebhookSetup(overrides?: {
    user?: Partial<schema.UserType>;
    org?: Partial<schema.OrgType>;
    webhook?: Partial<schema.WebhookType>;
  }) {
    // Create user
    const user = await this.createUser(overrides?.user);

    // Create org
    const org = await this.createOrg({
      createdByUserId: user.id,
      ...overrides?.org,
    });

    // Add user as org member
    await this.createOrgMember(user.id, org.id, 'admin');

    // Create webhook
    const webhook = await this.createWebhook(
      user.id,
      org.id,
      overrides?.webhook,
    );

    return { org, user, webhook };
  }
}
