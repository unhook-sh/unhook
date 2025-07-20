'use client';

import { useOrganizationList, useUser } from '@clerk/nextjs';
import { IconLoader2 } from '@tabler/icons-react';
import { api } from '@unhook/api/react';
import {
  Entitled,
  NotEntitled,
  useIsEntitled,
} from '@unhook/stripe/guards/client';
import { Button } from '@unhook/ui/button';
import { P } from '@unhook/ui/custom/typography';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@unhook/ui/dialog';
import { Input } from '@unhook/ui/input';
import { Label } from '@unhook/ui/label';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { createOrgAction } from './actions';

interface NewOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewOrgDialog({ open, onOpenChange }: NewOrgDialogProps) {
  const [name, setName] = useState('');
  const { setActive, userMemberships } = useOrganizationList({
    userMemberships: true,
  });
  const [enableAutoJoiningByDomain, setEnableAutoJoiningByDomain] =
    useState(false);
  const [membersMustHaveMatchingDomain, setMembersMustHaveMatchingDomain] =
    useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { user } = useUser();
  const isEntitled = useIsEntitled('unlimited_developers');

  const apiUtils = api.useUtils();

  const { execute, status } = useAction(createOrgAction, {
    onError: (err: unknown) => {
      setErrors([
        err instanceof Error ? err.message : 'Failed to create organization',
      ]);
    },
    onSuccess: async (result) => {
      if (result.data?.success && result.data?.data?.org.id) {
        try {
          if (!setActive) return;

          await setActive({
            organization: result.data.data.org.id,
          });
          onOpenChange(false);
          setName('');
          setEnableAutoJoiningByDomain(false);
          setMembersMustHaveMatchingDomain(false);
          setErrors([]);
          apiUtils.invalidate();
          userMemberships.revalidate();
        } catch (error) {
          setErrors([
            error instanceof Error
              ? error.message
              : 'Failed to set active organization',
          ]);
        }
      } else {
        const errorData = result.data?.error;
        if (Array.isArray(errorData)) {
          setErrors(
            errorData.filter(
              (error): error is string => typeof error === 'string',
            ),
          );
        } else {
          setErrors([errorData ?? 'Failed to create organization']);
        }
      }
    },
  });

  const isLoading = status === 'executing';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    if (!user?.id) {
      setErrors(['User not authenticated']);
      return;
    }
    execute({
      currentPath: window.location.pathname,
      domain: user.emailAddresses[0]?.emailAddress.split('@')[1],
      enableAutoJoiningByDomain,
      membersMustHaveMatchingDomain,
      name,
      userId: user.id,
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Organization</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div>
            <Label className="block mb-2" htmlFor="org-name">
              Organization Name
            </Label>
            <Input
              autoFocus
              disabled={isLoading || !isEntitled}
              id="org-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc"
              required
              value={name}
            />
          </div>
          {/* <div className="flex gap-2 items-center">
            <Checkbox
              checked={enableAutoJoiningByDomain}
              id="auto-join"
              onCheckedChange={(checked) =>
                setEnableAutoJoiningByDomain(!!checked)
              }
            />
            <Label htmlFor="auto-join">
              Allow users to join by domain{' '}
              <span className="text-muted-foreground">
                ({user?.emailAddresses[0]?.emailAddress.split('@')[1]})
              </span>
            </Label>
          </div>
          <div className="flex gap-2 items-center">
            <Checkbox
              checked={membersMustHaveMatchingDomain}
              id="restrict-domain"
              onCheckedChange={(checked) =>
                setMembersMustHaveMatchingDomain(!!checked)
              }
            />
            <Label htmlFor="restrict-domain">
              Only allow users with matching domain{' '}
              <span className="text-muted-foreground">
                ({user?.emailAddresses[0]?.emailAddress.split('@')[1]})
              </span>
            </Label>
          </div> */}
          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((error) => (
                <P key={`error-${error}`} variant="destructive">
                  {error}
                </P>
              ))}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Entitled entitlement="unlimited_developers">
              <Button disabled={isLoading || !name} type="submit">
                {isLoading && (
                  <IconLoader2 className="text-secondary" size="sm" />
                )}
                Create
              </Button>
            </Entitled>
            <NotEntitled entitlement="unlimited_developers">
              <Button asChild>
                <Link href="/app/settings/billing">
                  Upgrade to create organizations
                </Link>
              </Button>
            </NotEntitled>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
