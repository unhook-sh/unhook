import { useFocusManager } from 'ink';
import { useCallback, useEffect, useState } from 'react';
import type { ScalarDict } from '../types';

interface UseTableSelectionProps<T extends ScalarDict> {
  data: T[];
  initialIndex: number;
  onSelectionChange?: (index: number) => void;
}

export function useTableSelection<T extends ScalarDict>({
  data,
  initialIndex,
  onSelectionChange,
}: UseTableSelectionProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const { focus } = useFocusManager();

  // Initialize selection if not set and we have data
  useEffect(() => {
    if (selectedIndex === -1 && data.length > 0) {
      const newIndex = 0;
      setSelectedIndex(newIndex);
      onSelectionChange?.(newIndex);
    }
  }, [data.length, selectedIndex, onSelectionChange]);

  const handleNavigate = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      onSelectionChange?.(index);
      focus(`row-${index}`);
    },
    [focus, onSelectionChange],
  );

  return {
    selectedIndex,
    handleNavigate,
  };
}
