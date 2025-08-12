'use client';

import { useOrganization, useOrganizationList } from '@clerk/nextjs';
import { MetricButton } from '@unhook/analytics/components';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@unhook/ui/command';
import { Icons } from '@unhook/ui/custom/icons';
import { cn } from '@unhook/ui/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@unhook/ui/popover';
import { ChevronsUpDown } from 'lucide-react';
import posthog from 'posthog-js';
import React from 'react';

interface OrgSelectorProps {
  onSelect?: (orgId: string) => void;
}

export function OrgSelector({ onSelect }: OrgSelectorProps) {
  const { organization: activeOrg } = useOrganization();
  const { setActive, userMemberships } = useOrganizationList({
    userMemberships: true,
  });

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string>(activeOrg?.id || '');
  const [input, setInput] = React.useState('');

  // Update value when activeOrg changes
  React.useEffect(() => {
    if (activeOrg?.id) {
      setValue(activeOrg.id);
      onSelect?.(activeOrg.id);
    }
  }, [activeOrg?.id, onSelect]);

  // Auto-select the first org if there is only one and none is selected
  React.useEffect(() => {
    if (userMemberships?.data && userMemberships.data.length === 1 && !value) {
      const firstOrg = userMemberships.data[0]?.organization;
      if (firstOrg) {
        setValue(firstOrg.id);
        if (setActive) {
          setActive({ organization: firstOrg.id });
        }
      }
      if (firstOrg?.id) {
        onSelect?.(firstOrg.id);
      }
    }
  }, [userMemberships?.data, value, setActive, onSelect]);

  const filteredOrgs = input
    ? userMemberships?.data?.filter((membership) =>
        membership.organization.name
          .toLowerCase()
          .includes(input.toLowerCase()),
      )
    : userMemberships?.data;

  // Popover width logic
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [popoverWidth, setPopoverWidth] = React.useState<string | undefined>(
    undefined,
  );
  React.useEffect(() => {
    if (open && triggerRef.current) {
      setPopoverWidth(`${triggerRef.current.offsetWidth}px`);
    }
  }, [open]);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <MetricButton
          aria-expanded={open}
          className="w-full justify-between"
          metric="auth_code_org_selector_clicked"
          ref={triggerRef}
          variant="outline"
        >
          {value
            ? userMemberships?.data?.find(
                (org) => org.organization.id === value,
              )?.organization.name
            : 'Select an organization...'}
          <ChevronsUpDown className="opacity-50 ml-2" size="sm" />
        </MetricButton>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={popoverWidth ? { width: popoverWidth } : {}}
      >
        <Command>
          <CommandInput
            onValueChange={setInput}
            placeholder="Search organizations..."
            value={input}
          />
          <CommandList>
            {/* <CommandEmpty>
              <Button
                disabled={!input.trim() || isCreating}
                onClick={async () => {
                  if (input.trim()) {
                    setIsCreating(true);
                    try {
                      const clerkOrg = await upsertOrgAction({
                        name: input.trim(),
                      });

                      if (clerkOrg?.data?.id && setActive) {
                        setActive({ organization: clerkOrg.data.id });
                        onSelect?.(clerkOrg.data.id);
                        setValue(clerkOrg.data.id);
                        setInput('');
                        setOpen(false);

                        posthog?.capture('cli_org_created', {
                          orgId: clerkOrg.data.id,
                          orgName: clerkOrg.data.name,
                        });
                      }
                    } catch (error) {
                      console.error('Failed to create organization:', error);
                      // You might want to show an error toast here
                    } finally {
                      setIsCreating(false);
                    }
                  }
                }}
              >
                {isCreating ? <Icons.Spinner /> : <Plus />}
                Create new organization:{' '}
                <span className="font-semibold">{input}</span>
              </Button>
            </CommandEmpty> */}
            <CommandGroup>
              {filteredOrgs?.map((membership) => (
                <CommandItem
                  key={membership.organization.id}
                  keywords={[membership.organization.name]}
                  onSelect={async () => {
                    setValue(membership.organization.id);
                    setInput('');
                    setOpen(false);
                    if (setActive) {
                      setActive({ organization: membership.organization });
                    }
                    onSelect?.(membership.organization.id);

                    posthog.capture('cli_org_selected', {
                      orgId: membership.organization.id,
                      orgName: membership.organization.name,
                    });
                  }}
                  value={membership.organization.id}
                >
                  {membership.organization.name}
                  <Icons.Check
                    className={cn(
                      'ml-auto',
                      value === membership.organization.id
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                    size="sm"
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function OrgSelectorProvider({ onSelect }: OrgSelectorProps) {
  return (
    <React.Suspense fallback={<div>Loading organizations...</div>}>
      <OrgSelector onSelect={onSelect} />
    </React.Suspense>
  );
}
