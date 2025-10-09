'use client';

import { SidebarProvider } from '@unhook/ui/sidebar';

interface SidebarStateProviderProps {
  children: React.ReactNode;
  defaultOpen: boolean;
}

export function SidebarStateProvider({
  children,
  defaultOpen,
}: SidebarStateProviderProps) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          '--header-height': 'calc(var(--spacing) * 12)',
          '--sidebar-width': 'calc(var(--spacing) * 72)',
        } as React.CSSProperties
      }
    >
      {children}
    </SidebarProvider>
  );
}
