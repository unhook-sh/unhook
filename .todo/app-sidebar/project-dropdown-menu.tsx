'use client';

import { useUser } from '@clerk/nextjs/client';
import { useApi } from '@unhook/api/client';
import { Icons } from '@unhook/ui/custom/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@unhook/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@unhook/ui/sidebar';
import { Skeleton } from '@unhook/ui/skeleton';
import { ChevronDown, FolderKanban } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { NewProjectDialog } from '~/components/app-sidebar/new-project-dialog';
import { useProject } from '~/providers/project-provider';

export function ProjectDropdownMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const api = useApi();
  const { isMobile } = useSidebar();
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const projects = api.listProjects.useSuspenseQuery({
    org_id: user?.getActiveOrg()?.orgId ?? '',
  });

  const { project: currentProject, isLoading } = useProject();

  const handleProjectChange = async (projectId: string) => {
    const orgId = user?.getActiveOrg()?.orgId;
    if (!orgId) return;
    const segments = pathname.split('/');
    if (segments.length < 3) return;
    segments[2] = projectId;
    const newPath = segments.join('/');
    router.push(newPath);
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {isLoading && <Skeleton className="w-24 h-4" />}
                  {!isLoading && (
                    <span className="truncate font-semibold">
                      {currentProject?.project_slug || 'No project selected'}
                    </span>
                  )}
                </div>
                <ChevronDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <div className="px-2 py-1.5 text-xs text-muted-foreground font-semibold select-none">
                Projects
              </div>
              {projects.data?.projects.map((project) => (
                <DropdownMenuItem
                  className="gap-2 p-2 max-w-full"
                  key={project.project_id}
                  onClick={() => handleProjectChange(project.project_id)}
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <FolderKanban className="size-4 shrink-0" />
                  </div>
                  <span className="truncate">{project.project_slug}</span>
                  {project.project_id === currentProject?.project_id && (
                    <Icons.Check className="ml-auto size-4" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setNewProjectDialogOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Icons.Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  New Project
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <NewProjectDialog
        onOpenChange={setNewProjectDialogOpen}
        open={newProjectDialogOpen}
        orgId={user?.getActiveOrg()?.orgId ?? ''}
      />
    </>
  );
}
