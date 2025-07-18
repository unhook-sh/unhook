'use client';

import { useRefreshAuth, useUser } from '@clerk/nextjs/client';
import { Button } from '@unhook/ui/button';
import { Checkbox } from '@unhook/ui/checkbox';
import { Icons } from '@unhook/ui/custom/icons';
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
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { createOrgAction } from './actions';

interface NewOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewOrgDialog({ open, onOpenChange }: NewOrgDialogProps) {
  const [name, setName] = useState('');
  const [enableAutoJoiningByDomain, setEnableAutoJoiningByDomain] =
    useState(false);
  const [membersMustHaveMatchingDomain, setMembersMustHaveMatchingDomain] =
    useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { setActiveOrg, user } = useUser();
  const refreshAuth = useRefreshAuth();

  const router = useRouter();

  const { execute, status } = useAction(createOrgAction, {
    onError: (err: unknown) => {
      setErrors([
        err instanceof Error ? err.message : 'Failed to create organization',
      ]);
    },
    onSuccess: async (result) => {
      if (result.data?.success && result.data?.data?.orgId) {
        try {
          await setActiveOrg(result.data.data.orgId);
          await refreshAuth();
          router.push('/');
          onOpenChange(false);
          setName('');
          setEnableAutoJoiningByDomain(false);
          setMembersMustHaveMatchingDomain(false);
          setErrors([]);
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
    if (!user?.userId) {
      setErrors(['User not authenticated']);
      return;
    }
    execute({
      currentPath: window.location.pathname,
      domain: user.email.split('@')[1],
      enableAutoJoiningByDomain,
      membersMustHaveMatchingDomain,
      name,
      userId: user.userId,
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
              id="org-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc"
              required
              value={name}
            />
          </div>
          <div className="flex gap-2 items-center">
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
                ({user?.email.split('@')[1]})
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
                ({user?.email.split('@')[1]})
              </span>
            </Label>
          </div>
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
            <Button disabled={isLoading || !name} type="submit">
              {isLoading && <Icons.Spinner size="sm" variant="secondary" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
