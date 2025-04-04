"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Search } from "lucide-react"

import { Button } from "@acme/ui/components/button"
import { Checkbox } from "@acme/ui/components/checkbox"
import { Input } from "@acme/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/ui/components/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@acme/ui/components/collapsible"
import { cn } from "@acme/ui/lib/utils"

interface FilterAreaProps {
  className?: string
}

export function FilterArea({ className }: FilterAreaProps) {
  const [routeSearch, setRouteSearch] = useState("")

  return (
    <div className={cn("flex flex-col bg-background overflow-auto", className)}>
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button variant="outline" size="sm">
          Reset
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <Collapsible defaultOpen className="border-t">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=closed]:rotate-[-90deg]" />
              <span className="font-medium">Timeline</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0">
              <Select defaultValue="1day">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Maximum (1 day)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">Maximum (1 day)</SelectItem>
                  <SelectItem value="3days">Maximum (3 days)</SelectItem>
                  <SelectItem value="7days">Maximum (7 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen className="border-t">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=closed]:rotate-[-90deg]" />
              <span className="font-medium">Contains Level</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2 p-4 pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="warning" />
                  <label htmlFor="warning" className="text-sm">
                    Warning
                  </label>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="error" />
                  <label htmlFor="error" className="text-sm">
                    Error
                  </label>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">0</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="border-t">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
              <span className="font-medium">Environment</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0">{/* Environment filters would go here */}</div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen className="border-t">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=closed]:rotate-[-90deg]" />
              <span className="font-medium">Route</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2 p-4 pt-0">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Route..."
                  className="pl-8"
                  value={routeSearch}
                  onChange={(e) => setRouteSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="api-tunnel" />
                    <label htmlFor="api-tunnel" className="text-sm">
                      /api/tunnel
                    </label>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="null" />
                    <label htmlFor="null" className="text-sm">
                      null
                    </label>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">0</span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="border-t">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
              <span className="font-medium">Request Path</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0">{/* Request Path filters would go here */}</div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="border-t">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
              <span className="font-medium">Status Code</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0">{/* Status Code filters would go here */}</div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="border-t">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
              <span className="font-medium">Resource</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0">{/* Resource filters would go here */}</div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="border-t">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
              <span className="font-medium">Request Type</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0">{/* Request Type filters would go here */}</div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="border-t">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
              <span className="font-medium">Request Method</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0">{/* Request Method filters would go here */}</div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="border-t">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
              <span className="font-medium">Host</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0">{/* Host filters would go here */}</div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}

