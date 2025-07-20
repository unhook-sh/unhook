'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { OrgMembers, Orgs } from '@unhook/db/schema';
import { isEntitled } from '@unhook/stripe/guards/server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

// Create the action client
const action = createSafeActionClient();

// Validation schemas
const updateTeamNameSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(100, 'Team name too long'),
});

const deleteTeamSchema = z.object({
  confirm: z
    .boolean()
    .refine((val) => val === true, 'You must confirm deletion'),
});

const updateMemberRoleSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  role: z.enum(['admin', 'user']),
});

const removeMemberSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
});

const leaveOrganizationSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
});

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user']).default('user'),
});

// Invite member action with Stripe entitlements check
export const inviteMemberAction = action
  .inputSchema(inviteMemberSchema)
  .action(async ({ parsedInput }) => {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      throw new Error('Unauthorized');
    }

    // Get the organization
    const org = await db.query.Orgs.findFirst({
      where: eq(Orgs.id, orgId),
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // Check if user is admin
    const member = await db.query.OrgMembers.findFirst({
      where: and(eq(OrgMembers.orgId, org.id), eq(OrgMembers.userId, userId)),
    });

    if (!member || member.role !== 'admin') {
      throw new Error('Only admins can invite members');
    }

    // Check Stripe entitlements for invite-org-members feature
    await isEntitled(
      'unlimited_developers',
      'Team member invitations require a paid plan. Please upgrade to invite team members.',
    );

    // Invite the user to the organization via Clerk
    const clerk = await clerkClient();
    await clerk.organizations.createOrganizationInvitation({
      emailAddress: parsedInput.email,
      organizationId: org.clerkOrgId,
      role: parsedInput.role,
    });

    revalidatePath('/app/settings/organization');

    return { success: true };
  });

// Update team name action
export const updateTeamNameAction = action
  .inputSchema(updateTeamNameSchema)
  .action(async ({ parsedInput }) => {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      throw new Error('Unauthorized');
    }

    // Get the organization
    const org = await db.query.Orgs.findFirst({
      where: eq(Orgs.id, orgId),
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // Check if user is admin
    const member = await db.query.OrgMembers.findFirst({
      where: and(eq(OrgMembers.orgId, org.id), eq(OrgMembers.userId, userId)),
    });

    if (!member || member.role !== 'admin') {
      throw new Error('Only admins can update team name');
    }

    // Update organization name in Clerk
    const clerk = await clerkClient();
    await clerk.organizations.updateOrganization(orgId, {
      name: parsedInput.name,
    });

    // Update organization name in database
    await db
      .update(Orgs)
      .set({
        name: parsedInput.name,
      })
      .where(eq(Orgs.id, orgId));

    revalidatePath('/app/settings/organization');

    return { success: true };
  });

// Delete team action
export const deleteTeamAction = action
  .inputSchema(deleteTeamSchema)
  .action(async ({ parsedInput }) => {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      throw new Error('Unauthorized');
    }

    // Validate confirmation
    if (!parsedInput.confirm) {
      throw new Error('You must confirm deletion');
    }

    // Get the organization
    const org = await db.query.Orgs.findFirst({
      where: eq(Orgs.id, orgId),
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // Check if user is admin and the creator
    const member = await db.query.OrgMembers.findFirst({
      where: and(eq(OrgMembers.orgId, org.id), eq(OrgMembers.userId, userId)),
    });

    if (!member || member.role !== 'admin') {
      throw new Error('Only admins can delete the team');
    }

    if (org.createdByUserId !== userId) {
      throw new Error('Only the team creator can delete the team');
    }

    // Delete organization in Clerk
    const clerk = await clerkClient();
    await clerk.organizations.deleteOrganization(org.clerkOrgId);

    // The database will be cleaned up via Clerk webhooks
    // But we can also clean up directly here for immediate effect
    await db.delete(Orgs).where(eq(Orgs.id, orgId));

    // Redirect to dashboard after deletion
    redirect('/app/dashboard');
  });

// Get organization members action
export const getOrganizationMembersAction = action.action(async () => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  // Get the organization
  const org = await db.query.Orgs.findFirst({
    where: eq(Orgs.id, orgId),
  });

  if (!org) {
    throw new Error('Organization not found');
  }

  // Get organization members with user details
  const members = await db.query.OrgMembers.findMany({
    where: eq(OrgMembers.orgId, org.id),
    with: {
      user: true,
    },
  });

  return members.map((member) => ({
    createdAt: member.createdAt,
    email: member.user?.email || 'Unknown',
    firstName: member.user?.firstName,
    id: member.id,
    lastName: member.user?.lastName,
    role: member.role,
  }));
});

// Remove member action
export const removeMemberAction = action
  .inputSchema(removeMemberSchema)
  .action(async ({ parsedInput }) => {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      throw new Error('Unauthorized');
    }

    // Get the organization
    const org = await db.query.Orgs.findFirst({
      where: eq(Orgs.id, orgId),
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // Check if user is admin
    const currentMember = await db.query.OrgMembers.findFirst({
      where: and(eq(OrgMembers.orgId, org.id), eq(OrgMembers.userId, userId)),
    });

    if (!currentMember || currentMember.role !== 'admin') {
      throw new Error('Only admins can remove members');
    }

    // Get the member to be removed
    const memberToRemove = await db.query.OrgMembers.findFirst({
      where: eq(OrgMembers.id, parsedInput.memberId),
      with: {
        user: true,
      },
    });

    if (!memberToRemove || memberToRemove.orgId !== org.id) {
      throw new Error('Member not found');
    }

    // Prevent removing the last admin
    if (memberToRemove.role === 'admin') {
      const adminCount = await db.query.OrgMembers.findMany({
        where: and(eq(OrgMembers.orgId, org.id), eq(OrgMembers.role, 'admin')),
      });

      if (adminCount.length <= 1) {
        throw new Error('Cannot remove the last admin');
      }
    }

    // Remove from database - Clerk webhooks will handle synchronization
    // The user will be removed from Clerk via the webhook system
    const clerk = await clerkClient();
    await clerk.organizations.deleteOrganizationMembership({
      organizationId: org.clerkOrgId,
      userId: memberToRemove.userId,
    });

    // Remove from database
    await db.delete(OrgMembers).where(eq(OrgMembers.id, parsedInput.memberId));

    revalidatePath('/app/settings/organization');

    return { success: true };
  });

// Update member role action
export const updateMemberRoleAction = action
  .inputSchema(updateMemberRoleSchema)
  .action(async ({ parsedInput }) => {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      throw new Error('Unauthorized');
    }

    // Get the organization
    const org = await db.query.Orgs.findFirst({
      where: eq(Orgs.id, orgId),
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // Check if user is admin
    const currentMember = await db.query.OrgMembers.findFirst({
      where: and(eq(OrgMembers.orgId, org.id), eq(OrgMembers.userId, userId)),
    });

    if (!currentMember || currentMember.role !== 'admin') {
      throw new Error('Only admins can update member roles');
    }

    // Get the member to be updated
    const memberToUpdate = await db.query.OrgMembers.findFirst({
      where: eq(OrgMembers.id, parsedInput.memberId),
      with: {
        user: true,
      },
    });

    if (!memberToUpdate || memberToUpdate.orgId !== org.id) {
      throw new Error('Member not found');
    }

    // Prevent changing the last admin to user
    if (memberToUpdate.role === 'admin' && parsedInput.role === 'user') {
      const adminCount = await db.query.OrgMembers.findMany({
        where: and(eq(OrgMembers.orgId, org.id), eq(OrgMembers.role, 'admin')),
      });

      if (adminCount.length <= 1) {
        throw new Error('Cannot change the last admin to user');
      }
    }

    // Update member role in Clerk
    const clerk = await clerkClient();
    await clerk.organizations.updateOrganizationMembership({
      organizationId: org.clerkOrgId,
      role: parsedInput.role,
      userId: memberToUpdate.userId,
    });

    // Update member role in database
    await db
      .update(OrgMembers)
      .set({
        role: parsedInput.role,
      })
      .where(eq(OrgMembers.id, parsedInput.memberId));

    revalidatePath('/app/settings/organization');

    return { success: true };
  });

// Leave organization action
export const leaveOrganizationAction = action
  .inputSchema(leaveOrganizationSchema)
  .action(async ({ parsedInput }) => {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Get the organization
    const org = await db.query.Orgs.findFirst({
      where: eq(Orgs.id, parsedInput.organizationId),
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // Get the user's membership
    const member = await db.query.OrgMembers.findFirst({
      where: and(eq(OrgMembers.orgId, org.id), eq(OrgMembers.userId, userId)),
    });

    if (!member) {
      throw new Error('You are not a member of this organization');
    }

    // Prevent the last admin from leaving
    if (member.role === 'admin') {
      const adminCount = await db.query.OrgMembers.findMany({
        where: and(eq(OrgMembers.orgId, org.id), eq(OrgMembers.role, 'admin')),
      });

      if (adminCount.length <= 1) {
        throw new Error(
          'Cannot leave organization as the last admin. Please transfer ownership or delete the organization.',
        );
      }
    }

    // Remove from database - Clerk webhooks will handle synchronization
    await db.delete(OrgMembers).where(eq(OrgMembers.id, member.id));

    revalidatePath('/app/settings/organization');

    return { success: true };
  });
