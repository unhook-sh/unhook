import { SidebarProvider } from '@unhook/ui/components/sidebar';

import { SidebarInset } from '@unhook/ui/components/sidebar';
import { cookies } from 'next/headers';
import type { PropsWithChildren } from 'react';
import { AppSidebar } from '~/app/(app)/_components/app-sidebar';

export async function AppLayout(props: PropsWithChildren) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="max-w-[calc(100vw-var(--sidebar-width))] peer-data-[collapsible=offcanvas]:peer-data-[state=collapsed]:max-w-[100vw] peer-data-[state=collapsed]:max-w-[calc(100vw-var(--sidebar-width-icon))]">
        {props.children}
      </SidebarInset>
    </SidebarProvider>
  );
}
