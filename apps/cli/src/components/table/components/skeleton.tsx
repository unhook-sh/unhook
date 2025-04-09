import { Text } from 'ink';
import type { PropsWithChildren } from 'react';

export function Skeleton({ children }: PropsWithChildren) {
  return <Text color="gray">{children}</Text>;
}
