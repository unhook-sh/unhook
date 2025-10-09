'use client';

import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';

import { api } from '@unhook/api/react';
import { Alert, AlertDescription } from '@unhook/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { Button } from '@unhook/ui/components/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@unhook/ui/components/form';
import { Input } from '@unhook/ui/components/input';
import { Icons } from '@unhook/ui/custom/icons';
import { cn } from '@unhook/ui/lib/utils';
import { toast } from '@unhook/ui/sonner';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { env } from '~/env.client';

// Constants
const VALIDATION_REGEX = /^[a-z0-9-_]+$/;
const DEBOUNCE_DELAY = 500;

// Validation utilities
const validateNameFormat = (name: string, minLength: number) => {
  if (name.length < minLength) return null;
  if (!VALIDATION_REGEX.test(name)) {
    return 'Name can only contain lowercase letters, numbers, hyphens, and underscores';
  }
  return null;
};

// Validation state type
interface ValidationState {
  checking: boolean;
  available: boolean | null;
  message: string;
}

// Custom hook for name validation
function useNameValidation(
  name: string,
  minLength: number,
  checkAvailability: (
    name: string,
  ) => Promise<{ available: boolean | string | undefined; message: string }>,
) {
  const [validation, setValidation] = useState<ValidationState>({
    available: null,
    checking: false,
    message: '',
  });

  const validate = useCallback(
    async (nameToValidate: string) => {
      console.log(
        'Validating name:',
        nameToValidate,
        'with minLength:',
        minLength,
      );

      // Early return for empty or too short names
      if (nameToValidate.length < minLength) {
        console.log('Name too short, clearing validation');
        setValidation({ available: null, checking: false, message: '' });
        return;
      }

      // Check format validity
      const formatError = validateNameFormat(nameToValidate, minLength);
      if (formatError) {
        console.log('Format error:', formatError);
        setValidation({
          available: null,
          checking: false,
          message: formatError,
        });
        return;
      }

      console.log('Starting availability check for:', nameToValidate);
      setValidation({ available: null, checking: true, message: '' });

      try {
        const result = await checkAvailability(nameToValidate);
        console.log('Availability result:', result);

        // Handle different response types from different endpoints
        let available: boolean | null = null;
        if (typeof result.available === 'boolean') {
          available = result.available;
        } else if (result.available === '') {
          available = false;
        } else if (result.available === undefined) {
          available = null;
        }

        setValidation({
          available,
          checking: false,
          message: result.message,
        });
      } catch (error) {
        console.error('Validation error:', error);
        setValidation({
          available: false,
          checking: false,
          message: 'Failed to check availability',
        });
      }
    },
    [minLength, checkAvailability],
  );

  // Debounced validation effect
  useEffect(() => {
    if (!name || name.length < minLength) {
      setValidation({ available: null, checking: false, message: '' });
      return;
    }

    // Check format validity immediately
    const formatError = validateNameFormat(name, minLength);
    if (formatError) {
      setValidation({
        available: null,
        checking: false,
        message: formatError,
      });
      return;
    }

    const timer = setTimeout(() => {
      validate(name);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [name, minLength, validate]);

  return validation;
}

const onboardingSchema = z.object({
  orgName: z
    .string()
    .min(3, 'Organization name must be at least 3 characters')
    .max(50, 'Organization name must be less than 50 characters')
    .regex(
      VALIDATION_REGEX,
      'Organization name can only contain lowercase letters, numbers, hyphens, and underscores',
    )
    .transform((val) => val.toLowerCase().trim()),
  webhookName: z
    .string()
    .min(1, 'Webhook name is required')
    .max(50, 'Webhook name must be less than 50 characters')
    .regex(
      VALIDATION_REGEX,
      'Webhook name can only contain lowercase letters, numbers, hyphens, and underscores',
    )
    .transform((val) => val.toLowerCase().trim()),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingFormProps {
  isLoading?: boolean;
  redirectTo?: string;
  source?: string;
}

export function OnboardingForm({
  isLoading = false,
  redirectTo,
  source,
}: OnboardingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { organization } = useOrganization();
  const { setActive } = useOrganizationList({ userMemberships: true });
  const { user } = useUser();

  const form = useForm<OnboardingFormData>({
    defaultValues: {
      orgName: '',
      webhookName: '',
    },
    mode: 'onChange',
    resolver: zodResolver(onboardingSchema),
  });

  const { watch } = form;
  const orgName = watch('orgName');
  const webhookName = watch('webhookName');

  // Use tRPC utils for API calls
  const apiUtils = api.useUtils();

  // Validation hooks
  const orgNameValidation = useNameValidation(
    orgName,
    3,
    useCallback(
      (name) =>
        apiUtils.org.checkNameAvailability.fetch({
          excludeOrgId: organization?.id,
          name,
        }),
      [apiUtils.org.checkNameAvailability, organization?.id],
    ),
  );

  const webhookNameValidation = useNameValidation(
    webhookName,
    1,
    useCallback(
      (name) => apiUtils.webhooks.checkAvailability.fetch({ name }),
      [apiUtils.webhooks.checkAvailability],
    ),
  );

  // Live URL preview
  const webhookUrl = (() => {
    // For local development, use NEXT_PUBLIC_API_URL (localhost:3000)
    // For production, use NEXT_PUBLIC_WEBHOOK_BASE_URL or fallback to unhook.sh
    const baseUrl =
      env.NEXT_PUBLIC_WEBHOOK_BASE_URL ||
      env.NEXT_PUBLIC_API_URL ||
      'https://unhook.sh';
    if (!orgName) return `${baseUrl}/{org-name}/{webhook-name}`;
    if (!webhookName) return `${baseUrl}/${orgName}/{webhook-name}`;
    return `${baseUrl}/${orgName}/${webhookName}`;
  })();

  const { mutateAsync: createWebhook } = api.webhooks.create.useMutation();
  const { mutateAsync: createOrg } = api.org.upsert.useMutation();

  const handleSubmit = async (data: OnboardingFormData) => {
    if (!user) {
      toast.error('No user found');
      return;
    }

    // Check validation status before submitting
    if (orgNameValidation.available === false) {
      toast.error('Please fix organization name validation errors');
      return;
    }

    if (webhookNameValidation.available === false) {
      toast.error('Please fix webhook name validation errors');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user already has an organization to prevent duplicate creation
      // This prevents the issue where users would end up with multiple Stripe customers
      // by checking for existing organizations before attempting to create new ones
      // The createOrg function also has additional duplicate prevention logic
      if (organization) {
        console.log(
          'User already has an organization, preventing duplicate creation:',
          {
            existingOrgId: organization.id,
            existingOrgName: organization.name,
            requestedOrgName: data.orgName,
            userId: user.id,
          },
        );

        // Update existing organization name if it's different
        if (organization.name !== data.orgName) {
          try {
            await organization.update({
              name: data.orgName,
            });
            console.log('Organization name updated in Clerk successfully');
            await organization.reload();
          } catch (error) {
            console.error('Failed to update organization in Clerk:', error);
            // Continue with the flow even if Clerk update fails
          }
        }

        // Redirect to webhook creation since organization already exists
        router.push(`/app/webhooks/create?orgName=${data.orgName}`);
        return;
      }

      console.log('Creating new organization for user:', {
        orgName: data.orgName,
        userEmail: user.emailAddresses?.[0]?.emailAddress,
        userId: user.id,
      });

      // Create organization with Stripe integration
      const orgResult = await createOrg({
        name: data.orgName,
      });

      if (!orgResult) {
        throw new Error('Failed to create organization');
      }

      console.log('Organization created with Stripe integration:', {
        apiKeyId: orgResult.apiKey?.id,
        orgId: orgResult.org.id,
        orgName: orgResult.org.name,
        stripeCustomerId: orgResult.org.stripeCustomerId,
      });

      if (setActive) {
        await setActive({ organization: orgResult.org.id });
      }

      // Create webhook with custom ID using the API key from the created organization
      const webhook = await createWebhook({
        apiKeyId: orgResult.apiKey?.id,
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
        id: data.webhookName,
        name: data.webhookName,
        orgId: orgResult.org.id,
        status: 'active',
      });

      if (!webhook) {
        throw new Error('Failed to create webhook');
      }

      console.log('Custom webhook created:', {
        orgId: orgResult.org.id,
        webhookId: webhook.id,
        webhookName: webhook.name,
      });

      toast.success('Setup complete!', {
        description:
          'Organization activated and webhook created successfully. Redirecting to your dashboard...',
      });

      // Redirect to local setup page
      const params = new URLSearchParams({
        orgName: data.orgName,
        webhookName: data.webhookName,
      });

      if (redirectTo) {
        params.append('redirectTo', redirectTo);
      }
      if (source) {
        params.append('source', source);
      }

      router.push(`/app/onboarding/local-setup?${params.toString()}`);
    } catch (error) {
      console.error('Failed to complete setup:', {
        error,
        orgName: data.orgName,
        userEmail: user.emailAddresses?.[0]?.emailAddress,
        userId: user.id,
      });

      let errorMessage = 'Please try again.';
      if (error instanceof Error) {
        if (
          error.message.includes('Failed to fetch updated organization') ||
          error.message.includes('Failed to update organization')
        ) {
          errorMessage =
            'Organization setup is taking longer than expected. Please refresh the page and try again.';
        } else if (error.message.includes('User email not found')) {
          errorMessage =
            'Your account setup is not complete. Please sign out and sign in again.';
        } else if (
          error.message.includes('Failed to retrieve user from Clerk')
        ) {
          errorMessage =
            'Unable to retrieve your account information. Please refresh and try again.';
        } else if (error.message.includes('already exists')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }

      toast.error('Failed to complete setup', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render validation icon
  const renderValidationIcon = (validation: ValidationState) => {
    if (validation.checking) {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Icons.Spinner className="animate-spin" size="sm" variant="muted" />
        </div>
      );
    }

    if (validation.available === true) {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Icons.Check className="text-green-500" size="sm" />
        </div>
      );
    }

    if (validation.available === false) {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Icons.X size="sm" variant="destructive" />
        </div>
      );
    }

    return null;
  };

  // Helper function to get input border classes
  const getInputBorderClasses = (validation: ValidationState) => {
    return cn(
      validation.checking && 'pr-10',
      validation.available === false && 'border-destructive',
      validation.available === true && 'border-green-500',
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        {source === 'extension' && (
          <Alert>
            <Icons.FunctionSquare className="h-4 w-4" />
            <AlertDescription>
              Setting up Unhook for VSCode. You'll be redirected back to your
              editor after completing setup.
            </AlertDescription>
          </Alert>
        )}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to Unhook! 🎉</CardTitle>
            <CardDescription>
              Let's set up your webhook endpoint. Choose names for your
              organization and webhook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(handleSubmit)}
              >
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="orgName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="e.g., my-company"
                              {...field}
                              autoCapitalize="off"
                              autoComplete="off"
                              autoCorrect="off"
                              autoFocus
                              autoSave="off"
                              className={getInputBorderClasses(
                                orgNameValidation,
                              )}
                              disabled={isSubmitting || isLoading}
                            />
                            {renderValidationIcon(orgNameValidation)}
                          </div>
                        </FormControl>
                        <FormDescription>
                          This will be part of your webhook URL. Use lowercase
                          letters, numbers, and hyphens only.
                        </FormDescription>
                        {orgNameValidation.available === false &&
                          orgNameValidation.message && (
                            <p className="text-sm text-destructive">
                              {orgNameValidation.message}
                            </p>
                          )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="webhookName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="e.g., my-project"
                              {...field}
                              autoCapitalize="off"
                              autoComplete="off"
                              autoCorrect="off"
                              autoSave="off"
                              className={getInputBorderClasses(
                                webhookNameValidation,
                              )}
                              disabled={isSubmitting || isLoading}
                            />
                            {renderValidationIcon(webhookNameValidation)}
                          </div>
                        </FormControl>
                        <FormDescription>
                          You will use this webhook on a per-project basis. Each
                          project gets its own webhook endpoint that can receive
                          events from multiple services like Stripe, GitHub,
                          Discord, or any webhook provider. Use lowercase
                          letters, numbers, and hyphens only.
                        </FormDescription>
                        {webhookNameValidation.available === false &&
                          webhookNameValidation.message && (
                            <p className="text-sm text-destructive">
                              {webhookNameValidation.message}
                            </p>
                          )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Live URL Preview */}
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Icons.ExternalLink size="sm" variant="muted" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Your webhook will be available at:
                      </span>
                    </div>
                    <div className="font-mono text-sm text-center p-2 bg-background rounded border">
                      {webhookUrl}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      This URL will be created after you submit the form
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      className="min-w-32"
                      disabled={
                        isSubmitting ||
                        isLoading ||
                        !orgName ||
                        !webhookName ||
                        orgNameValidation.available === false ||
                        webhookNameValidation.available === false
                      }
                      type="submit"
                    >
                      {isSubmitting ? (
                        <>
                          <Icons.Spinner
                            className="animate-spin mr-2"
                            size="sm"
                          />
                          Setting up...
                        </>
                      ) : (
                        'Create Webhook'
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
