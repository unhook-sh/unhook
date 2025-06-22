import { Box, Text } from 'ink';
import { type ReactNode, useEffect, useState } from 'react';
import { Thumb } from './thumb';

interface ScrollbarProps {
  children: ReactNode[];
  current?: number;
  thumbCharacter?: string;
  highlight?: boolean | Record<string, unknown>;
  padding?: number;
  show?: number;
}

export function Scrollbar({
  children,
  current = 0,
  thumbCharacter = '┃',
  highlight = false,
  padding = 1,
  show = 1,
}: ScrollbarProps) {
  const limit = Math.min(show, children.length);
  const [viewpoint, setViewpoint] = useState(
    Math.min(
      Math.max(0, current - Math.floor(limit / 2)),
      children.length - limit,
    ),
  );
  const [maxLength, setMaxLength] = useState(0);

  // Update maxLength when children change
  useEffect(() => {
    const lengths = children.map((child) => {
      if (typeof child === 'string') return child.length;
      // For non-string children, render to get length
      const text = child?.toString() || '';
      return text.length;
    });
    setMaxLength(Math.max(...lengths));
  }, [children]);

  // Update viewpoint when current changes
  useEffect(() => {
    if (current < viewpoint) {
      setViewpoint(current);
    } else if (current >= viewpoint + limit) {
      setViewpoint(Math.min(current - limit + 1, children.length - limit));
    }
  }, [current, limit, viewpoint, children.length]);

  // Calculate scrollbar positions
  const getScrollbar = () => {
    const height = Math.max(Math.round((limit / children.length) * limit), 1);
    if (height === limit) return [];

    const pos = Math.min(
      Math.round((viewpoint / children.length) * limit),
      limit - 1,
    );
    return Array.from({ length: height }, (_, i) => pos + i);
  };

  // Get highlighted or plain option
  const getOption = (option: ReactNode, index: number) => {
    if (!highlight || current !== index + viewpoint) {
      return option;
    }

    const props = highlight === true ? { color: 'green' } : highlight;
    return <Text {...props}>{option}</Text>;
  };

  // Calculate spacing for alignment
  const getSpacing = (option: ReactNode) => {
    const length =
      typeof option === 'string'
        ? option.length
        : option?.toString().length || 0;
    return ' '.repeat(maxLength - length + padding);
  };

  const scrollbar = getScrollbar();
  const visibleChildren = children.slice(viewpoint, viewpoint + limit);

  return (
    <Box flexDirection="column">
      {visibleChildren.map((option, i) => (
        <Box
          key={`scrollbar-${
            // biome-ignore lint/suspicious/noArrayIndexKey: Array index is stable here since we're mapping over a fixed slice of children
            i
          }`}
        >
          {getOption(option, i)}
          <Text>{getSpacing(option)}</Text>
          <Thumb thumbCharacter={thumbCharacter} show={scrollbar.includes(i)} />
        </Box>
      ))}
    </Box>
  );
}
