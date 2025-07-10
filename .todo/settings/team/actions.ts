'use server';

import type { UserInOrgMetadata } from '@clerk/node';
import { initBaseAuth } from '@clerk/node';
import { createSafeActionClient } from 'next-safe-action';
import { env } from '~/env';
import type { Member, Role } from './types';
import {
  getOrgMembersSchema,
  inviteMemberSchema,
  removeMemberSchema,
  updateMemberRoleSchema,
} from './validations';

const clerk = initBaseAuth({
  apiKey: env.clerk_API_KEY,
  authUrl: env.NEXT_PUBLIC_AUTH_URL,
});

function mapclerkUserToMember(user: UserInOrgMetadata): Member {
  return {
    email: user.email,
    emailConfirmed: user.emailConfirmed,
    firstName: user.firstName ?? null,
    joinedAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    lastName: user.lastName ?? null,
    pictureUrl: user.pictureUrl ?? null,
    role: user.roleInOrg as Role,
    userId: user.userId,
  };
}

// Create the action client
const actionClient = createSafeActionClient();

export const getOrgMembersAction = actionClient
  .schema(getOrgMembersSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { orgId } = parsedInput;
      const result = await clerk.fetchUsersInOrg({
        includeOrgs: true,
        orgId,
      });

      return {
        data: result.users.map(mapclerkUserToMember),
        success: true,
      };
    } catch (error) {
      console.error('Failed to fetch org members:', error);
      return { error: 'Failed to fetch org members', success: false };
    }
  });

export const inviteMemberAction = actionClient
  .schema(inviteMemberSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { email, role, orgId } = parsedInput;
      await clerk.inviteUserToOrg({
        email,
        orgId,
        role,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to invite member:', error);
      return {
        error:
          error instanceof Error ? error.message : 'Failed to invite member',
        success: false,
      };
    }
  });

export const updateMemberRoleAction = actionClient
  .schema(updateMemberRoleSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { userId, role, orgId } = parsedInput;
      await clerk.changeUserRoleInOrg({
        orgId,
        role,
        userId,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to update member role:', error);
      return { error: 'Failed to update member role', success: false };
    }
  });

export const removeMemberAction = actionClient
  .schema(removeMemberSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { userId, orgId } = parsedInput;
      await clerk.removeUserFromOrg({
        orgId,
        userId,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to remove member:', error);
      return { error: 'Failed to remove member', success: false };
    }
  });
