'use client';

import { useOrganization, useOrganizationList } from '@clerk/nextjs';
import { MetricButton } from '@unhook/analytics/components';
import { Badge } from '@unhook/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import { Skeleton } from '@unhook/ui/skeleton';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { leaveOrganizationAction } from '../actions';
import { LeaveOrganizationDialog } from './leave-organization-dialog';

export function MyOrganizationsSection() {
  const { organization: activeOrg } = useOrganization();
  const { userMemberships } = useOrganizationList({
    userMemberships: true,
  });

  // Get all organizations the user belongs to
  const organizations = userMemberships?.data || [];

  // State for leave organization dialog
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [targetOrganization, setTargetOrganization] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Safe action
  const {
    executeAsync: executeLeaveOrganization,
    status: leaveOrganizationStatus,
  } = useAction(leaveOrganizationAction);
  const isLeaving = leaveOrganizationStatus === 'executing';

  const handleLeaveOrganization = async () => {
    if (!targetOrganization) return;

    try {
      const result = await executeLeaveOrganization({
        organizationId: targetOrganization.id,
      });

      if (result?.data) {
        setIsLeaveDialogOpen(false);
        setTargetOrganization(null);
      } else if (result?.serverError) {
        // Error handling is done in the dialog component
        console.error('Failed to leave organization:', result.serverError);
      }
    } catch (error) {
      // Error handling is done in the dialog component
      console.error('Failed to leave organization:', error);
    }
  };

  const openLeaveDialog = (organization: { id: string; name: string }) => {
    setTargetOrganization(organization);
    setIsLeaveDialogOpen(true);
  };
  const loading = userMemberships.isLoading;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div className="flex items-center justify-between" key={i}>
                  <div className="flex items-center gap-3 border-l-2 border-secondary">
                    <Skeleton className="h-4 w-32 ml-2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((membership) => (
                <div
                  className="flex items-center justify-between"
                  key={membership.organization.id}
                >
                  <div className="flex items-center gap-3 border-l-2 border-secondary">
                    <span className="text-sm pl-2">
                      {membership.organization.name}
                    </span>
                    {membership.organization.id === activeOrg?.id && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {(() => {
                        const rolePart = membership.role.split(':')[1];
                        return (
                          (rolePart || 'member').charAt(0).toUpperCase() +
                          (rolePart || 'member').slice(1)
                        );
                      })()}
                    </Badge>
                    <MetricButton
                      metric="my_organizations_leave_clicked"
                      onClick={() =>
                        openLeaveDialog({
                          id: membership.organization.id,
                          name: membership.organization.name,
                        })
                      }
                      size="sm"
                      variant="destructive"
                    >
                      Leave
                    </MetricButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LeaveOrganizationDialog
        isLeaving={isLeaving}
        isOpen={isLeaveDialogOpen}
        onClose={() => {
          setIsLeaveDialogOpen(false);
          setTargetOrganization(null);
        }}
        onConfirm={handleLeaveOrganization}
        organizationName={targetOrganization?.name}
      />
    </>
  );
}
