import { arch, cpus, freemem, totalmem, type, uptime } from 'node:os';
import { env } from 'node:process';
import { Box, Text } from 'ink';
import type { FC } from 'react';
import type { RouteProps } from '~/stores/router-store';

export const DebugPage: FC<RouteProps> = () => {
  const cpuInfo = cpus();
  const systemInfo = {
    memory: {
      total: `${(totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      free: `${(freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      used: `${((totalmem() - freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB`,
    },
    cpu:
      cpuInfo.length > 0 ? (cpuInfo[0]?.model ?? 'Unknown CPU') : 'Unknown CPU',
    cpuCount: cpuInfo.length,
    osType: type(),
    architecture: arch(),
    uptime: `${(uptime() / 60 / 60).toFixed(2)} hours`,
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        <Text bold>System Information</Text>
        <Box flexDirection="column" marginLeft={2}>
          <Text>CPU: {systemInfo.cpu}</Text>
          <Text>CPU Count: {systemInfo.cpuCount}</Text>
          <Text>OS Type: {systemInfo.osType}</Text>
          <Text>Architecture: {systemInfo.architecture}</Text>
          <Text>Uptime: {systemInfo.uptime}</Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text bold>Memory</Text>
        <Box flexDirection="column" marginLeft={2}>
          <Text>Total: {systemInfo.memory.total}</Text>
          <Text>Free: {systemInfo.memory.free}</Text>
          <Text>Used: {systemInfo.memory.used}</Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text bold>Process Info</Text>
        <Box flexDirection="column" marginLeft={2}>
          <Text>PID: {process.pid}</Text>
          <Text>Node Version: {process.version}</Text>
          <Text>Platform: {process.platform}</Text>
          <Text>Arch: {process.arch}</Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text bold>Environment Variables</Text>
        <Box flexDirection="column" marginLeft={2}>
          {Object.entries(env)
            .filter(([key]) => !key.includes('SECRET') && !key.includes('KEY'))
            .map(([key, value]) => (
              <Text key={key}>
                {key}: {value}
              </Text>
            ))}
        </Box>
      </Box>
    </Box>
  );
};
