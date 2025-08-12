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
import { usePathname } from 'next/navigation';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    isActive?: boolean;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
                isActive={pathname.includes(item.url)}
              >
                <MetricLink
                  href={item.url}
                  metric="navigation_main_menu_clicked"
                  properties={{
                    menu_item: item.title,
                    url: item.url,
                  }}
                >
                  {item.icon && <item.icon />}
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
