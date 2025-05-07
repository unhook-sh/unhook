import { SidebarProvider } from '@unhook/ui/components/sidebar';

import { SidebarInset } from '@unhook/ui/components/sidebar';
import { cookies } from 'next/headers';
import { AppSidebar } from '~/components/app-sidebar';

export default async function AppPage() {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true';
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="max-w-[calc(100vw-var(--sidebar-width))] peer-data-[collapsible=offcanvas]:peer-data-[state=collapsed]:max-w-[100vw] peer-data-[state=collapsed]:max-w-[calc(100vw-var(--sidebar-width-icon))]">
        <div className="max-w-7xl mx-auto border-x relative">
          <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
          <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
