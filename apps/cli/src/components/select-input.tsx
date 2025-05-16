import figures from 'figures';
import { Box, Text, useInput } from 'ink';
import { type ReactNode, useState } from 'react';
import { capture } from '~/lib/posthog';

interface KeyMapping {
  up?: string[];
  down?: string[];
  select?: string[];
}

export interface MenuItem<T extends string = string> {
  label: string | ReactNode;
  value: T;
  hotkey?: string;
}

interface SelectInputProps<T extends string = string> {
  items: MenuItem<T>[];
  onSelect: (item: MenuItem<T>) => void;
  highlightColor?: string;
  indicatorComponent?: string;
  renderItem?: (item: MenuItem<T>, isSelected: boolean) => ReactNode;
  keyMapping?: KeyMapping;
  showHotkeys?: boolean;
  initialIndex?: number;
}

export const SelectInput = <T extends string = string>({
  items,
  onSelect,
  indicatorComponent = figures.pointer,
  renderItem,
  keyMapping = {
    up: ['k', 'up'],
    down: ['j', 'down'],
    select: ['return'],
  },
  showHotkeys = true,
  initialIndex = 0,
}: SelectInputProps<T>) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useInput((input, key) => {
    // Check for item hotkeys first
    const hotkeyItem = items.find((item) => item.hotkey === input);
    if (hotkeyItem) {
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: input,
          hotkeyName:
            typeof hotkeyItem.label === 'string' ? hotkeyItem.label : 'Unknown',
          itemValue: hotkeyItem.value,
          source: 'select_input',
        },
      });
      onSelect(hotkeyItem);
      return;
    }

    const isUpKey =
      keyMapping.up?.includes(input) ||
      (key.upArrow && keyMapping.up?.includes('up'));
    const isDownKey =
      keyMapping.down?.includes(input) ||
      (key.downArrow && keyMapping.down?.includes('down'));
    const isSelectKey = keyMapping.select?.includes('return')
      ? key.return
      : keyMapping.select?.includes(input);

    if (isUpKey) {
      capture({
        event: 'navigation_key_pressed',
        properties: {
          key: input || 'up',
          direction: 'up',
          currentIndex: selectedIndex,
          source: 'select_input',
        },
      });
      setSelectedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : prevIndex,
      );
    } else if (isDownKey) {
      capture({
        event: 'navigation_key_pressed',
        properties: {
          key: input || 'down',
          direction: 'down',
          currentIndex: selectedIndex,
          source: 'select_input',
        },
      });
      setSelectedIndex((prevIndex) =>
        prevIndex < items.length - 1 ? prevIndex + 1 : prevIndex,
      );
    } else if (isSelectKey) {
      const selectedItem = items[selectedIndex];
      if (selectedItem) {
        capture({
          event: 'hotkey_pressed',
          properties: {
            hotkey: 'return',
            hotkeyName: 'Select',
            itemValue: selectedItem.value,
            itemLabel:
              typeof selectedItem.label === 'string'
                ? selectedItem.label
                : 'Unknown',
            source: 'select_input',
          },
        });
        onSelect(selectedItem);
      }
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;

        if (renderItem) {
          return (
            <Box key={item.value} marginY={0}>
              {renderItem(item, isSelected)}
            </Box>
          );
        }

        return (
          <Box key={item.value} marginY={0}>
            <Box>
              <Text>{isSelected ? `${indicatorComponent} ` : '  '}</Text>
              {typeof item.label === 'string' ? (
                <Text>{item.label}</Text>
              ) : (
                item.label
              )}
              {showHotkeys && item.hotkey && (
                <Text color="cyan" dimColor>
                  {' '}
                  ({item.hotkey})
                </Text>
              )}
            </Box>
          </Box>
        );
      })}
      {items.length > 0 && (
        <Box marginTop={1}>
          <Text dimColor>
            Press{' '}
            <Text color="cyan">
              {[...(keyMapping.up ?? []), ...(keyMapping.down ?? [])].join('/')}
            </Text>{' '}
            to navigate,{' '}
            <Text color="cyan">{keyMapping.select?.join('/')}</Text> to select
            {items.some((item) => item.hotkey) &&
              ' or press hotkey to select directly'}
          </Text>
        </Box>
      )}
    </Box>
  );
};
