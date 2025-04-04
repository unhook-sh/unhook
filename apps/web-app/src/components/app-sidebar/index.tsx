'use client';

import { Icons } from '@acme/ui/custom/icons';
import { cn } from '@acme/ui/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@acme/ui/sidebar';
import { BookOpen, Code, ExternalLink, Link, Logs } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { UserDropdownMenu } from './user-dropdown-menu';

const pagesWithSecondarySidebar = ['/settings'];

export function AppSidebar() {
  const pathname = usePathname();

  // Menu items.
  const monitoringItems = [
    {
      icon: Link,
      title: 'Tunnels',
      url: '/tunnels',
    },
    {
      icon: Logs,
      title: 'Requests',
      url: '/requests',
    },
  ];

  // I don't love this, but it's a quick way to check if we're on the settings page which has it's own sidebar.
  const hasSecondarySidebar = pagesWithSecondarySidebar.some((page) =>
    pathname.includes(page),
  );

  return (
    <Sidebar
      collapsible="icon"
      variant={hasSecondarySidebar ? undefined : 'inset'}
      className={cn({
        'mt-2 pb-4 pr-4 ml-2': hasSecondarySidebar, // NOTE: This is a hack to get the sidebar to fit the design.
      })}
    >
      <SidebarHeader className="flex-row items-gap-1">
        <SidebarTrigger className="h-8 w-8" />
        <div className="flex-1 group-data-[collapsible=icon]:hidden">
          <UserDropdownMenu />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitor</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {monitoringItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.url === pathname}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* <SidebarGroup>
          <SidebarGroupLabel>Develop</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading
                ? ['skeleton-1', 'skeleton-2', 'skeleton-3'].map((id) => (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))
                : developmentItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.url === pathname}
                      >
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a
                href="https://docs.acme.com"
                target="_blank"
                className="flex items-center justify-between"
                rel="noreferrer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="size-4" />
                  <span>Docs</span>
                </span>
                <ExternalLink className="size-4" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a
                href="https://docs.acme.com/ref/overview"
                target="_blank"
                className="flex items-center justify-between"
                rel="noreferrer"
              >
                <span className="flex items-center gap-2">
                  <Code className="size-4 shrink-0" />
                  <span>API Reference</span>
                </span>
                <ExternalLink className="size-4" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a
                href="https://discord.gg/BTNBeXGuaS"
                target="_blank"
                className="flex items-center justify-between"
                rel="noreferrer"
              >
                <span className="flex items-center gap-2">
                  <Icons.Discord className="size-4" />
                  <span>Discord</span>
                </span>
                <ExternalLink className="size-4" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a
                href="https://github.com/BoundaryML/baml/blob/canary/CHANGELOG.md"
                target="_blank"
                className="flex items-center justify-between"
                rel="noreferrer"
              >
                <span className="flex items-center gap-2">
                  <Icons.Rocket className="size-4" />
                  <span>Changelog</span>
                </span>
                <ExternalLink className="size-4" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
