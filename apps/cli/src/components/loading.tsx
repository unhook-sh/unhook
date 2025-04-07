import { Box, Text } from 'ink';
import { Spinner } from './spinner';

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <Box>
      <Box marginRight={1}>
        <Spinner type="dots" color="gray" />
      </Box>
      <Text>{message}</Text>
    </Box>
  );
}
