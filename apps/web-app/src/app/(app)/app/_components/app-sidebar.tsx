'use client';

import {
  IconBrandGithub,
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSettings,
} from '@tabler/icons-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@unhook/ui/sidebar';
import type * as React from 'react';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser } from './nav-user';

const data = {
  documents: [
    {
      icon: IconDatabase,
      name: 'Data Library',
      url: '#',
    },
    {
      icon: IconReport,
      name: 'Reports',
      url: '#',
    },
    {
      icon: IconFileWord,
      name: 'Word Assistant',
      url: '#',
    },
  ],
  navClouds: [
    {
      icon: IconCamera,
      isActive: true,
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
      title: 'Capture',
      url: '#',
    },
    {
      icon: IconFileDescription,
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
      title: 'Proposal',
      url: '#',
    },
    {
      icon: IconFileAi,
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
      title: 'Prompts',
      url: '#',
    },
  ],
  navMain: [
    {
      icon: IconDashboard,
      title: 'Dashboard',
      url: '/app/dashboard',
    },
    {
      icon: IconListDetails,
      title: 'Webhooks',
      url: '/app/webhooks',
    },

    // {
    //   icon: IconFolder,
    //   title: 'Integrations',
    //   url: '/app/integrations',
    // },
    {
      icon: IconChartBar,
      title: 'API Keys',
      url: '/app/api-keys',
    },
    {
      icon: IconSettings,
      title: 'Settings',
      url: '/app/settings',
    },
  ],
  navSecondary: [
    {
      icon: IconBrandGithub,
      title: 'GitHub',
      url: 'https://github.com/unhook-sh/unhook',
    },
    {
      icon: IconFileDescription,
      title: 'Docs',
      url: '#',
    },
    // {
    //   icon: IconSearch,
    //   title: 'Search',
    //   url: '#',
    // },
  ],
  user: {
    avatar: '/avatars/shadcn.jpg',
    email: 'm@example.com',
    name: 'shadcn',
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/app/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary className="mt-auto" items={data.navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
