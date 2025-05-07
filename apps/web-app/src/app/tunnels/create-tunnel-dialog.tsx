'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@unhook/api/client';
import { Button } from '@unhook/ui/button';
import { Icons } from '@unhook/ui/custom/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@unhook/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@unhook/ui/form';
import { Input } from '@unhook/ui/input';
import { toast } from '@unhook/ui/sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  port: z.number().min(1, 'Port is required'),
  config: z.object({
    storage: z.object({
      storeHeaders: z.boolean(),
      storeRequestBody: z.boolean(),
      storeResponseBody: z.boolean(),
      maxRequestBodySize: z.number(),
      maxResponseBodySize: z.number(),
    }),
    headers: z.object({}),
    requests: z.object({}),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateTunnelDialogProps {
  children: React.ReactNode;
}

export function CreateTunnelDialog({ children }: CreateTunnelDialogProps) {
  const { mutateAsync: createTunnel } = api.tunnels.create.useMutation();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    defaultValues: {
      clientId: '',
      port: 3000,
      config: {
        storage: {
          storeHeaders: true,
          storeRequestBody: true,
          storeResponseBody: true,
          maxRequestBodySize: 1024 * 1024,
          maxResponseBodySize: 1024 * 1024,
        },
        headers: {},
        requests: {},
      },
    },
    resolver: zodResolver(formSchema),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tunnel</DialogTitle>
          <DialogDescription>
            Create a new tunnel to expose your local service to the internet.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await createTunnel(values);
                await queryClient.invalidateQueries({
                  queryKey: ['tunnels', 'all'],
                });
                toast.success('Tunnel created', {
                  description: 'The tunnel has been created successfully.',
                });
                form.reset();
              } catch (_error) {
                toast.error('Failed to create tunnel', {
                  description: 'Please try again.',
                });
              }
            })}
          >
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID</FormLabel>
                  <FormControl>
                    <Input placeholder="my-app" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl>
                    <Input placeholder="3000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Icons.Spinner size="sm" className="mr-2" />
                )}
                Create Tunnel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
