import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import type { FC } from 'react';
import { useState } from 'react';
import type { RouteProps } from '~/lib/router';
import { useRouter } from '~/lib/router';

export const PortPage: FC<RouteProps> = () => {
  const { navigate } = useRouter();
  const [currentPort, setCurrentPort] = useState('');

  const handleSubmit = (value: string) => {
    const portNumber = Number.parseInt(value, 10);
    if (!Number.isNaN(portNumber) && portNumber > 0 && portNumber < 65536) {
      // TODO: Handle port change through a global state or context
      navigate('/');
    }
  };

  return (
    <Box>
      <Box marginRight={1}>
        <Text>Enter new port:</Text>
      </Box>
      <TextInput
        value={currentPort}
        onChange={setCurrentPort}
        onSubmit={handleSubmit}
      />
    </Box>
  );
};
