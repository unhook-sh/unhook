'use client';

import { useOrganization, useUser } from '@clerk/nextjs';
import { MetricButton, MetricLink } from '@unhook/analytics/components';
import {
  Entitled,
  NotEntitled,
  useIsEntitled,
} from '@unhook/stripe/guards/client';
import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import { Input } from '@unhook/ui/input';
import { Label } from '@unhook/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unhook/ui/select';
import { toast } from '@unhook/ui/sonner';
import { useState } from 'react';

export function InviteMembersSection() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [isInviting, setIsInviting] = useState(false);
  const [isRevokingInvitation, setIsRevokingInvitation] = useState(false);

  const { organization, invitations } = useOrganization({
    invitations: true,
  });
  const { user } = useUser();
  const isEntitled = useIsEntitled('unlimited_developers');

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!organization) {
      toast.error('No organization found');
      return;
    }

    // Check if user is admin
    const organizationId = organization.id;
    const { data: organizationMemberships } =
      (await user?.getOrganizationMemberships()) || { data: [] };
    const currentMembership = organizationMemberships?.find(
      (membership) => membership.organization.id === organizationId,
    );

    if (!currentMembership || currentMembership.role !== 'org:admin') {
      toast.error('Only admins can invite members');
      return;
    }

    setIsInviting(true);

    try {
      await organization.inviteMember({
        emailAddress: email.trim(),
        role: role === 'admin' ? 'org:admin' : 'org:member',
      });

      toast.success(`Invitation sent to ${email}`);
      setEmail('');
      setRole('user');

      // Refresh invitations list
      invitations?.revalidate?.();
    } catch (error) {
      console.error('Failed to send invitation:', error);

      // Handle specific Clerk errors
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          toast.error(
            'A user with this email is already a member of this organization.',
          );
        } else if (error.message.includes('Forbidden')) {
          toast.error(
            'You do not have permission to invite members to this organization.',
          );
        } else if (error.message.includes('Not Found')) {
          toast.error(
            'Organization not found. Please ensure you have proper permissions.',
          );
        } else {
          toast.error('Failed to send invitation', {
            description: error.message,
          });
        }
      } else {
        toast.error('Failed to send invitation', {
          description: 'An unexpected error occurred',
        });
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeInvitation = async (invitation: {
    id: string;
    emailAddress: string;
    revoke: () => Promise<unknown>;
  }) => {
    setIsRevokingInvitation(true);

    try {
      await invitation.revoke();
      toast.success(
        `Successfully revoked invitation for ${invitation.emailAddress}`,
      );

      // Refresh invitations list
      invitations?.revalidate?.();
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
      toast.error('Failed to revoke invitation', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsRevokingInvitation(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInvite();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Invite Members</CardTitle>
            <Badge className="text-xs" variant="secondary">
              Paid Plan Required
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 justify-between">
            <div className="flex-1 gap-2 grid">
              <Label htmlFor="email">Email</Label>
              <Input
                disabled={isInviting || !isEntitled}
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="jane@example.com"
                value={email}
              />
            </div>
            <div className="w-fit gap-2 grid">
              <Label htmlFor="role">Role</Label>
              <Select
                disabled={isInviting || !isEntitled}
                onValueChange={(value) => setRole(value as 'admin' | 'user')}
                value={role}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Entitled entitlement="unlimited_developers">
            <MetricButton
              disabled={isInviting || !email.trim()}
              metric="invite_members_section_invite_clicked"
              onClick={handleInvite}
              properties={{
                location: 'invite_members_section',
              }}
            >
              {isInviting ? 'Sending...' : 'Invite'}
            </MetricButton>
          </Entitled>
          <NotEntitled entitlement="unlimited_developers">
            <Button asChild>
              <MetricLink
                href="/app/settings/billing"
                metric="invite_members_section_upgrade_clicked"
                properties={{
                  destination: '/app/settings/billing',
                  location: 'invite_members_section',
                }}
              >
                Upgrade to invite members
              </MetricLink>
            </Button>
          </NotEntitled>
        </CardContent>
      </Card>

      {!invitations?.isLoading &&
        invitations?.data &&
        invitations.data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invitations.data.map((invitation) => (
                  <div
                    className="flex items-center justify-between"
                    key={invitation.id}
                  >
                    <div className="flex items-center gap-3 border-l-2 border-muted">
                      <span className="text-sm pl-2">
                        {invitation.emailAddress}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {invitation.role.split(':')[1]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Invited{' '}
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MetricButton
                        disabled={isRevokingInvitation}
                        metric="invite_members_section_revoke_clicked"
                        onClick={() => handleRevokeInvitation(invitation)}
                        properties={{
                          location: 'invite_members_section',
                        }}
                        size="sm"
                        variant="destructive"
                      >
                        Revoke
                      </MetricButton>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
