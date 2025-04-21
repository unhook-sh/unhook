import { debug } from '@unhook/logger';
import { type FC, useEffect } from 'react';
import { type CliState, useCliStore } from '~/stores/cli-store';

const log = debug('unhook:cli:cli-config-context');

export interface CliConfigProviderProps {
  config: CliState;
  children: React.ReactNode;
}

export const CliConfigProvider: FC<CliConfigProviderProps> = ({
  config,
  children,
}) => {
  const setCliArgs = useCliStore.use.setCliArgs();
  const { tunnelId, clientId, debug, version } = config;

  log('CliConfigProvider received args:', {
    tunnelId,
    clientId,
  });

  useEffect(() => {
    log('Setting CLI args with tunnelId:', tunnelId);
    setCliArgs({
      tunnelId,
      clientId,
      debug,
      version,
    } as Partial<CliState>);
  }, [tunnelId, clientId, debug, version, setCliArgs]);

  return <>{children}</>;
};
