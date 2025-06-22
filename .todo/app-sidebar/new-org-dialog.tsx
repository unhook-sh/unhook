'use client';

import { useRefreshAuth, useUser } from '@clerk/nextjs/client';
import { Button } from '@unhook/ui/button';
import { Checkbox } from '@unhook/ui/checkbox';
import { Label } from '@unhook/ui/components/label';
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
    onError: (err: unknown) => {
      setErrors([
        err instanceof Error ? err.message : 'Failed to create organization',
      ]);
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
      userId: user.userId,
      domain: user.email.split('@')[1],
      name,
      enableAutoJoiningByDomain,
      membersMustHaveMatchingDomain,
      currentPath: window.location.pathname,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <Label htmlFor="org-name" className="block mb-2">
              Organization Name
            </Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc"
              required
              autoFocus
            />
          </div>
          <div className="flex gap-2 items-center">
            <Checkbox
              id="auto-join"
              checked={enableAutoJoiningByDomain}
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
              id="restrict-domain"
              checked={membersMustHaveMatchingDomain}
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
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading && <Icons.Spinner size="sm" variant="secondary" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
