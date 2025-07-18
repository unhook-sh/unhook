'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@unhook/api/react';
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
  apiKeyId: z.string(),
  config: z.object({
    headers: z.object({}),
    requests: z.object({}),
    storage: z.object({
      maxRequestBodySize: z.number(),
      maxResponseBodySize: z.number(),
      storeHeaders: z.boolean(),
      storeRequestBody: z.boolean(),
      storeResponseBody: z.boolean(),
    }),
  }),
  name: z.string().min(1, 'Name is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateWebhookDialogProps {
  children: React.ReactNode;
}

export function CreateWebhookDialog({ children }: CreateWebhookDialogProps) {
  const { mutateAsync: createWebhook } = api.webhooks.create.useMutation();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    defaultValues: {
      config: {
        headers: {},
        requests: {},
        storage: {
          maxRequestBodySize: 1024 * 1024,
          maxResponseBodySize: 1024 * 1024,
          storeHeaders: true,
          storeRequestBody: true,
          storeResponseBody: true,
        },
      },
      name: '',
    },
    resolver: zodResolver(formSchema),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
          <DialogDescription>
            Create a new webhook to expose your local service to the internet.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await createWebhook(values);
                await queryClient.invalidateQueries({
                  queryKey: ['webhooks', 'all'],
                });
                toast.success('Webhook created', {
                  description: 'The webhook has been created successfully.',
                });
                form.reset();
              } catch (_error) {
                toast.error('Failed to create webhook', {
                  description: 'Please try again.',
                });
              }
            })}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="my-app" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiKeyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="pk_test_123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Icons.Spinner className="mr-2" size="sm" />
                )}
                Create Webhook
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
