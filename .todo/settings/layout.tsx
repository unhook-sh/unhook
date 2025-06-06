import { SidebarInset, SidebarProvider } from '@unhook/ui/sidebar';
import { cookies } from 'next/headers';
import { AppSidebar } from '~/app/(app)/_components/app-sidebar';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: SettingsLayoutProps) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <div className="h-full">
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar
          sectionKeys={['orgSettings']}
          showEnvironmentSelector={false}
          showProjectSelector={false}
          showBackButton
          backButtonHref="/"
          backButtonLabel="Back to Dashboard"
          variant="inset"
        />
        <SidebarInset className="max-w-[calc(100vw-var(--sidebar-width))] peer-data-[collapsible=offcanvas]:peer-data-[state=collapsed]:max-w-[100vw] peer-data-[state=collapsed]:max-w-[calc(100vw-var(--sidebar-width-icon))]">
          <div className="flex-1 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
