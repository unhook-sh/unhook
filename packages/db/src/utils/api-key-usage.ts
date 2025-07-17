import { eq } from 'drizzle-orm';
import { db } from '../client';
import { ApiKeys, ApiKeyUsage } from '../schema';

export type ApiKeyUsageType =
  | 'webhook-event'
  | 'mcp-server'
  | 'webhook-event-request';

export interface ApiKeyUsageMetadata {
  webhookId?: string;
  requestId?: string;
  eventId?: string;
  [key: string]: unknown;
}

export async function trackApiKeyUsage({
  apiKey,
  type,
  metadata,
  userId,
  orgId,
}: {
  apiKey: string;
  type: ApiKeyUsageType;
  metadata: ApiKeyUsageMetadata;
  userId: string;
  orgId: string;
}) {
  try {
    // Find the API key record
    const apiKeyRecord = await db.query.ApiKeys.findFirst({
      where: eq(ApiKeys.key, apiKey),
    });

    if (apiKeyRecord?.isActive) {
      // Create usage record
      await db.insert(ApiKeyUsage).values({
        apiKeyId: apiKeyRecord.id,
        metadata,
        orgId,
        type,
        userId,
      });

      // Update last used timestamp on API key
      const [updatedApiKey] = await db
        .update(ApiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(ApiKeys.id, apiKeyRecord.id))
        .returning();

      if (updatedApiKey) {
        return updatedApiKey;
      }
    }

    return apiKeyRecord;
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to track API key usage:', error);
  }
}
