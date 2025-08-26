'use client';

import { useAuth, useOrganizationList, useUser } from '@clerk/nextjs';
import {
  IconBuilding,
  IconCheck,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { MetricLink } from '@unhook/analytics/components';
import { api } from '@unhook/api/react';
import { Avatar, AvatarFallback, AvatarImage } from '@unhook/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@unhook/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@unhook/ui/sidebar';
import { ToggleGroup, ToggleGroupItem } from '@unhook/ui/toggle-group';
import {
  ArrowLeftFromLine,
  ChevronsUpDown,
  Laptop,
  MoonIcon,
  Plus,
  SunIcon,
  Users,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import posthog from 'posthog-js';
import { useState } from 'react';
import { NewOrgDialog } from './new-org-dialog';

export function NavUser() {
  const pathname = usePathname();
  const isOnboarding = pathname?.startsWith('/app/onboarding');
  const { setTheme } = useTheme();
  const _router = useRouter();
  const { user } = useUser();
  const { setActive, userMemberships } = useOrganizationList({
    userMemberships: true,
  });
  const { signOut, orgId } = useAuth();
  const { theme } = useTheme();

  const organizations = userMemberships?.data;
  const [newOrgDialogOpen, setNewOrgDialogOpen] = useState(false);

  const apiUtils = api.useUtils();

  const handleOrgChange = async (orgId: string) => {
    if (!setActive) {
      return;
    }
    await setActive({
      organization: orgId,
    });
    await apiUtils.invalidate();
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                size="lg"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.imageUrl} />
                    <AvatarFallback>
                      {user.firstName?.charAt(0) ||
                        user.emailAddresses[0]?.emailAddress.split('@')[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.firstName ||
                      user.emailAddresses[0]?.emailAddress.split('@')[0]}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-lg"
              side="top"
              sideOffset={10}
            >
              <div className="px-2 py-1.5">
                <div className="text-sm font-medium">
                  {user.firstName ||
                    user.emailAddresses[0]?.emailAddress.split('@')[0]}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.emailAddresses[0]?.emailAddress}
                </div>
              </div>
              <div className="px-2 py-1.5">
                <ToggleGroup
                  className="w-full"
                  onValueChange={(value) => value && setTheme(value)}
                  type="single"
                  value={theme}
                  variant="outline"
                >
                  <ToggleGroupItem aria-label="Light theme" value="light">
                    <SunIcon className="size-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="Dark theme" value="dark">
                    <MoonIcon className="size-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="System theme" value="system">
                    <Laptop className="size-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organizations
              </DropdownMenuLabel>
              {organizations
                ?.sort((a, b) =>
                  a.organization.name.localeCompare(b.organization.name),
                )
                .map((org) => (
                  <DropdownMenuItem
                    className="gap-2 p-2"
                    key={org.organization.id}
                    onClick={() => handleOrgChange(org.organization.id)}
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <IconBuilding className="size-4 shrink-0" />
                    </div>
                    {org.organization.name}
                    {org.organization.id === orgId && (
                      <IconCheck className="ml-auto size-4" />
                    )}
                  </DropdownMenuItem>
                ))}
              {!isOnboarding && (
                <>
                  <DropdownMenuItem
                    className="gap-2 p-2"
                    onClick={() => setNewOrgDialogOpen(true)}
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">
                      New Organization
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <MetricLink
                      href={'/app/settings/billing'}
                      metric="nav_user_billing_clicked"
                      properties={{
                        destination: '/app/settings/billing',
                        location: 'nav_user',
                      }}
                    >
                      <IconCurrencyDollar className="mr-1 size-4" />
                      <span>Billing</span>
                    </MetricLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <MetricLink
                      href={'/app/settings/organization'}
                      metric="nav_user_team_clicked"
                      properties={{
                        destination: '/app/settings/organization',
                        location: 'nav_user',
                      }}
                    >
                      <Users className="mr-1 size-4" />
                      <span>Team</span>
                    </MetricLink>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                onClick={() => {
                  // Track user logout action
                  posthog.capture('user_logout_clicked', {
                    email: user.emailAddresses[0]?.emailAddress,
                    source: 'nav_user_dropdown',
                    user_id: user.id,
                  });
                  signOut();
                }}
              >
                <ArrowLeftFromLine className="mr-1 size-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {!isOnboarding && (
        <NewOrgDialog
          onOpenChange={setNewOrgDialogOpen}
          open={newOrgDialogOpen}
        />
      )}
    </>
  );
}
