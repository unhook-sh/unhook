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
  name: z.string().min(1, 'Name is required'),
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

interface CreateWebhookDialogProps {
  children: React.ReactNode;
}

export function CreateWebhookDialog({ children }: CreateWebhookDialogProps) {
  const { mutateAsync: createWebhook } = api.webhooks.create.useMutation();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
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

            <DialogFooter>
              <Button disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Icons.Spinner size="sm" className="mr-2" />
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
