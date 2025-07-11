'use client';

import { Icons } from '@unhook/ui/custom/icons';
import { cn } from '@unhook/ui/lib/utils';
import { Icons as MarketingIcons } from './icons';

interface WebhookFlowGraphicProps {
  provider?: 'stripe' | 'github' | 'clerk' | 'slack';
  className?: string;
}

const providerConfig = {
  clerk: {
    color: '#6C47FF',
    icon: Icons.Clerk,
    name: 'Clerk',
  },
  github: {
    color: '#ffffff',
    icon: Icons.Github,
    name: 'GitHub',
  },
  slack: {
    color: '#4A154B',
    icon: Icons.Slack,
    name: 'Slack',
  },
  stripe: {
    color: '#635BFF',
    icon: Icons.Stripe,
    name: 'Stripe',
  },
} as const;

export function WebhookFlowGraphic({
  provider = 'stripe',
  className,
}: WebhookFlowGraphicProps) {
  const ProviderIcon = providerConfig[provider].icon;
  const providerName = providerConfig[provider].name;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 shadow-2xl',
        className,
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent)]" />

      <div className="relative">
        {/* Header text */}
        <h3 className="mb-8 text-2xl font-semibold text-white">
          Connect from {providerName}
        </h3>

        <p className="mb-12 text-zinc-400">
          Route webhooks from {providerName} to your local development
          environment with a single command.
        </p>

        {/* Main flow visualization */}
        <div className="flex items-center justify-between gap-8">
          {/* Provider section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/10 blur-xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-zinc-800 shadow-lg ring-1 ring-white/10">
                <ProviderIcon className="h-12 w-12 text-white" />
              </div>
            </div>
            <span className="text-sm font-medium text-zinc-400">
              {providerName}
            </span>
          </div>

          {/* Connection arrow */}
          <div className="flex flex-1 items-center">
            <div className="relative h-px w-full bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700">
              <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-zinc-600" />
              <div className="absolute right-0 top-1/2 h-0 w-0 -translate-y-1/2 border-y-4 border-l-8 border-y-transparent border-l-zinc-600" />
              {/* Animated dots */}
              <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 animate-pulse rounded-full bg-white shadow-lg shadow-white/50" />
              <div className="absolute left-1/3 top-1/2 h-2 w-2 -translate-y-1/2 animate-pulse rounded-full bg-white/60 shadow-lg shadow-white/30 [animation-delay:0.5s]" />
              <div className="absolute left-2/3 top-1/2 h-2 w-2 -translate-y-1/2 animate-pulse rounded-full bg-white/30 shadow-lg shadow-white/20 [animation-delay:1s]" />
            </div>
          </div>

          {/* Unhook section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-2xl bg-purple-500/20 blur-xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-zinc-800 shadow-lg ring-1 ring-white/10">
                <MarketingIcons.logo className="h-12 w-auto" />
              </div>
            </div>
            <span className="text-sm font-medium text-zinc-400">Unhook</span>
          </div>
        </div>

        {/* Code preview */}
        <div className="mt-12 rounded-lg bg-zinc-950/50 p-4 font-mono text-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="text-pink-400">import</span>
            <span className="text-white">webhookHandler</span>
            <span className="text-pink-400">from</span>
            <span className="text-green-400">
              '@{providerName.toLowerCase()}/webhooks'
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-zinc-500">
            <span className="text-pink-400">import</span>
            <span className="text-white">{'{ route }'}</span>
            <span className="text-pink-400">from</span>
            <span className="text-green-400">'@unhook/client'</span>
          </div>
        </div>
      </div>
    </div>
  );
}
