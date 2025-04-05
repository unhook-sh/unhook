import figures from 'figures';
import { Box, Text, useInput } from 'ink';
import { type ReactNode, useState } from 'react';

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
  highlightColor = 'blue',
  indicatorComponent = figures.pointer,
  renderItem,
  keyMapping = {
    up: ['k', 'up'],
    down: ['j', 'down'],
    select: ['return'],
  },
  showHotkeys = true,
  initialIndex = -1,
}: SelectInputProps<T>) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useInput((input, key) => {
    // Check for item hotkeys first
    const hotkeyItem = items.find((item) => item.hotkey === input);
    if (hotkeyItem) {
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
      setSelectedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : prevIndex,
      );
    } else if (isDownKey) {
      setSelectedIndex((prevIndex) =>
        prevIndex < items.length - 1 ? prevIndex + 1 : prevIndex,
      );
    } else if (isSelectKey) {
      const selectedItem = items[selectedIndex];
      if (selectedItem) {
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
            <Text>
              <Text color={isSelected ? highlightColor : undefined}>
                {isSelected ? `${indicatorComponent} ` : '  '}
                {typeof item.label === 'string' ? item.label : null}
                {showHotkeys && item.hotkey && (
                  <Text color="cyan" dimColor>
                    {' '}
                    ({item.hotkey})
                  </Text>
                )}
              </Text>
            </Text>
          </Box>
        );
      })}
      <Box marginTop={1}>
        <Text dimColor>
          Press{' '}
          <Text color="cyan">
            {[...(keyMapping.up ?? []), ...(keyMapping.down ?? [])].join('/')}
          </Text>{' '}
          to navigate, <Text color="cyan">{keyMapping.select?.join('/')}</Text>{' '}
          to select
          {items.some((item) => item.hotkey) &&
            ' or press hotkey to select directly'}
        </Text>
      </Box>
    </Box>
  );
};
