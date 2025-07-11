import { Box, Text } from 'ink';
import { useRouterStore } from '~/stores/router-store';
import type { AppRoute } from '../routes';

interface HotkeyInfo {
  key: string;
  description: string;
}

const GLOBAL_HOTKEYS: HotkeyInfo[] = [
  { description: 'Show this hotkeys help', key: '?' },
  { description: 'Show help page', key: 'h' },
  { description: 'Go back to previous page', key: 'ESC' },
];

const NAVIGATION_HOTKEYS: HotkeyInfo[] = [
  { description: 'Move down', key: 'j/down' },
  { description: 'Move up', key: 'k/up' },
  { description: 'Scroll down', key: 'space' },
  { description: 'Go to top', key: 'gg' },
  { description: 'Go to bottom', key: 'G' },
  { description: 'Go to line', key: 'g<number>g' },
  { description: 'Page up/down', key: 'Ctrl+b/f' },
  { description: 'Half page up/down', key: 'Ctrl+u/d' },
];

export function HotkeysPage() {
  const routes = useRouterStore.use.routes();
  const menuHotkeys = routes
    .filter((route): route is AppRoute & { hotkey: string } =>
      Boolean(route.hotkey && route.showInMenu !== false),
    )
    .map((route) => ({
      description: route.label,
      key: route.hotkey,
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
