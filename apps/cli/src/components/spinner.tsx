import type { ForegroundColorName } from 'chalk';
import type { SpinnerName } from 'cli-spinners';
import spinners from 'cli-spinners';
import { Text } from 'ink';
import { useEffect, useState } from 'react';
import type { LiteralUnion } from 'type-fest';

export function Spinner({
  type = 'dots',
  color,
  dimColor = false,
  bold = false,
}: {
  type?: SpinnerName;
  color?: LiteralUnion<ForegroundColorName, string>;
  dimColor?: boolean;
  bold?: boolean;
}) {
  const [frame, setFrame] = useState(0);
  const spinner = spinners[type];

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((previousFrame) => {
        const isLastFrame = previousFrame === spinner.frames.length - 1;
        return isLastFrame ? 0 : previousFrame + 1;
      });
    }, spinner.interval);

    return () => {
      clearInterval(timer);
    };
  }, [spinner]);

  return (
    <Text color={color} dimColor={dimColor} bold={bold}>
      {spinner.frames[frame]}
    </Text>
  );
}
