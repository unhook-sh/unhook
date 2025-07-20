'use client';

import { AdvancedSettingsSection } from './advanced-settings-section';
import { InviteMembersSection } from './invite-members-section';
import { MyOrganizationsSection } from './my-organizations-section';
import { OrganizationMembersSection } from './organization-members-section';
import { TeamNameSection } from './team-name-section';

export function OrganizationSettings() {
  return (
    <div className="space-y-6">
      <TeamNameSection />
      <InviteMembersSection />
      <OrganizationMembersSection />
      <MyOrganizationsSection />
      <AdvancedSettingsSection />
    </div>
  );
}
