import { z } from 'zod';
import type { Role } from './types';

// Validation schemas
export const createApiKeySchema = z.object({
  orgId: z.string(),
  metadata: z
    .object({
      envId: z.string(),
      projectId: z.string(),
    })
    .and(z.record(z.string())),
});

export const deleteApiKeySchema = z.object({
  apiKeyId: z.string(),
  orgId: z.string(),
});

export const getOrgMembersSchema = z.object({
  orgId: z.string(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['Owner', 'Admin', 'Member'] as [Role, ...Role[]]),
  orgId: z.string(),
});

export const updateMemberRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['Owner', 'Admin', 'Member'] as [Role, ...Role[]]),
  orgId: z.string(),
});

export const removeMemberSchema = z.object({
  userId: z.string(),
  orgId: z.string(),
});
