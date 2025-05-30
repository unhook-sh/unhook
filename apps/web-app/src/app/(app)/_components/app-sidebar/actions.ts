'use server';
import { initBaseAuth } from '@clerk/node';
import { createSafeActionClient } from 'next-safe-action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { env } from '~/env';

const clerk = initBaseAuth({
  authUrl: env.NEXT_PUBLIC_AUTH_URL,
  apiKey: env.clerk_API_KEY,
});

const action = createSafeActionClient();

// Schema definitions
const createApiKeySchema = z.object({
  orgId: z.string(),
  metadata: z.object({
    envId: z.string(),
    name: z.string(),
    projectId: z.string(),
    userId: z.string(),
  }),
  currentPath: z.string(),
});

// Server actions
export const createApiKey = action
  .schema(createApiKeySchema)
  .action(async ({ parsedInput }) => {
    try {
      const { orgId, metadata } = parsedInput;
      const response = await clerk.createApiKey({
        orgId,
        metadata,
        userId: metadata.userId,
      });

      await clerk.updateApiKey(response.apiKeyId, {
        metadata: JSON.stringify({
          ...metadata,
          name: metadata.name,
          last4ApiKeyToken: response.apiKeyToken.slice(-4),
        }),
      });

      revalidatePath(parsedInput.currentPath);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error };
    }
  });

export const createOrgAction = action
  .schema(
    z.object({
      name: z.string().min(2, 'Organization name is required'),
      enableAutoJoiningByDomain: z.boolean().optional(),
      domain: z.string().optional(),
      membersMustHaveMatchingDomain: z.boolean().optional(),
      userId: z.string().min(1, 'User ID is required'),
      currentPath: z.string().min(1, 'Current path is required'),
    }),
  )
  .action(async ({ parsedInput }) => {
    try {
      // createOrg automatically adds the current user to the org
      const response = await clerk.createOrg({
        domain: parsedInput.domain,
        name: parsedInput.name,
        enableAutoJoiningByDomain:
          parsedInput.enableAutoJoiningByDomain ?? false,
        membersMustHaveMatchingDomain:
          parsedInput.membersMustHaveMatchingDomain ?? false,
      });
      await clerk.addUserToOrg({
        userId: parsedInput.userId,
        orgId: response.orgId,
        role: 'Admin',
      });

      revalidatePath(parsedInput.currentPath);
      return { success: true, data: response };
    } catch (error) {
      // Handle clerk validation errors
      if (error instanceof Error) {
        try {
          const errorObj = JSON.parse(error.message);
          // Handle any validation errors from clerk
          if (
            errorObj &&
            typeof errorObj === 'object' &&
            !Array.isArray(errorObj)
          ) {
            // Collect all validation errors
            const errors = Object.entries(errorObj as Record<string, unknown>)
              .filter(
                ([_, value]) =>
                  Array.isArray(value) &&
                  value.length > 0 &&
                  typeof value[0] === 'string',
              )
              .map(([_, value]) => (value as string[])[0]);

            if (errors.length > 0) {
              return {
                success: false,
                error: errors,
              };
            }
          }
        } catch {
          // If parsing fails, return the original error message as a single-item array
          return {
            success: false,
            error: [error.message],
          };
        }
      }
      return {
        success: false,
        error: ['Failed to create organization'],
      };
    }
  });
