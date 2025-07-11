import { hostname, platform, release } from 'node:os';
import clipboard from 'clipboardy';
import { Box, Text, useInput } from 'ink';
import { type FC, useState } from 'react';
import { Ascii } from '~/components/ascii';
import { SelectInput } from '~/components/select-input';
import { env } from '~/env';
import { useCliStore } from '~/stores/cli-store';
import { useConfigStore } from '~/stores/config-store';
import type { RouteProps } from '~/stores/router-store';
import { type StaticRoutePath, useRouterStore } from '~/stores/router-store';
import type { AppRoutePath } from '../routes';
import { useRoutes } from '../routes';

export const MenuPage: FC<RouteProps> = () => {
  const navigate = useRouterStore.use.navigate();
  const routes = useRoutes();

  const menuItems = routes
    .map((route) => ({
      hotkey: route.hotkey,
      label: route.label,
      showInMenu: route.showInMenu ?? true,
      value: route.path,
    }))
    .filter((item) => item.showInMenu && !item.value.includes(':')) as Array<{
    label: string;
    value: StaticRoutePath<AppRoutePath>;
    hotkey: string | undefined;
    showInMenu: boolean;
  }>;

  const clientId = useConfigStore.use.clientId?.();
  const version = useCliStore.use.version();
  const webhookId = useConfigStore.use.webhookId();
  const debug = useCliStore.use.verbose();

  const webhookUrl = `${env.NEXT_PUBLIC_API_URL}/${webhookId}`;
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  useInput((input) => {
    if (input === 'c') {
      clipboard.writeSync(webhookUrl);
      setCopiedToClipboard(true);
      setTimeout(() => {
        setCopiedToClipboard(false);
      }, 2000);
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Ascii color="gray" font="ANSI Shadow" text="Unhook" />
      </Box>
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>{webhookUrl}</Text>
        {!copiedToClipboard && (
          <Text dimColor>Press 'c' to copy to clipboard</Text>
        )}
        {copiedToClipboard && <Text dimColor>Copied!</Text>}
      </Box>
      {debug && (
        <Box flexDirection="column" marginBottom={1}>
          <Text dimColor>Version: {version}</Text>
          <Text dimColor>Client: {clientId}</Text>
          <Text dimColor>Webhook: {webhookId}</Text>
          <Text dimColor>
            Platform: {platform()} {release()}
          </Text>
          <Text dimColor>Hostname: {hostname()}</Text>
        </Box>
      )}
      {/* <Box marginBottom={1}> */}
      {/* <ConnectionStatus /> */}
      {/* </Box> */}

      <Box flexDirection="column">
        <SelectInput<StaticRoutePath<AppRoutePath>>
          items={menuItems}
          onSelect={(item) => navigate(item.value)}
        />
      </Box>
    </Box>
  );
};
