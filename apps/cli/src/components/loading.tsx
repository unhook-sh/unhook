import { Box, Text } from 'ink';
import { Spinner } from './spinner';

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <Box>
      <Box marginRight={1}>
        <Spinner color="gray" type="dots" />
      </Box>
      <Text>{message}</Text>
    </Box>
  );
}
