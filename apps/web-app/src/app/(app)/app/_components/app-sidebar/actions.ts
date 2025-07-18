'use server';
import { upsertOrg } from '@unhook/db';
import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

// Schema definitions
const _createApiKeySchema = z.object({
  currentPath: z.string(),
  metadata: z.object({
    envId: z.string(),
    name: z.string(),
    projectId: z.string(),
    userId: z.string(),
  }),
  orgId: z.string(),
});

// Server actions

export const createOrgAction = action
  .inputSchema(
    z.object({
      currentPath: z.string().min(1, 'Current path is required'),
      domain: z.string().optional(),
      enableAutoJoiningByDomain: z.boolean().optional(),
      membersMustHaveMatchingDomain: z.boolean().optional(),
      name: z.string().min(2, 'Organization name is required'),
      userId: z.string().min(1, 'User ID is required'),
    }),
  )
  .action(async ({ parsedInput }) => {
    try {
      // createOrg automatically adds the current user to the org
      const org = await upsertOrg({
        name: parsedInput.name,
        userId: parsedInput.userId,
      });

      revalidatePath(parsedInput.currentPath);
      return { data: org, success: true };
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
                error: errors,
                success: false,
              };
            }
          }
        } catch {
          // If parsing fails, return the original error message as a single-item array
          return {
            error: [error.message],
            success: false,
          };
        }
      }
      return {
        error: ['Failed to create organization'],
        success: false,
      };
    }
  });
