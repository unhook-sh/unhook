import { faker } from '@faker-js/faker';
import * as schema from '@unhook/db/src/schema';
import { createId } from '@unhook/id';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export class TestFactories {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async createUser(
    overrides?: Partial<schema.UserType>,
  ): Promise<schema.UserType> {
    const user = {
      id: createId({ prefix: 'user' }),
      clerkId: `clerk_${faker.string.alphanumeric(20)}`,
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      avatarUrl: faker.image.avatar(),
      online: false,
      createdAt: new Date(),
      ...overrides,
    };

    const [created] = await this.db
      .insert(schema.Users)
      .values(user)
      .returning();
    return created;
  }

  async createOrg(
    overrides?: Partial<schema.OrgType>,
  ): Promise<schema.OrgType> {
    const user = await this.createUser();

    const org = {
      id: createId({ prefix: 'org' }),
      clerkOrgId: `org_${faker.string.alphanumeric(20)}`,
      name: faker.company.name(),
      createdByUserId: user.id,
      createdAt: new Date(),
      ...overrides,
    };

    const [created] = await this.db.insert(schema.Orgs).values(org).returning();
    return created;
  }

  async createOrgMember(
    userId: string,
    orgId: string,
    role: 'user' | 'admin' | 'superAdmin' = 'user',
  ): Promise<schema.OrgMembersType> {
    const member = {
      id: createId({ prefix: 'member' }),
      userId,
      orgId,
      role,
      createdAt: new Date(),
    };

    const [created] = await this.db
      .insert(schema.OrgMembers)
      .values(member)
      .returning();
    return created;
  }

  async createWebhook(
    userId: string,
    orgId: string,
    overrides?: Partial<schema.WebhookType>,
  ): Promise<schema.WebhookType> {
    const webhook = {
      id: createId({ prefix: 'wh' }),
      name: faker.lorem.words(2),
      apiKey: createId({ prefix: 'whsk' }),
      status: 'active' as const,
      isPrivate: false,
      requestCount: 0,
      config: {
        storage: {
          storeHeaders: true,
          storeRequestBody: true,
          storeResponseBody: true,
          maxRequestBodySize: 1024 * 1024,
          maxResponseBodySize: 1024 * 1024,
        },
        headers: {},
        requests: {},
      },
      userId,
      orgId,
      createdAt: new Date(),
      ...overrides,
    };

    const [created] = await this.db
      .insert(schema.Webhooks)
      .values(webhook)
      .returning();
    return created;
  }

  async createEvent(
    webhookId: string,
    userId: string,
    orgId: string,
    overrides?: Partial<schema.EventType>,
  ): Promise<schema.EventType> {
    const event = {
      id: createId({ prefix: 'evt' }),
      webhookId,
      originRequest: {
        id: createId({ prefix: 'req' }),
        method: 'POST',
        sourceUrl: faker.internet.url(),
        headers: {
          'content-type': 'application/json',
          'user-agent': faker.internet.userAgent(),
        },
        size: faker.number.int({ min: 100, max: 10000 }),
        body: JSON.stringify({ test: true }),
        contentType: 'application/json',
        clientIp: faker.internet.ipv4(),
      },
      source: '*',
      retryCount: 0,
      maxRetries: 3,
      status: 'pending' as const,
      timestamp: new Date(),
      userId,
      orgId,
      createdAt: new Date(),
      ...overrides,
    };

    const [created] = await this.db
      .insert(schema.Events)
      .values(event)
      .returning();
    return created;
  }

  async createRequest(
    webhookId: string,
    userId: string,
    orgId: string,
    overrides?: Partial<schema.RequestType>,
  ): Promise<schema.RequestType> {
    const request = {
      id: createId({ prefix: 'req' }),
      webhookId,
      request: {
        id: createId({ prefix: 'req' }),
        method: 'POST',
        sourceUrl: faker.internet.url(),
        headers: {
          'content-type': 'application/json',
          'user-agent': faker.internet.userAgent(),
        },
        size: faker.number.int({ min: 100, max: 10000 }),
        body: JSON.stringify({ test: true }),
        contentType: 'application/json',
        clientIp: faker.internet.ipv4(),
      },
      source: '*',
      destination: {
        url: 'http://localhost:3000',
        headers: {},
      },
      response: {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ success: true }),
      },
      status: 'completed' as const,
      timestamp: new Date(),
      userId,
      orgId,
      createdAt: new Date(),
      ...overrides,
    };

    const [created] = await this.db
      .insert(schema.Requests)
      .values(request)
      .returning();
    return created;
  }

  async createConnection(
    webhookId: string,
    userId: string,
    orgId: string,
    overrides?: Partial<schema.ConnectionType>,
  ): Promise<schema.ConnectionType> {
    const connection = {
      id: createId({ prefix: 'conn' }),
      webhookId,
      clientId: `client_${faker.string.alphanumeric(10)}`,
      status: 'connected' as const,
      connectedAt: new Date(),
      metadata: {
        ip: faker.internet.ipv4(),
        userAgent: faker.internet.userAgent(),
      },
      userId,
      orgId,
      createdAt: new Date(),
      ...overrides,
    };

    const [created] = await this.db
      .insert(schema.Connections)
      .values(connection)
      .returning();
    return created;
  }

  async createForwardingDestination(
    userId: string,
    orgId: string,
    overrides?: Partial<schema.ForwardingDestinationType>,
  ): Promise<schema.ForwardingDestinationType> {
    const destination = {
      id: createId({ prefix: 'dest' }),
      name: faker.lorem.words(2),
      url: faker.internet.url(),
      headers: {},
      timeout: 30000,
      retryOnFailure: true,
      maxRetries: 3,
      userId,
      orgId,
      createdAt: new Date(),
      ...overrides,
    };

    const [created] = await this.db
      .insert(schema.ForwardingDestinations)
      .values(destination)
      .returning();
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

    return { user, org, webhook };
  }
}
