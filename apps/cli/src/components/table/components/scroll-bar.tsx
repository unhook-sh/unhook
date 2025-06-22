import { Box, Text } from 'ink';
import { useTableStore } from '../store';

export function Scrollbar() {
  const currentPage = useTableStore.use.currentPage();
  const pageSize = useTableStore.use.pageSize();
  const data = useTableStore.use.data();
  const totalCount = useTableStore.use.totalCount?.() ?? undefined;
  const total = totalCount ?? data.length;
  const totalPages = Math.ceil(total / pageSize);
  const thumbHeight = Math.max(1, Math.floor(pageSize / totalPages));

  // When on last page, ensure thumb is at bottom
  const thumbPosition =
    currentPage === totalPages - 1
      ? pageSize - thumbHeight
      : Math.floor((currentPage / (totalPages - 1)) * (pageSize - thumbHeight));

  return (
    <Box flexDirection="column" marginLeft={1}>
      {Array.from({ length: pageSize }).map((_, i) => {
        const isThumb = i >= thumbPosition && i < thumbPosition + thumbHeight;
        return (
          <Text
            key={`scrollbar-page-${currentPage}-pos-${
              // biome-ignore lint/suspicious/noArrayIndexKey: Array index is stable here since we're mapping over a fixed slice of children
              i
            }`}
            color="gray"
          >
            {isThumb ? '┃' : '│'}
          </Text>
        );
      })}
    </Box>
  );
}
