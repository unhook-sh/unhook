import { debug } from '@unhook/logger';
import { Box, Text } from 'ink';
import { type FC, useState } from 'react';
import { z } from 'zod';
import { Ascii } from '~/components/ascii';
import { capture } from '~/lib/posthog';

import {
  FormDescription,
  FormInput,
  FormLabel,
  FormProvider,
  FormSelect,
} from '~/components/form';
import { useDimensions } from '~/hooks/use-dimensions';
import { useCliStore } from '~/stores/cli-store';
import { useConfigStore } from '~/stores/config-store';
import { type RouteProps, useRouterStore } from '~/stores/router-store';
import { useWebhookStore } from '~/stores/webhook-store';
const log = debug('unhook:cli:init');

const initFormSchema = z.object({
  webhookId: z.string().optional(),
  webhookName: z.string().optional(),
  to: z.string().url('Please enter a valid URL'),
  from: z.string().min(1, 'From is required'),
});

type InitFormValues = z.infer<typeof initFormSchema>;

export const InitPage: FC<RouteProps> = () => {
  const dimensions = useDimensions();
  const [submitted, setSubmitted] = useState(false);
  const from = useCliStore.use.from?.();
  const to = useCliStore.use.to?.();
  const navigate = useRouterStore.use.navigate();
  const writeConfig = useConfigStore.use.writeConfig();
  const setConfig = useConfigStore.use.setConfig();
  const webhookId = useCliStore.use.webhookId?.();
  const [webhookName] = useState('Default');
  const [selectedWebhookId, setSelectedWebhookId] = useState<
    string | undefined
  >(webhookId ?? '');
  const [showNewWebhookInput, setShowNewWebhookInput] = useState(false);
  const NEW_WEBHOOK_VALUE = '__NEW__';

  // Webhook select logic
  const webhooks = useWebhookStore.use.webhooks();
  const isLoading = useWebhookStore.use.isLoading();
  const fetchWebhooks = useWebhookStore.use.fetchWebhooks();

  // Fetch webhooks on mount
  useState(() => {
    fetchWebhooks();
  });

  const webhookOptions = webhooks.map((wh) => ({
    label: (
      <Box gap={1}>
        {wh.name && <Text>{wh.name}</Text>}
        <Text dimColor={!!wh.name}>({wh.id})</Text>
      </Box>
    ),
    value: wh.id,
  }));

  // Add '+ New Webhook' option if there are existing webhooks
  const webhookOptionsWithNew =
    webhooks.length > 0
      ? [
          ...webhookOptions,
          {
            label: <Text color="green">+ New Webhook</Text>,
            value: NEW_WEBHOOK_VALUE,
          },
        ]
      : webhookOptions;

  const handleSubmit = async (values: InitFormValues) => {
    setSubmitted(true);

    let usedWebhookId = values.webhookId;
    // If no webhooks exist or '+ New Webhook' is selected, create one with the provided name
    if (webhooks.length === 0 || values.webhookId === NEW_WEBHOOK_VALUE) {
      const created = await useWebhookStore
        .getState()
        .createWebhook(values.webhookName || 'Default');
      usedWebhookId = created.id;
    }

    if (!usedWebhookId) {
      log('No webhook ID found');
      return;
    }

    // PostHog event capture for config creation
    capture({
      event: 'init_config_created',
      properties: {
        from: values.from,
        to: values.to,
        webhookId: usedWebhookId,
      },
    });

    const config = {
      webhookId: usedWebhookId,
      to: [{ name: 'default', url: values.to }],
      deliver: [{ from: values.from ?? '*', to: 'default' }],
    };

    await writeConfig(config);
    setConfig(config);

    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Ascii
          text="Unhook"
          width={dimensions.width}
          font="ANSI Shadow"
          color="gray"
        />
      </Box>
      <FormProvider
        schema={initFormSchema}
        onSubmit={handleSubmit}
        initialValues={{
          webhookId: webhookId ?? '',
          webhookName: webhookName,
          to: to ?? '',
          from: from ?? '',
        }}
      >
        {isLoading && <Text>Loading webhooks...</Text>}
        {!isLoading && (
          <>
            {webhooks.length === 0 ? (
              <Box marginBottom={1} flexDirection="column">
                <FormLabel id="webhookName">Enter a webhook name:</FormLabel>
                <FormInput
                  id="webhookName"
                  placeholder="Default"
                  defaultValue={webhookName}
                />
              </Box>
            ) : (
              <>
                <Box marginBottom={1} flexDirection="column">
                  <FormLabel id="webhookId">Select a webhook:</FormLabel>
                  <FormSelect
                    id="webhookId"
                    items={webhookOptionsWithNew}
                    defaultValue={
                      selectedWebhookId ?? webhookOptionsWithNew[0]?.value
                    }
                    showHotkeys={!isLoading}
                    onSelect={(item) => {
                      setSelectedWebhookId(item.value);
                      setShowNewWebhookInput(item.value === NEW_WEBHOOK_VALUE);
                    }}
                  />
                </Box>
                {showNewWebhookInput && (
                  <Box marginBottom={1} flexDirection="column">
                    <FormLabel id="webhookName">
                      Enter a webhook name:
                    </FormLabel>
                    <FormInput
                      id="webhookName"
                      placeholder="Default"
                      defaultValue={webhookName}
                    />
                  </Box>
                )}
              </>
            )}
            <Box marginBottom={1} flexDirection="column">
              <FormLabel id="from">Enter your from service:</FormLabel>
              <FormDescription id="from">
                The service that will send webhooks to Unhook (e.g., Stripe,
                GitHub)
              </FormDescription>
              <FormInput id="from" placeholder="Stripe" defaultValue={from} />
            </Box>
            <Box marginBottom={1} flexDirection="column">
              <FormLabel id="to">Enter your to URL:</FormLabel>
              <FormDescription id="to">
                The URL where Unhook will deliver the webhooks to
              </FormDescription>
              <FormInput
                id="to"
                placeholder="http://localhost:3000"
                defaultValue={to ?? 'http://localhost:3000'}
              />
            </Box>
          </>
        )}
      </FormProvider>
      {submitted && (
        <Box marginBottom={1} flexDirection="column">
          <Text>Success!</Text>
          <Text>Your webhook config has been saved.</Text>
          <Text>
            You can now use the <Text color="blue">unhook listen</Text> command
            to deliver webhooks to your service.
          </Text>
          <Text>Redirecting to the home page...</Text>
        </Box>
      )}
    </Box>
  );
};
