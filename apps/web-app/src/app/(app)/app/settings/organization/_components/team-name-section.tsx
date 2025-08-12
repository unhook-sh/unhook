'use client';

import { useOrganization } from '@clerk/nextjs';
import { MetricButton } from '@unhook/analytics/components';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import { Input } from '@unhook/ui/input';
import { toast } from '@unhook/ui/sonner';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { updateTeamNameAction } from '../actions';

export function TeamNameSection() {
  const { organization: activeOrg } = useOrganization();
  const [name, setName] = useState(activeOrg?.name || 'Personal');

  useEffect(() => {
    if (activeOrg) {
      setName(activeOrg.name);
    }
  }, [activeOrg]);

  const { executeAsync: executeUpdateTeamName, status: updateTeamNameStatus } =
    useAction(updateTeamNameAction);
  const isUpdating = updateTeamNameStatus === 'executing';

  const handleUpdateName = async () => {
    if (!name.trim() || name === activeOrg?.name) return;

    try {
      const result = await executeUpdateTeamName({ name: name.trim() });

      if (result?.data) {
        toast.success('Organization name updated successfully');
      } else if (result?.serverError) {
        toast.error('Failed to update organization name', {
          description: result.serverError,
        });
      } else if (result?.validationErrors) {
        toast.error('Invalid input', {
          description: 'Please check the organization name and try again.',
        });
      }
    } catch (error) {
      toast.error('Failed to update organization name', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdateName();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Name</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              disabled={isUpdating}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              value={name}
            />
          </div>
          <MetricButton
            disabled={isUpdating || !name.trim() || name === activeOrg?.name}
            metric="team_name_section_update_clicked"
            onClick={handleUpdateName}
          >
            {isUpdating ? 'Updating...' : 'Update Name'}
          </MetricButton>
        </div>
      </CardContent>
    </Card>
  );
}
