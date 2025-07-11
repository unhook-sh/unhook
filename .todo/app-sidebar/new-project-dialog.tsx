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
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
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
      onError: (error) => {
        console.error(error);
        toast.error('Failed to create API key');
      },
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
    },
  );

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    await createProject.mutateAsync({
      environments: ['dev', 'prod'],
      org_id: orgId,
      project_slug: name.toLowerCase().replace(/ /g, '_'),
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
      currentPath: window.location.pathname,
      metadata: {
        envId: createProject.data?.project.environments[0],
        name: keyName,
        projectId: createProject.data?.project.project_id,
        userId: user.user.userId,
      },
      orgId,
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
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        {step === 'project' ? (
          <>
            <DialogHeader>
              <DialogTitle>New Project</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4" onSubmit={handleProjectSubmit}>
              <div>
                <Label className="block mb-2" htmlFor="project-name">
                  Project Name
                </Label>
                <Input
                  autoFocus
                  id="project-name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Project"
                  required
                  value={name}
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
                <Button disabled={isLoading || !name} type="submit">
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
                      size="sm"
                      text={successState.keyToken}
                      variant="outline"
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
                  onChange={(e) => {
                    setKeyName(e.target.value);
                    setKeyError('');
                  }}
                  placeholder="e.g., Development Key, Production Key"
                  value={keyName}
                />
                {keyError && (
                  <p className="text-sm text-destructive">{keyError}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                disabled={isLoading}
                onClick={() => setStep('project')}
                type="button"
                variant="outline"
              >
                Back
              </Button>
              <Button disabled={isLoading} type="submit">
                {isLoading ? 'Creating...' : 'Create key'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
