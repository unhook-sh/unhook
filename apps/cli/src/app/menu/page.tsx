import { Box } from 'ink';
import type { FC } from 'react';
import { SelectInput } from '~/components/select-input';
import { useRouter } from '~/lib/router';
import type { RouteProps } from '~/lib/router';
import { useSelectionStore } from '~/lib/store';
import type { AppRoutePath } from '../routes';
import { useRoutes } from '../routes';

export const MenuPage: FC<RouteProps> = () => {
  const { navigate } = useRouter<AppRoutePath>();
  const routes = useRoutes();
  const selectedIndex = useSelectionStore(
    (state) => state.selectedIndices.menu,
  );

  const menuItems = routes
    .map((route) => ({
      label: route.label,
      value: route.path,
      hotkey: route.hotkey,
    }))
    .filter((item) => item.label !== 'Menu');

  return (
    <Box flexDirection="column">
      <SelectInput<AppRoutePath>
        items={menuItems}
        onSelect={(item) => navigate(item.value)}
        initialIndex={selectedIndex}
      />
    </Box>
  );
};
