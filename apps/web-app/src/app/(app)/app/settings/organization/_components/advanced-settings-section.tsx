'use client';

import { MetricButton } from '@unhook/analytics/components';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { deleteTeamAction } from '../actions';
import { DeleteOrganizationDialog } from './delete-organization-dialog';

export function AdvancedSettingsSection() {
  // State for delete organization dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Safe action
  const { executeAsync: executeDeleteTeam, status: deleteTeamStatus } =
    useAction(deleteTeamAction);
  const isDeleting = deleteTeamStatus === 'executing';

  const handleDeleteOrganization = async () => {
    try {
      const result = await executeDeleteTeam({ confirm: true });

      if (result?.data) {
        setIsDeleteDialogOpen(false);
        // The action will redirect to dashboard
      } else if (result?.serverError) {
        // Error handling is done in the dialog component
        console.error('Failed to delete organization:', result.serverError);
      }
    } catch (error) {
      // Error handling is done in the dialog component
      console.error('Failed to delete organization:', error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <CardTitle className="text-lg">Delete Organization</CardTitle>
              <CardDescription className="mt-2">
                This action cannot be undone. This will permanently delete your
                organization and remove all data.
              </CardDescription>
            </div>
            <MetricButton
              metric="advanced_settings_delete_organization_clicked"
              onClick={() => setIsDeleteDialogOpen(true)}
              variant="destructive"
            >
              Delete Organization
            </MetricButton>
          </div>
        </CardContent>
      </Card>

      <DeleteOrganizationDialog
        isDeleting={isDeleting}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteOrganization}
      />
    </>
  );
}
