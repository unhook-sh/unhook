import { beforeEach, describe, expect, it, jest, mock } from 'bun:test';
import { upsertOrg } from './upsert-org';

// Mock external dependencies
const mockClerkClient = {
  organizations: {
    createOrganization: jest.fn(),
    updateOrganization: jest.fn(),
  },
  users: {
    getUser: jest.fn(),
  },
};

const mockUpsertStripeCustomer = jest.fn();
const mockCreateSubscription = jest.fn();
const mockGetFreePlanPriceId = jest.fn();
const mockGenerateRandomName = jest.fn();

// Mock imports
mock.module('@clerk/nextjs/server', () => ({
  clerkClient: () => Promise.resolve(mockClerkClient),
}));

mock.module('@unhook/stripe', () => ({
  BILLING_INTERVALS: { MONTHLY: 'month' },
  createSubscription: mockCreateSubscription,
  getFreePlanPriceId: mockGetFreePlanPriceId,
  PLAN_TYPES: { FREE: 'free' },
  upsertStripeCustomer: mockUpsertStripeCustomer,
}));

mock.module('@unhook/id', () => ({
  generateRandomName: mockGenerateRandomName,
}));

// Mock database
const mockTransaction = jest.fn();
const mockQuery = {
  ApiKeys: {
    findFirst: jest.fn(),
  },
  OrgMembers: {
    findFirst: jest.fn(),
  },
  Orgs: {
    findFirst: jest.fn(),
  },
  Users: {
    findFirst: jest.fn(),
  },
  Webhooks: {
    findFirst: jest.fn(),
  },
};

const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockValues = jest.fn();
const mockReturning = jest.fn();
const mockOnConflictDoUpdate = jest.fn();
const mockSet = jest.fn();
const mockWhere = jest.fn();

mock.module('../client', () => ({
  db: {
    insert: mockInsert,
    query: mockQuery,
    transaction: mockTransaction,
    update: mockUpdate,
  },
}));

describe('upsertOrg', () => {
  const mockUser = {
    firstName: 'John',
    id: 'user_123',
    imageUrl: 'https://example.com/avatar.jpg',
    lastName: 'Doe',
    primaryEmailAddress: {
      emailAddress: 'john.doe@example.com',
    },
  };

  const mockClerkOrg = {
    id: 'org_456',
    name: 'Test Organization',
  };

  const mockStripeCustomer = {
    id: 'cus_789',
  };

  const mockSubscription = {
    id: 'sub_123',
    status: 'active',
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockClerkClient.users.getUser.mockResolvedValue(mockUser);
    mockGenerateRandomName.mockReturnValue('random-slug');
    mockUpsertStripeCustomer.mockResolvedValue(mockStripeCustomer);
    mockGetFreePlanPriceId.mockResolvedValue('price_123');
    mockCreateSubscription.mockResolvedValue(mockSubscription);

    // Setup transaction mock
    mockTransaction.mockImplementation((callback) => {
      const tx = {
        insert: mockInsert,
        query: mockQuery,
        update: mockUpdate,
      };
      return callback(tx);
    });

    // Setup fluent interface mocks
    mockInsert.mockReturnValue({
      values: mockValues,
    });
    mockValues.mockReturnValue({
      onConflictDoUpdate: mockOnConflictDoUpdate,
      returning: mockReturning,
    });
    mockOnConflictDoUpdate.mockReturnValue({
      returning: mockReturning,
    });
    mockUpdate.mockReturnValue({
      set: mockSet,
    });
    mockSet.mockReturnValue({
      where: mockWhere,
    });
    mockWhere.mockResolvedValue(undefined);
  });

  describe('new organization creation', () => {
    it('should create a new organization successfully', async () => {
      // Setup mocks
      mockQuery.OrgMembers.findFirst.mockResolvedValue(null);
      mockQuery.Users.findFirst.mockResolvedValue(null);
      mockClerkClient.organizations.createOrganization.mockResolvedValue(
        mockClerkOrg,
      );

      const mockOrg = {
        clerkOrgId: 'org_456',
        id: 'org_db_123',
        name: 'Test Organization',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      };

      const mockApiKey = {
        id: 'key_123',
        key: 'ak_test_123',
        name: 'Default',
      };

      const mockWebhook = {
        apiKeyId: 'key_123',
        id: 'wh_123',
        isPrivate: false,
        name: 'Default',
        orgId: 'org_db_123',
        userId: 'user_123',
      };

      mockReturning
        .mockResolvedValueOnce([mockUser]) // User creation
        .mockResolvedValueOnce([mockOrg]) // Org creation
        .mockResolvedValueOnce([mockApiKey]) // API key creation
        .mockResolvedValueOnce([mockWebhook]); // Webhook creation

      mockQuery.ApiKeys.findFirst.mockResolvedValue(null);
      mockQuery.Webhooks.findFirst.mockResolvedValue(null);

      const result = await upsertOrg({
        name: 'Test Organization',
        userId: 'user_123',
      });

      expect(result).toEqual({
        apiKey: {
          id: 'key_123',
          key: 'ak_test_123',
          name: 'Default',
        },
        org: {
          id: 'org_456',
          name: 'Test Organization',
          stripeCustomerId: 'cus_789',
        },
        webhook: {
          apiKeyId: 'key_123',
          id: 'wh_123',
          isNew: true,
          isPrivate: false,
          name: 'Default',
          orgId: 'org_db_123',
          userId: 'user_123',
        },
      });

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockClerkClient.users.getUser).toHaveBeenCalledWith('user_123');
      expect(
        mockClerkClient.organizations.createOrganization,
      ).toHaveBeenCalledWith({
        createdBy: 'user_123',
        name: 'Test Organization',
        slug: 'random-slug',
      });
      expect(mockUpsertStripeCustomer).toHaveBeenCalled();
    });

    it('should handle existing user membership and return existing org', async () => {
      const existingMembership = {
        id: 'member_123',
        orgId: 'org_existing',
        userId: 'user_123',
      };

      const existingOrg = {
        clerkOrgId: 'org_clerk_existing',
        id: 'org_existing',
        name: 'Existing Org',
        stripeCustomerId: 'cus_existing',
      };

      const existingApiKey = {
        id: 'key_existing',
        key: 'ak_existing',
        name: 'Default',
      };

      const existingWebhook = {
        apiKeyId: 'key_existing',
        id: 'wh_existing',
        isPrivate: false,
        name: 'Default',
        orgId: 'org_existing',
        userId: 'user_123',
      };

      mockQuery.OrgMembers.findFirst.mockResolvedValue(existingMembership);
      mockQuery.Orgs.findFirst.mockResolvedValue(existingOrg);
      mockQuery.ApiKeys.findFirst.mockResolvedValue(existingApiKey);
      mockQuery.Webhooks.findFirst.mockResolvedValue(existingWebhook);

      const result = await upsertOrg({
        name: 'Test Organization',
        userId: 'user_123',
      });

      expect(result).toEqual({
        apiKey: {
          id: 'key_existing',
          key: 'ak_existing',
          name: 'Default',
        },
        org: {
          id: 'org_clerk_existing',
          name: 'Existing Org',
          stripeCustomerId: 'cus_existing',
        },
        webhook: {
          apiKeyId: 'key_existing',
          id: 'wh_existing',
          isNew: false,
          isPrivate: false,
          name: 'Default',
          orgId: 'org_existing',
          userId: 'user_123',
        },
      });

      // Should not create new org since user already has one
      expect(
        mockClerkClient.organizations.createOrganization,
      ).not.toHaveBeenCalled();
    });
  });

  describe('organization update', () => {
    it('should update existing organization when orgId is provided', async () => {
      mockQuery.OrgMembers.findFirst.mockResolvedValue(null);
      mockQuery.Users.findFirst.mockResolvedValue(null);
      mockClerkClient.organizations.updateOrganization.mockResolvedValue(
        mockClerkOrg,
      );

      const mockOrg = {
        clerkOrgId: 'org_456',
        id: 'org_db_123',
        name: 'Updated Organization',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      };

      const mockApiKey = {
        id: 'key_123',
        key: 'ak_test_123',
        name: 'Default',
      };

      const mockWebhook = {
        apiKeyId: 'key_123',
        id: 'wh_123',
        isPrivate: false,
        name: 'Default',
        orgId: 'org_db_123',
        userId: 'user_123',
      };

      mockReturning
        .mockResolvedValueOnce([mockUser]) // User creation
        .mockResolvedValueOnce([mockOrg]) // Org update
        .mockResolvedValueOnce([mockApiKey]) // API key creation
        .mockResolvedValueOnce([mockWebhook]); // Webhook creation

      mockQuery.ApiKeys.findFirst.mockResolvedValue(null);
      mockQuery.Webhooks.findFirst.mockResolvedValue(null);

      await upsertOrg({
        name: 'Updated Organization',
        orgId: 'org_456',
        userId: 'user_123',
      });

      expect(
        mockClerkClient.organizations.updateOrganization,
      ).toHaveBeenCalledWith('org_456', { name: 'Updated Organization' });
      expect(
        mockClerkClient.organizations.createOrganization,
      ).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error when user email is not found', async () => {
      const userWithoutEmail = {
        ...mockUser,
        primaryEmailAddress: null,
      };

      mockClerkClient.users.getUser.mockResolvedValue(userWithoutEmail);
      mockQuery.OrgMembers.findFirst.mockResolvedValue(null);

      await expect(
        upsertOrg({
          name: 'Test Organization',
          userId: 'user_123',
        }),
      ).rejects.toThrow('User email not found');
    });

    it('should handle Clerk organization creation failure', async () => {
      mockQuery.OrgMembers.findFirst.mockResolvedValue(null);
      mockQuery.Users.findFirst.mockResolvedValue(null);
      mockReturning.mockResolvedValueOnce([mockUser]); // User creation
      mockClerkClient.organizations.createOrganization.mockResolvedValue(null);

      await expect(
        upsertOrg({
          name: 'Test Organization',
          userId: 'user_123',
        }),
      ).rejects.toThrow('Failed to create organization in Clerk');
    });

    it('should handle slug collision and retry with existing org', async () => {
      mockQuery.OrgMembers.findFirst.mockResolvedValue(null);
      mockQuery.Users.findFirst.mockResolvedValue(null);
      mockReturning.mockResolvedValueOnce([mockUser]); // User creation

      const slugError = new Error('Organization slug already exists');
      mockClerkClient.organizations.createOrganization.mockRejectedValue(
        slugError,
      );

      // Mock existing org found by name
      const existingOrg = {
        clerkOrgId: 'org_clerk_existing',
        id: 'org_existing',
        name: 'Test Organization',
        stripeCustomerId: 'cus_existing',
      };

      mockQuery.Orgs.findFirst.mockResolvedValue(existingOrg);
      mockQuery.ApiKeys.findFirst.mockResolvedValue({
        id: 'key_existing',
        key: 'ak_existing',
        name: 'Default',
      });
      mockQuery.Webhooks.findFirst.mockResolvedValue({
        apiKeyId: 'key_existing',
        id: 'wh_existing',
        isPrivate: false,
        name: 'Default',
        orgId: 'org_existing',
        userId: 'user_123',
      });

      const result = await upsertOrg({
        name: 'Test Organization',
        userId: 'user_123',
      });

      expect(result.org.id).toBe('org_clerk_existing');
      expect(result.org.name).toBe('Test Organization');
    });

    it('should handle Stripe customer creation failure', async () => {
      mockQuery.OrgMembers.findFirst.mockResolvedValue(null);
      mockQuery.Users.findFirst.mockResolvedValue(null);
      mockClerkClient.organizations.createOrganization.mockResolvedValue(
        mockClerkOrg,
      );
      mockUpsertStripeCustomer.mockResolvedValue(null);

      const mockOrg = {
        clerkOrgId: 'org_456',
        id: 'org_db_123',
        name: 'Test Organization',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      };

      mockReturning
        .mockResolvedValueOnce([mockUser]) // User creation
        .mockResolvedValueOnce([mockOrg]); // Org creation

      await expect(
        upsertOrg({
          name: 'Test Organization',
          userId: 'user_123',
        }),
      ).rejects.toThrow('Failed to create or get Stripe customer');
    });
  });

  describe('race condition handling', () => {
    it('should handle concurrent requests gracefully', async () => {
      // Simulate two concurrent requests
      mockQuery.OrgMembers.findFirst
        .mockResolvedValueOnce(null) // First request: no existing membership
        .mockResolvedValueOnce(null); // Second request: no existing membership

      mockQuery.Users.findFirst.mockResolvedValue(null);
      mockClerkClient.organizations.createOrganization.mockResolvedValue(
        mockClerkOrg,
      );

      const mockOrg = {
        clerkOrgId: 'org_456',
        id: 'org_db_123',
        name: 'Test Organization',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      };

      const mockApiKey = {
        id: 'key_123',
        key: 'ak_test_123',
        name: 'Default',
      };

      const mockWebhook = {
        apiKeyId: 'key_123',
        id: 'wh_123',
        isPrivate: false,
        name: 'Default',
        orgId: 'org_db_123',
        userId: 'user_123',
      };

      mockReturning
        .mockResolvedValue([mockUser]) // User creation
        .mockResolvedValue([mockOrg]) // Org creation
        .mockResolvedValue([mockApiKey]) // API key creation
        .mockResolvedValue([mockWebhook]); // Webhook creation

      mockQuery.ApiKeys.findFirst.mockResolvedValue(null);
      mockQuery.Webhooks.findFirst.mockResolvedValue(null);

      // Both requests should complete successfully due to transaction isolation
      const [result1, result2] = await Promise.all([
        upsertOrg({
          name: 'Test Organization',
          userId: 'user_123',
        }),
        upsertOrg({
          name: 'Test Organization',
          userId: 'user_123',
        }),
      ]);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(mockTransaction).toHaveBeenCalledTimes(2);
    });
  });

  describe('subscription handling', () => {
    it('should auto-subscribe to free plan for new organizations', async () => {
      mockQuery.OrgMembers.findFirst.mockResolvedValue(null);
      mockQuery.Users.findFirst.mockResolvedValue(null);
      mockClerkClient.organizations.createOrganization.mockResolvedValue(
        mockClerkOrg,
      );

      const mockOrg = {
        clerkOrgId: 'org_456',
        id: 'org_db_123',
        name: 'Test Organization',
        stripeCustomerId: null,
        stripeSubscriptionId: null, // No existing subscription
      };

      const mockApiKey = {
        id: 'key_123',
        key: 'ak_test_123',
        name: 'Default',
      };

      const mockWebhook = {
        apiKeyId: 'key_123',
        id: 'wh_123',
        isPrivate: false,
        name: 'Default',
        orgId: 'org_db_123',
        userId: 'user_123',
      };

      mockReturning
        .mockResolvedValueOnce([mockUser]) // User creation
        .mockResolvedValueOnce([mockOrg]) // Org creation
        .mockResolvedValueOnce([mockApiKey]) // API key creation
        .mockResolvedValueOnce([mockWebhook]); // Webhook creation

      mockQuery.ApiKeys.findFirst.mockResolvedValue(null);
      mockQuery.Webhooks.findFirst.mockResolvedValue(null);

      await upsertOrg({
        name: 'Test Organization',
        userId: 'user_123',
      });

      expect(mockGetFreePlanPriceId).toHaveBeenCalled();
      expect(mockCreateSubscription).toHaveBeenCalledWith({
        billingInterval: 'month',
        customerId: 'cus_789',
        orgId: 'org_db_123',
        planType: 'free',
        priceId: 'price_123',
      });
    });

    it('should skip auto-subscription if org already has subscription', async () => {
      mockQuery.OrgMembers.findFirst.mockResolvedValue(null);
      mockQuery.Users.findFirst.mockResolvedValue(null);
      mockClerkClient.organizations.createOrganization.mockResolvedValue(
        mockClerkOrg,
      );

      const mockOrg = {
        clerkOrgId: 'org_456',
        id: 'org_db_123',
        name: 'Test Organization',
        stripeCustomerId: 'cus_existing',
        stripeSubscriptionId: 'sub_existing', // Already has subscription
      };

      const mockApiKey = {
        id: 'key_123',
        key: 'ak_test_123',
        name: 'Default',
      };

      const mockWebhook = {
        apiKeyId: 'key_123',
        id: 'wh_123',
        isPrivate: false,
        name: 'Default',
        orgId: 'org_db_123',
        userId: 'user_123',
      };

      mockReturning
        .mockResolvedValueOnce([mockUser]) // User creation
        .mockResolvedValueOnce([mockOrg]) // Org creation
        .mockResolvedValueOnce([mockApiKey]) // API key creation
        .mockResolvedValueOnce([mockWebhook]); // Webhook creation

      mockQuery.ApiKeys.findFirst.mockResolvedValue(null);
      mockQuery.Webhooks.findFirst.mockResolvedValue(null);

      await upsertOrg({
        name: 'Test Organization',
        userId: 'user_123',
      });

      expect(mockCreateSubscription).not.toHaveBeenCalled();
    });
  });

  describe('database operations', () => {
    it('should use onConflictDoUpdate for all insert operations', async () => {
      mockQuery.OrgMembers.findFirst.mockResolvedValue(null);
      mockQuery.Users.findFirst.mockResolvedValue(null);
      mockClerkClient.organizations.createOrganization.mockResolvedValue(
        mockClerkOrg,
      );

      const mockOrg = {
        clerkOrgId: 'org_456',
        id: 'org_db_123',
        name: 'Test Organization',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      };

      const mockApiKey = {
        id: 'key_123',
        key: 'ak_test_123',
        name: 'Default',
      };

      const mockWebhook = {
        apiKeyId: 'key_123',
        id: 'wh_123',
        isPrivate: false,
        name: 'Default',
        orgId: 'org_db_123',
        userId: 'user_123',
      };

      mockReturning
        .mockResolvedValueOnce([mockUser]) // User creation
        .mockResolvedValueOnce([mockOrg]) // Org creation
        .mockResolvedValueOnce([mockApiKey]) // API key creation
        .mockResolvedValueOnce([mockWebhook]); // Webhook creation

      mockQuery.ApiKeys.findFirst.mockResolvedValue(null);
      mockQuery.Webhooks.findFirst.mockResolvedValue(null);

      await upsertOrg({
        name: 'Test Organization',
        userId: 'user_123',
      });

      // Verify onConflictDoUpdate was called for all inserts
      expect(mockOnConflictDoUpdate).toHaveBeenCalledTimes(4); // User, Org, OrgMember, ApiKey
    });
  });
});
