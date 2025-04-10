import { hostname, platform, release } from 'node:os';
import { Box, Text } from 'ink';
import { type FC, useEffect } from 'react';
import { Ascii } from '~/components/ascii';
import { SelectInput } from '~/components/select-input';
import { useDimensions } from '~/hooks/use-dimensions';
import { useAuthStore } from '~/lib/auth/store';
import { useCliStore } from '~/lib/cli-store';
import { useConnectionStore } from '~/lib/connection-store';
import { useRouter } from '~/lib/router';
import type { RouteProps } from '~/lib/router';
import { useTunnelStore } from '~/lib/tunnel-store';
import type { AppRoutePath } from '../routes';

import { ConnectionStatus } from '~/components/connection-status';
import { useRoutes } from '../routes';

export const MenuPage: FC<RouteProps> = () => {
  const { navigate } = useRouter<AppRoutePath>();
  const routes = useRoutes();

  const menuItems = routes
    .map((route) => ({
      label: route.label,
      value: route.path,
      hotkey: route.hotkey,
      showInMenu: route.showInMenu ?? true,
    }))
    .filter((item) => item.showInMenu);

  const dimensions = useDimensions();
  const clientId = useCliStore.use.clientId();
  const isConnected = useConnectionStore.use.isConnected();
  const connect = useConnectionStore.use.connect();
  const isAuthenticated = useAuthStore.use.isAuthenticated();
  const selectedTunnelId = useTunnelStore.use.selectedTunnelId();
  const apiKey = useCliStore.use.apiKey();
  const pingEnabled = useCliStore.use.ping() !== false;

  useEffect(() => {
    if (!isConnected && selectedTunnelId && isAuthenticated && pingEnabled) {
      connect();
    }
  }, [isConnected, selectedTunnelId, connect, isAuthenticated, pingEnabled]);

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL}/${selectedTunnelId}`;

  return (
    <>
      <Box marginBottom={1}>
        <Ascii
          text="Unhook"
          width={dimensions.width}
          font="ANSI Shadow"
          color="gray"
        />
      </Box>
      <Box marginBottom={1} flexDirection="column">
        <Text dimColor>Client: {clientId}</Text>
        <Text dimColor>Tunnel: {selectedTunnelId}</Text>
        <Text dimColor>Api Key: {apiKey}</Text>
        <Text dimColor>Webhook URL: {webhookUrl}</Text>
        <Text dimColor>
          Platform: {platform()} {release()}
        </Text>
        <Text dimColor>Hostname: {hostname()}</Text>
      </Box>
      <Box marginBottom={1}>
        <ConnectionStatus />
      </Box>

      <Box flexDirection="column">
        <SelectInput<AppRoutePath>
          items={menuItems}
          onSelect={(item) => navigate(item.value)}
        />
      </Box>
    </>
  );
};
