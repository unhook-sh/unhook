'use client';

import { cn } from '@unhook/ui/lib/utils';
import { motion } from 'motion/react';

interface PricingTabsProps {
  activeTab: 'yearly' | 'monthly';
  setActiveTab: (tab: 'yearly' | 'monthly') => void;
  className?: string;
}

export function PricingTabs({
  activeTab,
  setActiveTab,
  className,
}: PricingTabsProps) {
  return (
    <div
      className={cn(
        'relative flex w-fit items-center rounded-full border p-0.5 backdrop-blur-sm cursor-pointer h-9 flex-row bg-muted',
        className,
      )}
    >
      {['monthly', 'yearly'].map((tab) => (
        <button
          className={cn(
            'relative z-[1] px-2 h-8 flex items-center justify-center cursor-pointer',
            {
              'z-0': activeTab === tab,
            },
          )}
          key={tab}
          onClick={() => setActiveTab(tab as 'yearly' | 'monthly')}
          type="button"
        >
          {activeTab === tab && (
            <motion.div
              className="absolute inset-0 rounded-full bg-white dark:bg-[#3F3F46] shadow-md border border-border"
              layoutId="active-tab"
              transition={{
                damping: 25,
                duration: 0.2,
                stiffness: 300,
                type: 'spring',
                velocity: 2,
              }}
            />
          )}
          <span
            className={cn(
              'relative block text-sm font-medium duration-200 shrink-0',
              activeTab === tab ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'yearly' && (
              <span className="ml-2 text-xs font-semibold text-primary bg-secondary/50 py-0.5 w-[calc(100%+1rem)] px-1 rounded-full">
                2 months free
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
