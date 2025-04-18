import { Box, Text } from 'ink';
import { useRouterStore } from '~/stores/router-store';
import type { AppRoute } from '../routes';

interface HotkeyInfo {
  key: string;
  description: string;
}

const GLOBAL_HOTKEYS: HotkeyInfo[] = [
  { key: '?', description: 'Show this hotkeys help' },
  { key: 'h', description: 'Show help page' },
  { key: 'ESC', description: 'Go back to previous page' },
];

const NAVIGATION_HOTKEYS: HotkeyInfo[] = [
  { key: 'j/down', description: 'Move down' },
  { key: 'k/up', description: 'Move up' },
  { key: 'space', description: 'Scroll down' },
  { key: 'gg', description: 'Go to top' },
  { key: 'G', description: 'Go to bottom' },
  { key: 'g<number>g', description: 'Go to line' },
  { key: 'Ctrl+b/f', description: 'Page up/down' },
  { key: 'Ctrl+u/d', description: 'Half page up/down' },
];

export function HotkeysPage() {
  const routes = useRouterStore.use.routes();
  const menuHotkeys = routes
    .filter((route): route is AppRoute & { hotkey: string } =>
      Boolean(route.hotkey && route.showInMenu !== false),
    )
    .map((route) => ({
      key: route.hotkey,
      description: route.label,
    }));

  const renderHotkeySection = (title: string, hotkeys: HotkeyInfo[]) => (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="blue">
        {title}
      </Text>
      {hotkeys.map((hotkey) => (
        <Box key={hotkey.key}>
          <Box width={12}>
            <Text bold color="cyan">
              {hotkey.key}
            </Text>
          </Box>
          <Text>{hotkey.description}</Text>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Keyboard Shortcuts</Text>
      <Box marginY={1}>
        <Text dimColor>Press ESC to go back</Text>
      </Box>

      {renderHotkeySection('Global Shortcuts', GLOBAL_HOTKEYS)}
      {renderHotkeySection('Navigation', NAVIGATION_HOTKEYS)}
      {renderHotkeySection('Menu Actions', menuHotkeys)}
    </Box>
  );
}
