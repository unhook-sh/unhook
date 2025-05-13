import { debug } from '@unhook/logger';
import { Box, Text } from 'ink';
import { type FC, useState } from 'react';
import { z } from 'zod';
import { Ascii } from '~/components/ascii';

import {
  FormDescription,
  FormInput,
  FormLabel,
  FormProvider,
} from '~/components/form';
import { useDimensions } from '~/hooks/use-dimensions';
import { useCliStore } from '~/stores/cli-store';
import { useConfigStore } from '~/stores/config-store';
import { type RouteProps, useRouterStore } from '~/stores/router-store';
const log = debug('unhook:cli:init');

const initFormSchema = z.object({
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

  const handleSubmit = async (values: InitFormValues) => {
    setSubmitted(true);

    if (!webhookId) {
      log('No webhook ID found');
      return;
    }

    const config = {
      webhookId,
      to: [{ name: 'default', url: values.to }],
      forward: [{ from: values.from ?? '*', to: 'default' }],
    };

    await writeConfig(config);
    setConfig(config);

    // setTimeout(() => {
    navigate('/');
    // }, 1000);
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
      <FormProvider schema={initFormSchema} onSubmit={handleSubmit}>
        <Box marginBottom={1} flexDirection="column">
          <FormLabel id="from">Enter your from service:</FormLabel>
          <FormDescription id="from">
            The service that will send webhooks to Unhook (e.g., Stripe, GitHub)
          </FormDescription>
          <FormInput id="from" placeholder="Stripe" defaultValue={from} />
        </Box>
        <Box marginBottom={1} flexDirection="column">
          <FormLabel id="to">Enter your to URL:</FormLabel>
          <FormDescription id="to">
            The URL where Unhook will forward the webhooks to
          </FormDescription>
          <FormInput
            id="to"
            placeholder="http://localhost:3000"
            defaultValue={to ?? 'http://localhost:3000'}
          />
        </Box>
      </FormProvider>
      {submitted && (
        <Box marginBottom={1} flexDirection="column">
          <Text>Success!</Text>
          <Text>Your webhook config has been saved.</Text>
          <Text>
            You can now use the <Text color="blue">unhook listen</Text> command
            to forward webhooks to your service.
          </Text>
          <Text>Redirecting to the home page...</Text>
        </Box>
      )}
    </Box>
  );
};
