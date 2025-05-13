import { hostname, platform, release } from 'node:os';
import clipboard from 'clipboardy';
import { Box, Text, useInput } from 'ink';
import { type FC, useState } from 'react';
import { Ascii } from '~/components/ascii';
import { SelectInput } from '~/components/select-input';
import { useDimensions } from '~/hooks/use-dimensions';
import { useCliStore } from '~/stores/cli-store';
import { useConfigStore } from '~/stores/config-store';
import { type StaticRoutePath, useRouterStore } from '~/stores/router-store';
import type { RouteProps } from '~/stores/router-store';
import type { AppRoutePath } from '../routes';
import { useRoutes } from '../routes';

export const MenuPage: FC<RouteProps> = () => {
  const navigate = useRouterStore.use.navigate();
  const routes = useRoutes();

  const menuItems = routes
    .map((route) => ({
      label: route.label,
      value: route.path,
      hotkey: route.hotkey,
      showInMenu: route.showInMenu ?? true,
    }))
    .filter((item) => item.showInMenu && !item.value.includes(':')) as Array<{
    label: string;
    value: StaticRoutePath<AppRoutePath>;
    hotkey: string | undefined;
    showInMenu: boolean;
  }>;

  const dimensions = useDimensions();
  const clientId = useConfigStore.use.clientId?.();
  const version = useCliStore.use.version();
  const webhookId = useConfigStore.use.webhookId();
  const debug = useCliStore.use.debug();

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL}/${webhookId}?from=*`;
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
        <Ascii
          text="Unhook"
          width={dimensions.width}
          font="ANSI Shadow"
          color="gray"
        />
      </Box>
      <Box marginBottom={1} flexDirection="column">
        {/* <Box flexDirection="row"> */}
        {/* <Text dimColor>Webhook URL:</Text> */}
        <Text bold>{webhookUrl}</Text>
        {/* </Box> */}
        {!copiedToClipboard && (
          <Text dimColor>Press 'c' to copy to clipboard</Text>
        )}
        {copiedToClipboard && <Text dimColor>Copied!</Text>}
      </Box>
      {debug && (
        <Box marginBottom={1} flexDirection="column">
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
