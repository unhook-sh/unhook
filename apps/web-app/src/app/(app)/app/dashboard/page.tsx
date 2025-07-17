import { Button } from '@unhook/ui/button';
import { Card } from '@unhook/ui/card';
import { Input } from '@unhook/ui/input';
import {
  BarChart3,
  ChevronDown,
  Globe,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Wallet,
} from 'lucide-react';
import { MetricsCard } from './_components/metrics-card';
import { VaultTable } from './_components/requests-table';
import { StatsChart } from './_components/stats-chart';

export default function Page() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="grid lg:grid-cols-[280px_1fr]">
        <aside className="border-r bg-background/50 backdrop-blur">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Wallet className="h-6 w-6" />
            <span className="font-bold">Vaultify</span>
          </div>
          <div className="px-4 py-4">
            <Input className="bg-background/50" placeholder="Search" />
          </div>
          <nav className="space-y-2 px-2">
            <Button className="w-full justify-start gap-2" variant="ghost">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button className="w-full justify-start gap-2" variant="ghost">
              <BarChart3 className="h-4 w-4" />
              Statistics & Income
            </Button>
            <Button className="w-full justify-start gap-2" variant="ghost">
              <Globe className="h-4 w-4" />
              Market
            </Button>
            <Button className="w-full justify-start gap-2" variant="ghost">
              <Home className="h-4 w-4" />
              Funding
            </Button>
            <Button className="w-full justify-start gap-2" variant="ghost">
              <Wallet className="h-4 w-4" />
              Yield Vaults
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
            <Button className="w-full justify-start gap-2" variant="ghost">
              <LifeBuoy className="h-4 w-4" />
              Support
            </Button>
            <Button className="w-full justify-start gap-2" variant="ghost">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </nav>
        </aside>
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Overview</h1>
              <div className="text-sm text-muted-foreground">
                Aug 13, 2023 - Aug 18, 2023
              </div>
            </div>
            <Button className="gap-2" variant="outline">
              Ethereum Network
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricsCard
              change={{
                isPositive: false,
                percentage: '-2.1%',
                value: '$1,340',
              }}
              title="Your Balance"
              value="$74,892"
            />
            <MetricsCard
              change={{
                isPositive: true,
                percentage: '+13.2%',
                value: '$1,340',
              }}
              title="Your Deposits"
              value="$54,892"
            />
            <MetricsCard
              change={{
                isPositive: true,
                percentage: '+1.2%',
                value: '$1,340',
              }}
              title="Accrued Yield"
              value="$20,892"
            />
          </div>
          <Card className="mt-6 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">General Statistics</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost">
                  Today
                </Button>
                <Button size="sm" variant="ghost">
                  Last week
                </Button>
                <Button size="sm" variant="ghost">
                  Last month
                </Button>
                <Button size="sm" variant="ghost">
                  Last 6 month
                </Button>
                <Button size="sm" variant="ghost">
                  Year
                </Button>
              </div>
            </div>
            <StatsChart />
          </Card>
          <div className="mt-6">
            <VaultTable />
          </div>
        </main>
      </div>
    </div>
  );
}
