import {
  Code,
  FolderPlus,
  KeyRound,
  Logs,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { CreditCard } from 'lucide-react';

export interface SidebarSection {
  label?: string;
  items: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    url: string;
  }[];
}

// Example usage with default sections
export const defaultSections = {
  monitoring: {
    label: 'Monitor',
    items: [
      {
        icon: Logs,
        title: 'Function Calls',
        url: '/${orgId}/${projectId}/${envName}/function-calls',
      },
    ],
  },
  projectSettings: {
    label: 'Settings',
    items: [
      {
        icon: KeyRound,
        title: 'API Keys',
        url: '/${orgId}/${projectId}/${envName}/settings/api-keys',
      },
    ],
  },
  orgSettings: {
    label: 'Organization',
    items: [
      {
        icon: Users,
        title: 'Team Members',
        url: '/${orgId}/settings/members',
      },
      {
        icon: CreditCard,
        title: 'Billing',
        url: '/${orgId}/settings/billing',
      },
    ],
  },
  onboarding: {
    label: 'Onboarding',
    items: [
      {
        icon: Sparkles,
        title: 'Welcome',
        url: '/${orgId}/onboarding/welcome',
      },
      {
        icon: FolderPlus,
        title: 'Project Setup',
        url: '/${orgId}/onboarding/project-setup',
      },
      {
        icon: Code,
        title: 'Code Setup',
        url: '/${orgId}/onboarding/code-setup',
      },
      {
        icon: Settings,
        title: 'Editor Setup',
        url: '/${orgId}/onboarding/editor-setup',
      },
      {
        icon: Users,
        title: 'Invite Team',
        url: '/${orgId}/onboarding/invite-team',
      },
      {
        icon: CreditCard,
        title: 'Billing',
        url: '/${orgId}/onboarding/billing',
      },
    ],
  },
};
