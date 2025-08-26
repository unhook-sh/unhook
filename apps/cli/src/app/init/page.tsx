import type { WebhookConfig } from '@unhook/client';
import { debug } from '@unhook/logger';
import { Box, Text, useInput } from 'ink';
import { type FC, useState } from 'react';
import { z } from 'zod';
import { Ascii } from '~/components/ascii';
import {
  FormDescription,
  FormInput,
  FormLabel,
  FormProvider,
  FormSelect,
} from '~/components/form';
import { useDimensions } from '~/hooks/use-dimensions';
import { capture } from '~/lib/posthog';
import { useApiStore } from '~/stores/api-store';
import { useAuthStore } from '~/stores/auth-store';
import { useCliStore } from '~/stores/cli-store';
import { useConfigStore } from '~/stores/config-store';
import { type RouteProps, useRouterStore } from '~/stores/router-store';
import { useWebhookStore } from '~/stores/webhook-store';

const log = debug('unhook:cli:init');

const initFormSchema = z.object({
  destination: z.string().url('Please enter a valid URL'),
  source: z.string().optional(),
  webhookName: z.string().optional(),
  webhookUrl: z.string().optional(),
});

type InitFormValues = z.infer<typeof initFormSchema>;

export const InitPage: FC<RouteProps> = () => {
  const dimensions = useDimensions();
  const [submitted, setSubmitted] = useState(false);
  const source = useCliStore.use.source?.();
  const destination = useCliStore.use.destination?.();
  const navigate = useRouterStore.use.navigate();
  const writeConfig = useConfigStore.use.writeConfig();
  const setConfig = useConfigStore.use.setConfig();
  const webhookUrl = useCliStore.use.webhookUrl?.();
  const [configPath, setConfigPath] = useState<string | undefined>(undefined);
  const [webhookName] = useState('Default');
  const [selectedWebhookId, setSelectedWebhookId] = useState<
    string | undefined
  >(webhookUrl ?? '');
  const [showNewWebhookInput, setShowNewWebhookInput] = useState(false);
  const NEW_WEBHOOK_VALUE = '__NEW__';

  // Webhook select logic
  const webhooks = useWebhookStore.use.webhooks();
  const isLoading = useWebhookStore.use.isLoading();
  const fetchWebhooks = useWebhookStore.use.fetchWebhooks();

  // Fetch webhooks on mount
  useState(() => {
    fetchWebhooks().then((webhooks) => {
      if (webhooks.length === 0) {
        setShowNewWebhookInput(true);
      }
    });
  });

  // Add useInput hook to handle Enter key press after submission
  useInput((_input, key) => {
    if (submitted && key.return) {
      navigate('/', { resetHistory: true });
    }
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
    let usedWebhookId = values.webhookUrl;
    // If no webhooks exist or '+ New Webhook' is selected, create one with the provided name
    if (webhooks.length === 0 || values.webhookUrl === NEW_WEBHOOK_VALUE) {
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
        destination: values.destination,
        source: values.source,
        webhookId: usedWebhookId,
        webhookUrl: values.webhookUrl,
      },
    });

    // Get the actual organization name from the user's account
    const { orgId } = useAuthStore.getState();
    const { api } = useApiStore.getState();

    let orgName = 'my-org'; // fallback
    if (orgId) {
      try {
        const org = await api.org.current.query();
        if (org?.name) {
          orgName = org.name;
        }
      } catch (error) {
        log('Failed to get organization name, using fallback:', error);
      }
    }

    const webhookUrl = `https://unhook.sh/${orgName}/${usedWebhookId}`;

    const config = {
      delivery: [{ destination: 'default', source: values.source ?? '*' }],
      destination: [{ name: 'default', url: values.destination }],
      webhookUrl: webhookUrl,
    } satisfies WebhookConfig;

    const { path } = await writeConfig(config);
    setConfigPath(path);
    setConfig(config);
    setSubmitted(true);
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Ascii
          color="gray"
          font="ANSI Shadow"
          text="Unhook"
          width={dimensions.width}
        />
      </Box>
      <FormProvider
        initialValues={{
          destination: destination ?? '',
          source: source ?? '',
          webhookUrl: webhookUrl ?? '',
        }}
        onSubmit={handleSubmit}
        schema={initFormSchema}
      >
        {isLoading && <Text>Loading webhooks...</Text>}
        {!isLoading && (
          <>
            {webhooks.length === 0 ? (
              <Box flexDirection="column" marginBottom={1}>
                <FormLabel id="webhookName">Enter a webhook name:</FormLabel>
                <FormInput
                  defaultValue={webhookName}
                  id="webhookName"
                  placeholder="Default"
                />
              </Box>
            ) : (
              <>
                <Box flexDirection="column" marginBottom={1}>
                  <FormLabel id="webhookUrl">Select a webhook:</FormLabel>
                  <FormSelect
                    defaultValue={
                      selectedWebhookId ?? webhookOptionsWithNew[0]?.value
                    }
                    id="webhookUrl"
                    items={webhookOptionsWithNew}
                    onSelect={(item) => {
                      setSelectedWebhookId(item.value);
                      setShowNewWebhookInput(item.value === NEW_WEBHOOK_VALUE);
                    }}
                    showHotkeys={!isLoading}
                  />
                </Box>
                {showNewWebhookInput && (
                  <Box flexDirection="column" marginBottom={1}>
                    <FormLabel id="webhookName">
                      Enter a webhook name:
                    </FormLabel>
                    <FormInput
                      defaultValue={webhookName}
                      id="webhookName"
                      placeholder="Default"
                    />
                  </Box>
                )}
              </>
            )}
            <Box flexDirection="column" marginBottom={1}>
              <FormLabel id="source">Enter your source service:</FormLabel>
              <FormDescription id="source">
                The service that will send webhooks to Unhook (e.g., Stripe,
                GitHub)
              </FormDescription>
              <FormInput
                defaultValue={source}
                id="source"
                placeholder="Stripe"
              />
            </Box>
            <Box flexDirection="column" marginBottom={1}>
              <FormLabel id="destination">
                Enter your destination URL:
              </FormLabel>
              <FormDescription id="destination">
                The URL where Unhook will deliver the webhooks to
              </FormDescription>
              <FormInput
                defaultValue={destination ?? 'http://localhost:3000'}
                id="destination"
                placeholder="http://localhost:3000"
              />
            </Box>
          </>
        )}
      </FormProvider>
      {submitted && (
        <Box flexDirection="column" marginBottom={1}>
          <Text>Success!</Text>
          <Text>
            Your webhook config has been saved at{' '}
            <Text color="blue">{configPath}</Text>
          </Text>
          <Text>
            You can now use the <Text color="blue">npx @unhook/cli listen</Text>{' '}
            command to deliver webhooks to {destination}.
          </Text>
          <Box marginTop={1}>
            <Text>Press Enter to continue...</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
