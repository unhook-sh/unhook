'use client'

import { api } from '@acme/api/client'
import { Button } from '@acme/ui/button'
import { Icons } from '@acme/ui/custom/icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@acme/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@acme/ui/form'
import { Input } from '@acme/ui/input'
import { toast } from '@acme/ui/sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  localAddr: z.string().min(1, 'Local address is required'),
  serverAddr: z.string().min(1, 'Server address is required'),
})

type FormValues = z.infer<typeof formSchema>

interface CreateTunnelDialogProps {
  children: React.ReactNode
}

export function CreateTunnelDialog({ children }: CreateTunnelDialogProps) {
  const { mutateAsync: createTunnel } = api.tunnels.create.useMutation()
  const queryClient = useQueryClient()
  const form = useForm<FormValues>({
    defaultValues: {
      clientId: '',
      localAddr: 'http://localhost:3000',
      serverAddr: 'https://tunnel.acme.com/api/tunnel',
    },
    resolver: zodResolver(formSchema),
  })

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
                await createTunnel(values)
                await queryClient.invalidateQueries({
                  queryKey: ['tunnels', 'all'],
                })
                toast.success('Tunnel created', {
                  description: 'The tunnel has been created successfully.',
                })
                form.reset()
              } catch (error) {
                toast.error('Failed to create tunnel', {
                  description: 'Please try again.',
                })
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
              name="localAddr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local Address</FormLabel>
                  <FormControl>
                    <Input placeholder="http://localhost:3000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serverAddr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://tunnel.acme.com/api/tunnel"
                      {...field}
                    />
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
  )
}
