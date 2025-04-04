// biome-ignore lint/correctness/noUnusedImports: <explanation>
import React, { useState } from 'react';
import { hostname, platform, release } from 'node:os';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import type { FC } from 'react';

interface AppProps {
  port: number;
  apiKey: string;
  clientId: string;
  debug: boolean;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

interface MenuItem {
  label: string;
  value: string;
}

const menuItems: MenuItem[] = [
  {
    label: 'View Connection Status',
    value: 'status',
  },
  {
    label: 'Change Port',
    value: 'change-port',
  },
  {
    label: 'View Logs',
    value: 'logs',
  },
  {
    label: 'View Metrics',
    value: 'metrics',
  },
  {
    label: 'Exit',
    value: 'exit',
  },
];

export const App: FC<AppProps> = ({
  port,
  apiKey,
  clientId,
  debug,
  onAction,
}) => {
  const [view, setView] = useState<'menu' | 'port'>('menu');
  const [newPort, setNewPort] = useState(String(port));
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = (item: MenuItem) => {
    switch (item.value) {
      case 'change-port':
        setView('port');
        break;
      case 'exit':
        onAction('exit');
        break;
      default:
        setIsLoading(true);
        onAction(item.value);
        setIsLoading(false);
        break;
    }
  };

  const handlePortSubmit = (value: string) => {
    const portNumber = Number.parseInt(value, 10);
    if (!Number.isNaN(portNumber) && portNumber > 0 && portNumber < 65536) {
      onAction('change-port', { port: portNumber });
    }
    setView('menu');
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text color="cyan">▲ Tunnel CLI</Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
          <Text color="green">✓</Text> Connected to port {port}
        </Text>
      </Box>

      {view === 'menu' ? (
        <Box flexDirection="column">
          {isLoading ? (
            <Text>
              {/* <Spinner /> Loading... */}
              Loading...
            </Text>
          ) : (
            <SelectInput items={menuItems} onSelect={handleSelect} />
          )}
        </Box>
      ) : view === 'port' ? (
        <Box>
          <Text>Enter new port: </Text>
          <TextInput
            value={newPort}
            onChange={setNewPort}
            onSubmit={handlePortSubmit}
          />
        </Box>
      ) : null}

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Client ID: {clientId}</Text>
        <Text dimColor>
          Platform: {platform()} {release()}
        </Text>
        <Text dimColor>Hostname: {hostname()}</Text>
      </Box>
    </Box>
  );
};
