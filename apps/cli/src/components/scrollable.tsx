import { Box, type BoxProps, useInput } from 'ink';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useDimensions } from '~/hooks/use-dimensions';

interface ScrollableProps extends BoxProps {
  children: React.ReactNode;
  height?: number;
}

export function Scrollable({
  children,
  height: propHeight,
  ...props
}: ScrollableProps) {
  const dimensions = useDimensions();
  const [scrollTop, setScrollTop] = useState(0);
  const height = propHeight ?? dimensions.height - 2; // Default to terminal height minus margins

  useInput((_input, key) => {
    // Only handle scroll when holding shift
    if (!key.shift) {
      return;
    }

    if (key.upArrow && scrollTop > 0) {
      setScrollTop((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setScrollTop((prev) => prev + 1);
    }
    if (key.pageUp) {
      setScrollTop((prev) => Math.max(0, prev - height));
    }
    if (key.pageDown) {
      setScrollTop((prev) => prev + height);
    }
  });

  // Reset scroll position when content changes
  useEffect(() => {
    setScrollTop(0);
  }, []);

  return (
    <Box flexDirection="column" height={height} overflow="hidden" {...props}>
      <Box
        flexDirection={props.flexDirection ?? 'column'}
        marginTop={-scrollTop}
      >
        {children}
      </Box>
    </Box>
  );
}
