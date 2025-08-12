'use client';

import { useOrganization, useUser } from '@clerk/nextjs';
import { MetricButton } from '@unhook/analytics/components';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unhook/ui/select';
import { Skeleton } from '@unhook/ui/skeleton';
import { toast } from '@unhook/ui/sonner';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { removeMemberAction, updateMemberRoleAction } from '../actions';
import { RemoveMemberDialog } from './remove-member-dialog';

export function OrganizationMembersSection() {
  const { user } = useUser();
  const { memberships } = useOrganization({
    memberships: true,
  });

  // State for remove member dialog
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] =
    useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  // Safe actions
  const { executeAsync: executeRemoveMember, status: removeMemberStatus } =
    useAction(removeMemberAction);
  const {
    executeAsync: executeUpdateMemberRole,
    status: updateMemberRoleStatus,
  } = useAction(updateMemberRoleAction);

  const isRemovingMember = removeMemberStatus === 'executing';
  const isUpdatingRole = updateMemberRoleStatus === 'executing';

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      const result = await executeRemoveMember({ memberId: memberToRemove.id });

      if (result?.data) {
        toast.success(
          `Successfully removed ${memberToRemove.name} from the organization`,
        );
        setIsRemoveMemberDialogOpen(false);
        setMemberToRemove(null);
      } else if (result?.serverError) {
        toast.error('Failed to remove member', {
          description: result.serverError,
        });
      }
    } catch (error) {
      toast.error('Failed to remove member', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const handleUpdateMemberRole = async (
    memberId: string,
    newRole: 'admin' | 'user',
  ) => {
    try {
      const result = await executeUpdateMemberRole({
        memberId,
        role: newRole,
      });

      if (result?.data) {
        toast.success('Member role updated successfully');
      } else if (result?.serverError) {
        toast.error('Failed to update member role', {
          description: result.serverError,
        });
      }
    } catch (error) {
      toast.error('Failed to update member role', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const openRemoveMemberDialog = (member: {
    id: string;
    publicUserData?: {
      firstName?: string | null;
      lastName?: string | null;
      identifier?: string | null;
    } | null;
  }) => {
    setMemberToRemove({
      email: member.publicUserData?.identifier || 'Unknown',
      id: member.id,
      name:
        `${member.publicUserData?.firstName || ''} ${member.publicUserData?.lastName || ''}`.trim() ||
        member.publicUserData?.identifier ||
        'Unknown',
    });
    setIsRemoveMemberDialogOpen(true);
  };

  const loading = memberships?.isLoading;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div className="flex items-center justify-between" key={i}>
                  <div className="flex items-center gap-3 border-l-2 border-secondary">
                    <Skeleton className="h-4 w-32 ml-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {memberships?.data?.map((membership) => (
                <div
                  className="flex items-center justify-between"
                  key={membership.id}
                >
                  <div className="flex items-center gap-3 border-l-2 border-secondary">
                    <span className="text-sm pl-2">
                      {membership.publicUserData?.firstName}{' '}
                      {membership.publicUserData?.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {membership.publicUserData?.identifier}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      disabled={
                        isUpdatingRole ||
                        membership.publicUserData?.userId === user?.id
                      }
                      onValueChange={(value) =>
                        handleUpdateMemberRole(
                          membership.id,
                          value as 'admin' | 'user',
                        )
                      }
                      value={membership.role.split(':')[1]}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {membership.publicUserData?.userId !== user?.id && (
                      <MetricButton
                        metric="organization_members_remove_member_clicked"
                        onClick={() => openRemoveMemberDialog(membership)}
                        size="sm"
                        variant="destructive"
                      >
                        Remove
                      </MetricButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RemoveMemberDialog
        isOpen={isRemoveMemberDialogOpen}
        isRemoving={isRemovingMember}
        memberToRemove={memberToRemove}
        onClose={() => setIsRemoveMemberDialogOpen(false)}
        onConfirm={handleRemoveMember}
      />
    </>
  );
}
