import { useInput } from 'ink';
import { useCallback, useEffect, useState } from 'react';
import { capture } from '~/lib/posthog';
import { useTableStore } from '../store';
import type { KeyMapping, ScalarDict, TableAction } from '../types';

interface UseKeyboardNavigationProps<T extends ScalarDict> {
  data: T[];
  actions: TableAction<T>[];
  keyMapping: KeyMapping;
}

export function useKeyboardNavigation<T extends ScalarDict>({
  data,
  actions,
  keyMapping,
}: UseKeyboardNavigationProps<T>) {
  const navigateToIndex = useTableStore.use.navigateToIndex();
  const navigateToPage = useTableStore.use.navigateToPage();
  const selectedIndex = useTableStore.use.selectedIndex();
  const currentPage = useTableStore.use.currentPage();
  const pageSize = useTableStore.use.pageSize();
  const totalPages = Math.ceil(data.length / pageSize);

  const [gKeyPressed, setGKeyPressed] = useState(false);
  const [numberBuffer, setNumberBuffer] = useState('');
  const [gKeyTimeout, setGKeyTimeout] = useState<NodeJS.Timeout | null>(null);

  // Calculate half page size for Ctrl+U/D navigation
  const halfPageSize = Math.max(1, Math.floor(pageSize / 2));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (gKeyTimeout) {
        clearTimeout(gKeyTimeout);
      }
    };
  }, [gKeyTimeout]);

  const handleGKeyPress = useCallback(() => {
    if (gKeyPressed) {
      // Second 'g' press - go to top of current page
      const newIndex = currentPage * pageSize;
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: 'gg',
          hotkeyName: 'Go To Top',
          currentPage,
          newIndex,
          source: 'table',
        },
      });
      navigateToIndex(newIndex);
      setGKeyPressed(false);
      if (gKeyTimeout) clearTimeout(gKeyTimeout);
    } else {
      // First 'g' press - start timer
      setGKeyPressed(true);
      const timeout = setTimeout(() => {
        capture({
          event: 'hotkey_pressed',
          properties: {
            hotkey: 'g',
            hotkeyName: 'G Key Timeout',
            currentPage,
            source: 'table',
          },
        });
        setGKeyPressed(false);
        setNumberBuffer('');
      }, 1000); // Reset after 1 second
      setGKeyTimeout(timeout);
    }
  }, [gKeyPressed, gKeyTimeout, navigateToIndex, currentPage, pageSize]);

  const handleNumberInput = useCallback(
    (input: string) => {
      const newBuffer = numberBuffer + input;
      setNumberBuffer(newBuffer);
      if (gKeyTimeout) clearTimeout(gKeyTimeout);
      const timeout = setTimeout(() => {
        capture({
          event: 'hotkey_pressed',
          properties: {
            hotkey: `g${newBuffer}`,
            hotkeyName: 'Number Input Timeout',
            numberBuffer: newBuffer,
            currentPage,
            source: 'table',
          },
        });
        setGKeyPressed(false);
        setNumberBuffer('');
      }, 1000);
      setGKeyTimeout(timeout);
    },
    [numberBuffer, gKeyTimeout, currentPage],
  );

  const handleNumberNavigation = useCallback(() => {
    const lineNumber = Number.parseInt(numberBuffer, 10);
    if (!Number.isNaN(lineNumber)) {
      // Calculate the line number relative to the current page
      const pageRelativeIndex = Math.min(
        Math.max(0, lineNumber - 1),
        pageSize - 1,
      );
      const newIndex = currentPage * pageSize + pageRelativeIndex;
      // Only navigate if the index is within the current page's data
      if (newIndex < (currentPage + 1) * pageSize && newIndex < data.length) {
        capture({
          event: 'hotkey_pressed',
          properties: {
            hotkey: `g${numberBuffer}`,
            hotkeyName: 'Go To Line',
            lineNumber,
            currentPage,
            source: 'table',
          },
        });
        navigateToIndex(newIndex);
      }
    }
    setGKeyPressed(false);
    setNumberBuffer('');
    if (gKeyTimeout) clearTimeout(gKeyTimeout);
  }, [
    numberBuffer,
    gKeyTimeout,
    data.length,
    navigateToIndex,
    currentPage,
    pageSize,
  ]);

  useInput((input, key) => {
    const isUpKey =
      keyMapping.up?.includes(input) ||
      (key.upArrow && keyMapping.up?.includes('up'));
    const isDownKey =
      keyMapping.down?.includes(input) ||
      (key.downArrow && keyMapping.down?.includes('down')) ||
      input === ' ';
    const isPageUpKey =
      (key.ctrl && input === 'b') ||
      (!key.ctrl && !key.meta && !key.shift && input === 'b');
    const isPageDownKey =
      (key.ctrl && input === 'f') ||
      (!key.ctrl && !key.meta && !key.shift && input === 'f');
    const isHalfPageUpKey =
      (key.ctrl && input === 'u') ||
      (!key.ctrl && !key.meta && !key.shift && input === 'u');
    const isHalfPageDownKey =
      (key.ctrl && input === 'd') ||
      (!key.ctrl && !key.meta && !key.shift && input === 'd');
    const isNextPage =
      keyMapping.nextPage?.includes(input) ||
      (key.rightArrow && keyMapping.nextPage?.includes('right'));
    const isPrevPage =
      keyMapping.prevPage?.includes(input) ||
      (key.leftArrow && keyMapping.prevPage?.includes('left'));

    // Handle g key press
    if (input === 'g' && !key.ctrl && !key.meta && !key.shift) {
      handleGKeyPress();
      return;
    }

    // Handle G (shift+g) to go to bottom of current page
    if (key.shift && input === 'G') {
      const lastIndexInPage = Math.min(
        (currentPage + 1) * pageSize - 1,
        data.length - 1,
      );
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: 'G',
          hotkeyName: 'Go To Bottom',
          currentPage,
          source: 'table',
        },
      });
      navigateToIndex(lastIndexInPage);
      setGKeyPressed(false);
      setNumberBuffer('');
      return;
    }

    // Handle number input after 'g'
    if (gKeyPressed && /^[0-9]$/.test(input) && !key.ctrl && !key.meta) {
      handleNumberInput(input);
      return;
    }

    // Handle enter or g after number input
    if (gKeyPressed && numberBuffer && (key.return || input === 'g')) {
      handleNumberNavigation();
      return;
    }

    // Handle page navigation
    if (isNextPage) {
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: input || 'right',
          hotkeyName: 'Next Page',
          fromPage: currentPage,
          source: 'table',
        },
      });
      navigateToPage(currentPage + 1);
      return;
    }
    if (isPrevPage) {
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: input || 'left',
          hotkeyName: 'Previous Page',
          fromPage: currentPage,
          source: 'table',
        },
      });
      navigateToPage(currentPage - 1);
      return;
    }

    // Handle navigation keys
    if (isUpKey) {
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: input || 'up',
          hotkeyName: 'Move Up',
          fromIndex: selectedIndex,
          currentPage,
          source: 'table',
        },
      });
      if (selectedIndex % pageSize === 0 && currentPage > 0) {
        navigateToPage(currentPage - 1, { selectLast: true });
      } else if (selectedIndex > 0) {
        navigateToIndex(selectedIndex - 1);
      }
    } else if (isDownKey) {
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: input || 'down',
          hotkeyName: 'Move Down',
          fromIndex: selectedIndex,
          currentPage,
          source: 'table',
        },
      });
      if (
        (selectedIndex + 1) % pageSize === 0 &&
        currentPage < totalPages - 1
      ) {
        navigateToPage(currentPage + 1);
      } else if (selectedIndex < data.length - 1) {
        navigateToIndex(selectedIndex + 1);
      }
    } else if (isPageUpKey) {
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: 'ctrl+b',
          hotkeyName: 'Page Up',
          fromIndex: selectedIndex,
          currentPage,
          source: 'table',
        },
      });
      navigateToIndex(Math.max(0, selectedIndex - pageSize));
    } else if (isPageDownKey) {
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: 'ctrl+f',
          hotkeyName: 'Page Down',
          fromIndex: selectedIndex,
          currentPage,
          source: 'table',
        },
      });
      navigateToIndex(Math.min(data.length - 1, selectedIndex + pageSize));
    } else if (isHalfPageUpKey) {
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: 'ctrl+u',
          hotkeyName: 'Half Page Up',
          fromIndex: selectedIndex,
          currentPage,
          source: 'table',
        },
      });
      navigateToIndex(Math.max(0, selectedIndex - halfPageSize));
    } else if (isHalfPageDownKey) {
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: 'ctrl+d',
          hotkeyName: 'Half Page Down',
          fromIndex: selectedIndex,
          currentPage,
          source: 'table',
        },
      });
      navigateToIndex(Math.min(data.length - 1, selectedIndex + halfPageSize));
    } else {
      // Check for action hotkeys
      const action = actions.find(
        (a) =>
          a.key === input.toLowerCase() ||
          key[a.key as unknown as keyof typeof key],
      );
      if (action) {
        const selectedItem =
          selectedIndex >= 0 && selectedIndex < data.length
            ? data[selectedIndex]
            : null;
        if (selectedItem) {
          capture({
            event: 'hotkey_pressed',
            properties: {
              hotkey: action.key,
              hotkeyName: action.label,
              selectedIndex,
              currentPage,
              source: 'table',
            },
          });
          action.onAction(selectedItem, selectedIndex);
        }
      }
    }

    // Reset g key state if any other key is pressed
    if (input !== 'g' && gKeyPressed) {
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: 'g',
          abortedBy: input,
          hotkeyName: 'G Key Sequence Aborted',
          numberBuffer,
          currentPage,
          source: 'table',
        },
      });
      setGKeyPressed(false);
      setNumberBuffer('');
      if (gKeyTimeout) clearTimeout(gKeyTimeout);
    }
  });

  return {
    gKeyPressed,
    numberBuffer,
  };
}
