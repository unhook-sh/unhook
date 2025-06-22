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
  authUrl: env.NEXT_PUBLIC_AUTH_URL,
  apiKey: env.clerk_API_KEY,
});

function mapclerkUserToMember(user: UserInOrgMetadata): Member {
  return {
    userId: user.userId,
    email: user.email,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    role: user.roleInOrg as Role,
    joinedAt: user.createdAt,
    pictureUrl: user.pictureUrl ?? null,
    lastActiveAt: user.lastActiveAt,
    emailConfirmed: user.emailConfirmed,
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
        orgId,
        includeOrgs: true,
      });

      return {
        success: true,
        data: result.users.map(mapclerkUserToMember),
      };
    } catch (error) {
      console.error('Failed to fetch org members:', error);
      return { success: false, error: 'Failed to fetch org members' };
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
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to invite member',
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
        userId,
        role,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to update member role:', error);
      return { success: false, error: 'Failed to update member role' };
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
      return { success: false, error: 'Failed to remove member' };
    }
  });
