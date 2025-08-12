'use client';

import { MetricButton } from '@unhook/analytics/components';
import { Checkbox } from '@unhook/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@unhook/ui/collapsible';
import { Input } from '@unhook/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from '@unhook/ui/sidebar';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';

export function FilterSidebar() {
  const [routeSearch, setRouteSearch] = useState('');

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Filters</h2>
          <MetricButton
            metric="filter_sidebar_reset_clicked"
            size="sm"
            variant="ghost"
          >
            Reset
          </MetricButton>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <Collapsible className="group/collapsible" defaultOpen>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                <span>Timeline</span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=closed]/collapsible:rotate-[-90deg]" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="p-4 pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm" htmlFor="timeline">
                      Maximum
                    </label>
                    <select
                      className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                      id="timeline"
                    >
                      <option value="1day">1 day</option>
                      <option value="3days">3 days</option>
                      <option value="7days">7 days</option>
                    </select>
                  </div>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible className="group/collapsible" defaultOpen>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                <span>Contains Level</span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=closed]/collapsible:rotate-[-90deg]" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="p-4 pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="warning" />
                      <label className="text-sm" htmlFor="warning">
                        Warning
                      </label>
                    </div>
                    <span className="text-sm text-muted-foreground">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="error" />
                      <label className="text-sm" htmlFor="error">
                        Error
                      </label>
                    </div>
                    <span className="text-sm text-muted-foreground">0</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                <span>Environment</span>
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="p-4 pt-0">
                <div className="space-y-2">
                  {/* Environment filters would go here */}
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible className="group/collapsible" defaultOpen>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                <span>Route</span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=closed]/collapsible:rotate-[-90deg]" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="p-4 pt-0">
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      onChange={(e) => setRouteSearch(e.target.value)}
                      placeholder="Search Route..."
                      value={routeSearch}
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="api-webhook" />
                        <label className="text-sm" htmlFor="api-webhook">
                          /api/webhook
                        </label>
                      </div>
                      <span className="text-sm text-muted-foreground">3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="null" />
                        <label className="text-sm" htmlFor="null">
                          null
                        </label>
                      </div>
                      <span className="text-sm text-muted-foreground">0</span>
                    </div>
                  </div>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                <span>Request Path</span>
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
          </SidebarGroup>
        </Collapsible>

        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                <span>Status Code</span>
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
          </SidebarGroup>
        </Collapsible>

        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                <span>Resource</span>
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
          </SidebarGroup>
        </Collapsible>

        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                <span>Request Type</span>
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
          </SidebarGroup>
        </Collapsible>

        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                <span>Request Method</span>
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
          </SidebarGroup>
        </Collapsible>

        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                <span>Host</span>
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  );
}
