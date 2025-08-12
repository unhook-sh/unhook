'use client';

import { MetricLink } from '@unhook/analytics';
import { Tabs, TabsList, TabsTrigger } from '@unhook/ui/tabs';
import { usePathname } from 'next/navigation';

const settingsTabs = [
  {
    href: '/app/settings/organization',
    label: 'Organization',
    value: 'organization',
  },
  {
    href: '/app/settings/billing',
    label: 'Billing',
    value: 'billing',
  },
  // {
  //   href: '/app/settings/referrals',
  //   label: 'Referrals',
  //   value: 'referrals',
  // },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determine the active tab based on the current pathname
  const activeTab =
    settingsTabs.find(
      (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`),
    )?.value || 'team';

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="text-2xl font-bold">Settings</div>
        <div className="text-sm text-muted-foreground">
          Manage your team plan, billing, and referrals.
        </div>
      </div>

      <Tabs value={activeTab}>
        <TabsList>
          {settingsTabs.map((tab) => (
            <TabsTrigger
              asChild
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              key={tab.value}
              value={tab.value}
            >
              <MetricLink
                href={tab.href}
                metric="navigation_settings_tab_clicked"
                properties={{
                  tab_name: tab.label,
                  tab_value: tab.value,
                }}
              >
                {tab.label}
              </MetricLink>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex-1">{children}</div>
    </div>
  );
}
