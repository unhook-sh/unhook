import { Box } from 'ink';
import type { FC } from 'react';
import { SelectInput } from '~/components/select-input';
import { useRouter } from '~/lib/router';
import type { RouteProps } from '~/lib/router';
import type { AppRoutePath } from '../routes';
import { useRoutes } from '../routes';

export const MenuPage: FC<RouteProps> = () => {
  const { navigate } = useRouter<AppRoutePath>();
  const routes = useRoutes();

  const menuItems = routes
    .map((route) => ({
      label: route.label,
      value: route.path,
      hotkey: route.hotkey,
      showInMenu: route.showInMenu ?? true,
    }))
    .filter((item) => item.showInMenu);

  return (
    <Box flexDirection="column">
      <SelectInput<AppRoutePath>
        items={menuItems}
        onSelect={(item) => navigate(item.value)}
      />
    </Box>
  );
};
