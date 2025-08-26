'use client';

import { SidebarProvider } from '@unhook/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SidebarStateProviderProps {
  children: React.ReactNode;
  defaultOpen: boolean;
}

export function SidebarStateProvider({
  children,
  defaultOpen,
}: SidebarStateProviderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    // Check if we're on the onboarding route
    const isOnboardingRoute = pathname.includes('/onboarding');

    // Default sidebar to closed on onboarding routes
    if (isOnboardingRoute) {
      setIsOpen(false);
    } else {
      setIsOpen(defaultOpen);
    }
  }, [pathname, defaultOpen]);

  return (
    <SidebarProvider
      defaultOpen={isOpen}
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
