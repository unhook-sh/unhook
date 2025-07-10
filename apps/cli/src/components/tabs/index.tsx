import { debug } from '@unhook/logger';
import { createSelectors } from '@unhook/zustand';
import { Box, Text, type TextProps, useInput } from 'ink';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { createStore } from 'zustand';
import { useDimensions } from '~/hooks/use-dimensions';

const log = debug('unhook:cli:tabs');

export type TabsTriggerProps = {
  value: string;
  color?: TextProps['color'];
  children: string;
};

// Define the store for managing active tab state
interface TabsState {
  activeTabIndex: number;
  direction: 'row' | 'column';
  tabValues: string[]; // New state to track all tab values
  activeTab: string | undefined;
  defaultTab: string | undefined;
  setDefaultTab: (tab: string) => void;
  setActiveTabIndex: (index: number) => void;
  setDirection: (direction: 'row' | 'column') => void;
  onChangeHandler: (tab: string) => void;
  setOnChangeHandler: (onChangeHandler: (tab: string) => void) => void;
  setTabValues: (values: string[]) => void; // New setter for tab values
}

const store = createStore<TabsState>()((set, get) => ({
  activeTab: undefined,
  activeTabIndex: 0,
  defaultTab: undefined,
  direction: 'row',
  onChangeHandler: (_tab: string) => () => {},
  setActiveTabIndex: (index: number) => {
    const newActiveTab = get().tabValues[index];
    const currentActiveTab = get().activeTab;

    set({ activeTab: newActiveTab, activeTabIndex: index });
    log('store: setActiveTabIndex', newActiveTab, currentActiveTab, index);

    if (newActiveTab !== undefined && newActiveTab !== currentActiveTab) {
      get().onChangeHandler(newActiveTab);
    }
  },
  setDefaultTab: (tab: string) => set({ defaultTab: tab }),
  setDirection: (direction: 'row' | 'column') => set({ direction }),
  setOnChangeHandler: (onChangeHandler: (tab: string) => void) =>
    set({ onChangeHandler }), // Default to first tab
  setTabValues: (values: string[]) => set({ tabValues: values }),
  tabValues: [],
}));

const useTabsStore = createSelectors(store);

export function Tabs({
  children,
  direction = 'row',
  onChange,
}: {
  children: React.ReactElement[];
  defaultValue?: string;
  direction?: 'row' | 'column';
  onChange: (tab: string) => void;
}) {
  const dimensions = useDimensions();
  const _initialized = useRef(false);

  const setOnChangeHandler = useTabsStore.use.setOnChangeHandler();
  const setDirection = useTabsStore.use.setDirection();
  const setTabValues = useTabsStore.use.setTabValues();
  const _setDefaultTab = useTabsStore.use.setDefaultTab();
  const _setActiveTabIndex = useTabsStore.use.setActiveTabIndex();

  useEffect(() => {
    setDirection(direction);
  }, [direction, setDirection]);

  useEffect(() => {
    setOnChangeHandler(onChange);
  }, [onChange, setOnChangeHandler]);

  useEffect(() => {
    const values = children
      .map((child) => (child.props as TabsTriggerProps).value)
      .filter((value) => value !== undefined);

    setTabValues(values);

    // if (!initialized.current || defaultValue) {
    //   if (defaultValue) {
    //     log('Tabs: setting default tab', defaultValue);
    //     setDefaultTab(defaultValue);
    //     const index = values.indexOf(defaultValue);
    //     log('Tabs: setting default tab index', values, defaultValue, index);
    //     setActiveTabIndex(index);
    //   }
    //   initialized.current = true;
    // }
  }, [children, setTabValues]);

  return (
    <Box
      flexDirection={direction === 'row' ? 'column' : 'row'}
      gap={1}
      width={dimensions.width}
    >
      {children}
    </Box>
  );
}

export function TabsList({
  children,
}: {
  children: React.ReactElement<typeof TabsTrigger>[];
}) {
  const direction = useTabsStore.use.direction();
  const activeTabIndex = useTabsStore.use.activeTabIndex();
  const setActiveTabIndex = useTabsStore.use.setActiveTabIndex();
  const tabValues = useTabsStore.use.tabValues();

  useInput((_input, key) => {
    if (key.leftArrow) {
      const newIndex = (activeTabIndex - 1) % children.length;
      log('TabList: leftArrow', newIndex, tabValues[newIndex]);
      setActiveTabIndex(newIndex);
      if (tabValues[newIndex] !== undefined) {
        // onChangeHandler(tabValues[newIndex]);
      }
    }
    if (key.rightArrow) {
      const newIndex = (activeTabIndex + 1) % children.length;
      log('TabList: rightArrow', newIndex, tabValues[newIndex]);
      setActiveTabIndex(newIndex);
      if (tabValues[newIndex] !== undefined) {
        // onChangeHandler(tabValues[newIndex]);
      }
    }
    if (key.tab) {
      const newIndex = (activeTabIndex + 1) % children.length;
      log('TabList: tab', newIndex, tabValues[newIndex]);
      setActiveTabIndex(newIndex);
      if (tabValues[newIndex] !== undefined) {
        // onChangeHandler(tabValues[newIndex]);
      }
    }
  });

  return (
    <Box flexDirection={direction}>
      {children.map((child, index) => {
        const props = child.props as unknown as TabsTriggerProps;

        const isActive = activeTabIndex === index;

        return (
          <Box gap={1} key={props.value}>
            {index !== 0 && <Text dimColor> | </Text>}
            <Box
              borderBottom={isActive}
              // borderStyle={isActive ? 'single' : undefined}
              paddingBottom={isActive ? 0 : 1}
            >
              {child}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export function TabsTrigger({
  value,
  color = 'white',
  children,
}: TabsTriggerProps) {
  const activeTab = useTabsStore.use.activeTab();

  return (
    <Text color={color} dimColor={activeTab !== value}>
      {children}
    </Text>
  );
}

export function TabsContent({
  children,
  value,
}: {
  children: React.ReactNode;
  value: string;
}) {
  const activeTab = useTabsStore.use.activeTab();

  if (activeTab === value) return children;

  return null;
}
