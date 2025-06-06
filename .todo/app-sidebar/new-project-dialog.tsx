'use client';

import { useUser } from '@clerk/nextjs/client';
import { useApi } from '@unhook/api/client';
import { Alert, AlertDescription, AlertTitle } from '@unhook/ui/alert';
import { Button } from '@unhook/ui/button';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Icons } from '@unhook/ui/custom/icons';
import { P } from '@unhook/ui/custom/typography';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@unhook/ui/dialog';
import { Input } from '@unhook/ui/input';
import { Label } from '@unhook/ui/label';
import { toast } from '@unhook/ui/sonner';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createApiKey } from './actions';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}

interface SuccessState {
  keyId: string;
  keyToken: string;
  name: string;
}

export function NewProjectDialog({
  open,
  onOpenChange,
  orgId,
}: NewProjectDialogProps) {
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'project' | 'api-key'>('project');
  const [keyName, setKeyName] = useState('');
  const [keyError, setKeyError] = useState('');
  const [successState, setSuccessState] = useState<SuccessState | null>(null);
  const router = useRouter();
  const api = useApi();
  const user = useUser();

  const createProject = api.createProject.useMutation({
    onSuccess: async () => {
      await api.listProjects.invalidate({ org_id: orgId });
      setStep('api-key');
    },
  });

  const { execute: executeCreateKey, status: createKeyStatus } = useAction(
    createApiKey,
    {
      onSuccess: async (result) => {
        if (result.data?.success && result.data.data) {
          const apiKeyToken = result.data.data.apiKeyToken;
          if (!apiKeyToken) {
            toast.error('Failed to get API key value');
            handleClose();
            return;
          }

          setSuccessState({
            keyId: result.data.data.apiKeyId,
            keyToken: apiKeyToken,
            name: keyName,
          });

          toast.success('API key created successfully');
        }
        setKeyName('');
        setKeyError('');
      },
      onError: (error) => {
        console.error(error);
        toast.error('Failed to create API key');
      },
    },
  );

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    await createProject.mutateAsync({
      org_id: orgId,
      project_slug: name.toLowerCase().replace(/ /g, '_'),
      environments: ['dev', 'prod'],
    });
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyName.trim()) {
      setKeyError('Key name is required');
      return;
    }

    if (!user.user?.userId) {
      toast.error('Failed to get user ID');
      return;
    }
    if (!createProject.data?.project) {
      toast.error('Failed to get project');
      return;
    }
    if (!createProject.data?.project.environments[0]) {
      toast.error('Failed to get environment');
      return;
    }

    executeCreateKey({
      orgId,
      metadata: {
        name: keyName,
        userId: user.user.userId,
        envId: createProject.data?.project.environments[0],
        projectId: createProject.data?.project.project_id,
      },
      currentPath: window.location.pathname,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setName('');
    setErrors([]);
    setKeyName('');
    setKeyError('');
    setSuccessState(null);
    setStep('project');
  };

  const handleFinish = () => {
    if (createProject.data?.project) {
      router.push(
        `/${orgId}/${createProject.data.project.project_id}/${createProject.data.project.environments[0]}`,
      );
    }
    handleClose();
  };

  const isLoading =
    createProject.status === 'pending' || createKeyStatus === 'executing';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {step === 'project' ? (
          <>
            <DialogHeader>
              <DialogTitle>New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProjectSubmit} className="grid gap-4">
              <div>
                <Label htmlFor="project-name" className="block mb-2">
                  Project Name
                </Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Project"
                  required
                  autoFocus
                />
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
                  {isLoading && <Icons.Spinner size="sm" />}
                  Next
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : successState ? (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <Alert className="border-warning/50 bg-warning/10 text-warning">
                <Icons.AlertTriangle />
                <AlertTitle>Important - One-time Display</AlertTitle>
                <AlertDescription>
                  Make sure to copy your API key now. You won't be able to see
                  it again.
                </AlertDescription>
              </Alert>

              <div className="grid gap-2">
                <Label>API Key</Label>
                <div className="relative flex items-center">
                  <code className="w-full break-all rounded-md bg-muted pr-12 p-3 text-sm">
                    {successState.keyToken}
                  </code>
                  <div className="absolute right-2 top-2">
                    <CopyButton
                      text={successState.keyToken}
                      variant="outline"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleFinish} variant="destructive">
                I've copied the key
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleKeySubmit}>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create an API key for your new project. Give it a descriptive
                name to help you identify its usage.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Key name</Label>
                <Input
                  id="name"
                  value={keyName}
                  onChange={(e) => {
                    setKeyName(e.target.value);
                    setKeyError('');
                  }}
                  placeholder="e.g., Development Key, Production Key"
                />
                {keyError && (
                  <p className="text-sm text-destructive">{keyError}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('project')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create key'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
