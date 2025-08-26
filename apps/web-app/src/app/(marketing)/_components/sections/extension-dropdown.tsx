'use client';

import { MetricLink } from '@unhook/analytics/components';
import { Button } from '@unhook/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@unhook/ui/dropdown-menu';
import { ChevronDown, Download } from 'lucide-react';

function getBrandLogoUrl(domain: string) {
  return `https://cdn.brandfetch.io/${domain}/w/60/h/60?c=1idGJK6TyS2PPBb74bA`;
}

interface ExtensionOption {
  name: string;
  logoUrl: string;
  url: string;
  description: string;
}

interface ExtensionDropdownProps {
  variant?: 'default' | 'compact';
}

const extensionOptions: ExtensionOption[] = [
  {
    description: 'Visual Studio Code',
    logoUrl: getBrandLogoUrl('vscode.dev'),
    name: 'VS Code',
    url: 'https://marketplace.visualstudio.com/items?itemName=unhook.unhook-vscode',
  },
  {
    description: 'AI-powered code editor',
    logoUrl: getBrandLogoUrl('cursor.com'),
    name: 'Cursor',
    url: 'https://open-vsx.org/extension/unhook/unhook-vscode',
  },
  {
    description: 'Open VSX marketplace',
    logoUrl: getBrandLogoUrl('windsurf.com'),
    name: 'Windsurf',
    url: 'https://open-vsx.org/extension/unhook/unhook-vscode',
  },
];

export function ExtensionDropdown({
  variant = 'default',
}: ExtensionDropdownProps) {
  const isCompact = variant === 'compact';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={`bg-secondary flex items-center gap-2 text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12] hover:bg-secondary/80 transition-all ease-out active:scale-95 ${
            isCompact ? 'h-8 w-fit px-4' : 'h-9 w-48 px-4'
          }`}
        >
          {!isCompact && <Download className="size-4" />}
          {isCompact ? 'Install Extension' : 'Install Extension'}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56 p-2" sideOffset={8}>
        {extensionOptions.map((option) => (
          <DropdownMenuItem asChild key={option.name}>
            <MetricLink
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              href={option.url}
              metric="hero_extension_install_clicked"
              properties={{
                extension_name: option.name,
                location: 'hero_section',
                source: 'marketing_site',
              }}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent overflow-hidden">
                {/** biome-ignore lint/performance/noImgElement: don't remove this */}
                <img
                  alt={`${option.name} logo`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to a simple colored background if logo fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    // biome-ignore lint/style/noNonNullAssertion: don't remove this
                    target.parentElement!.style.backgroundColor =
                      'hsl(var(--accent))';
                  }}
                  src={option.logoUrl}
                />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium text-sm">{option.name}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
            </MetricLink>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
