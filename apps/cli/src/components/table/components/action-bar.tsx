import { Box, Text } from 'ink';
import { Fragment } from 'react';
import { useTableStore } from '../store';
import type { ScalarDict, TableAction } from '../types';

interface ActionBarProps<T extends ScalarDict> {
  actions: TableAction<T>[];
}

export function ActionBar<T extends ScalarDict>({
  actions,
}: ActionBarProps<T>) {
  const currentPage = useTableStore.use.currentPage();
  const data = useTableStore.use.data();
  const pageSize = useTableStore.use.pageSize();
  const gKeyPressed = useTableStore.use.gKeyPressed();
  const numberBuffer = useTableStore.use.numberBuffer();

  const totalPages = Math.ceil(data.length / pageSize);

  return (
    <Box marginTop={1} flexDirection="column">
      <Text dimColor>
        {actions.length > 0 &&
          actions
            .map((a) => (
              <Text key={a.key}>
                <Text color="cyan">{a.key}</Text> to {a.label.toLowerCase()}
              </Text>
            ))
            .reduce((prev, curr) => (
              <Fragment key={`${prev.key}-${curr.key}`}>
                {prev}, {curr}
              </Fragment>
            ))}
      </Text>
      {totalPages > 1 && (
        <Text dimColor>
          Page {currentPage + 1}/{totalPages} (<Text color="cyan">h/l</Text> or{' '}
          <Text color="cyan">←/→</Text> to navigate pages)
        </Text>
      )}
      {gKeyPressed && numberBuffer && (
        <Box marginTop={1}>
          <Text color="yellow">Go to line: {numberBuffer}</Text>
        </Box>
      )}
    </Box>
  );
}
