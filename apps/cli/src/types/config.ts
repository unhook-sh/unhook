import type { PageProps, PagePropsExclusive } from '../types';

export type CliConfig = {
  port?: number;
  redirect?: string;
  tunnelId: string;
  clientId: string;
  debug: boolean;
  telemetry: boolean;
  ping: boolean | string | number;
  version: string;
};

export interface ParsedConfig {
  props: Omit<PageProps, keyof PagePropsExclusive>;
  exclusiveProps: PagePropsExclusive;
}
