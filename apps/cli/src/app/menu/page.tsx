import { Box, useApp } from 'ink';
import type { FC } from 'react';
import { SelectInput } from '~/components/select-input';
import { useRouter } from '~/lib/router';
import type { RouteProps } from '~/lib/router';
import { useSelectionStore } from '~/lib/store';
import type { AppRoutePath } from '../routes';
import { routes } from '../routes';

type MenuAction = AppRoutePath | 'exit';

export const MenuPage: FC<RouteProps> = () => {
  const { navigate } = useRouter<AppRoutePath>();
  const app = useApp();
  const selectedIndex = useSelectionStore(
    (state) => state.selectedIndices.menu,
  );

  const handleSelect = (item: { value: MenuAction }) => {
    if (item.value === 'exit') {
      // app.exit();
      return;
    }
    navigate(item.value);
  };

  const menuItems = [
    ...routes
      .map((route) => ({
        label: route.label,
        value: route.path,
        hotkey: route.hotkey,
      }))
      .filter((item) => item.label !== 'Menu'),
    {
      label: 'Exit',
      value: 'exit' as const,
      hotkey: 'e',
    },
  ];

  return (
    <Box flexDirection="column">
      <SelectInput<MenuAction>
        items={menuItems}
        onSelect={handleSelect}
        initialIndex={selectedIndex}
      />
    </Box>
  );
};
