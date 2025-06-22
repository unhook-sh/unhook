'use client';

import { Icons } from '@unhook/ui/custom/icons';
import { cn } from '@unhook/ui/lib/utils';
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
} from '@unhook/ui/sidebar';
import { ToggleGroup, ToggleGroupItem } from '@unhook/ui/toggle-group';
import {
  ArrowLeft,
  BookOpen,
  Code,
  ExternalLink,
  ShieldCheck,
  TestTube2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { ProjectDropdownMenu } from './project-dropdown-menu';
import { defaultSections, type SidebarSection } from './sections';
import { UserDropdownMenu } from './user-dropdown-menu';

export interface AppSidebarProps {
  sectionKeys: (keyof typeof defaultSections)[];
  showProjectSelector?: boolean;
  showEnvironmentSelector?: boolean;
  showFooter?: boolean;
  variant?: 'inset' | 'sidebar' | 'floating';
  className?: string;
  showBackButton?: boolean;
  backButtonHref?: string;
  backButtonLabel?: string;
}

export function AppSidebar({
  sectionKeys = [],
  showProjectSelector = true,
  showEnvironmentSelector = true,
  showFooter = true,
  variant = 'sidebar',
  className,
  showBackButton = false,
  backButtonHref,
  backButtonLabel = 'Back',
}: AppSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  const orgId = params.orgId as string;
  const projectId = params.projectId as string;
  const envName = params.envId as string;

  // Build sections array from keys
  const sections: SidebarSection[] = sectionKeys.map(
    (key) => defaultSections[key],
  );

  console.log('AppSidebar sections prop:', sections);

  const handleEnvironmentChange = (value: string) => {
    if (!value) return;
    const newPath = pathname.replace(`/${envName}/`, `/${value}/`);
    router.push(newPath);
  };

  return (
    <Sidebar collapsible="icon" variant={variant} className={cn(className)}>
      <SidebarHeader className="flex-row items-gap-1 items-center">
        <SidebarTrigger />
        {showBackButton ? (
          <div className="flex-1 group-data-[collapsible=icon]:hidden">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  {backButtonHref ? (
                    <Link
                      href={backButtonHref}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="size-4" />
                      <span>{backButtonLabel}</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => router.back()}
                      className="flex items-center gap-2 w-full"
                      type="button"
                    >
                      <ArrowLeft className="size-4" />
                      <span>{backButtonLabel}</span>
                    </button>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        ) : (
          showProjectSelector && (
            <div className="flex-1 group-data-[collapsible=icon]:hidden">
              <ProjectDropdownMenu />
            </div>
          )
        )}
      </SidebarHeader>

      {showEnvironmentSelector && projectId && (
        <div className="px-4 py-2">
          <ToggleGroup
            type="single"
            value={envName}
            onValueChange={handleEnvironmentChange}
            variant="outline"
            size="sm"
            className="w-full bg-muted/50 group-data-[collapsible=icon]:hidden"
          >
            <ToggleGroupItem
              value="dev"
              className="flex items-center justify-center gap-1.5 data-[state=on]:!bg-sidebar-primary data-[state=on]:!text-sidebar-primary-foreground"
            >
              <TestTube2 className="size-3.5" />
              <span>Dev</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="prod"
              className="flex items-center justify-center gap-1.5 data-[state=on]:!bg-sidebar-primary data-[state=on]:!text-sidebar-primary-foreground"
            >
              <ShieldCheck className="size-3.5" />
              <span>Prod</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label || 'unnamed-section'}>
            {section.label && (
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const resolvedUrl = item.url.replace(
                    /\${(\w+)}/g,
                    (_, key) => {
                      switch (key) {
                        case 'orgId':
                          return orgId;
                        case 'projectId':
                          return projectId;
                        case 'envName':
                          return envName;
                        default:
                          return '';
                      }
                    },
                  );
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={resolvedUrl === pathname}
                      >
                        <Link href={resolvedUrl}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {showFooter && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a
                  href="https://docs.unhook.com"
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
                  href="https://docs.unhook.com/ref/overview"
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
                  href="https://github.com/unhook/baml/blob/canary/CHANGELOG.md"
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
            <UserDropdownMenu />
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
