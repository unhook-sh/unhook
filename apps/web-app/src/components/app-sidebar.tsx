"use client";

import { useParams, usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  ChevronDown,
  ChevronUp,
  Code,
  ExternalLink,
  LayoutDashboard,
  Logs,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  SquareFunction,
  TestTube2,
  User2,
  Users,
  Workflow,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Icons } from "@acme/ui/icons";
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
  SidebarMenuSkeleton,
  SidebarSeparator,
  SidebarTrigger,
} from "@acme/ui/sidebar";

export function AppSidebar() {
  const params = useParams();
  const pathname = usePathname();

  const projectId = params.projectId as string;
  const environmentId = params.environmentId as string;

  if (!projectId || !environmentId) {
    return (
      <SidebarMenu>
        {Array.from({ length: 5 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuSkeleton />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  // Menu items.
  const monitoringItems = [
    {
      icon: LayoutDashboard,
      title: "Dashboard",
      url: `/projects/${projectId}/environments/${environmentId}/dashboard`,
    },
    {
      icon: Logs,
      title: "Logs",
      url: `/projects/${projectId}/environments/${environmentId}/logs`,
    },
    {
      icon: Users,
      title: "Users",
      url: `/projects/${projectId}/environments/${environmentId}/users`,
    },
  ];
  const developmentItems = [
    {
      icon: Sparkles,
      title: "Prompts",
      url: `/projects/${projectId}/environments/${environmentId}/prompts`,
    },
    {
      icon: Bot,
      title: "Agents",
      url: `/projects/${projectId}/environments/${environmentId}/agents`,
    },
    {
      icon: Workflow,
      title: "Workflows",
      url: `/projects/${projectId}/environments/${environmentId}/workflows`,
    },
    {
      icon: SquareFunction,
      title: "Tools",
      url: `/projects/${projectId}/environments/${environmentId}/tools`,
    },
    {
      icon: ShieldCheck,
      title: "Guardrails",
      url: `/projects/${projectId}/environments/${environmentId}/guardrails`,
    },
    {
      icon: TestTube2,
      title: "Tests",
      url: `/projects/${projectId}/environments/${environmentId}/tests`,
    },
    {
      icon: PlayCircle,
      title: "Playground",
      url: `/projects/${projectId}/environments/${environmentId}/playground`,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex-row items-center gap-2">
        <SidebarTrigger className="h-8 w-8" />
        <SidebarMenu className="group-data-[collapsible=icon]:hidden">
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  BoundaryML
                  <ChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem>
                  <span>Acme Inc</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Acme Corp.</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
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
        <SidebarGroup>
          <SidebarGroupLabel>Develop</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {developmentItems.map((item) => (
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
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a
                href="https://docs.boundary.ml"
                target="_blank"
                className="flex items-center justify-between"
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
                href="https://docs.boundary.ml"
                target="_blank"
                className="flex items-center justify-between"
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
                href="https://discord.gg/boundary"
                target="_blank"
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Icons.Discord className="size-4" />
                  <span>Community</span>
                </span>
                <ExternalLink className="size-4" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> seawatts
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
