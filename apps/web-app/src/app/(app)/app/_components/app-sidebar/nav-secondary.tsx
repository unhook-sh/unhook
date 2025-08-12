'use client';

import type { Icon } from '@tabler/icons-react';
import { MetricLink } from '@unhook/analytics';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@unhook/ui/sidebar';
import type * as React from 'react';

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: Icon;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <MetricLink
                  href={item.url}
                  metric="navigation_external_link_clicked"
                  properties={{
                    link_title: item.title,
                    url: item.url,
                  }}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </MetricLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
