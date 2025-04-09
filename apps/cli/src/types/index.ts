// Define the base properties common to all page props
interface PagePropsBase {
  apiKey: string;
  clientId: string;
  debug: boolean;
  version: string;
  ping: boolean | string | number;
}

// Define the mutually exclusive properties for port/redirect
export type PagePropsExclusive =
  | { port: number; redirect?: never }
  | { port?: never; redirect: string };

// Combine base and exclusive properties into the final PageProps type
export type PageProps = PagePropsBase & PagePropsExclusive;

export interface RequestItem {
  id: string;
  method: string;
  url: string;
  status: number;
  timestamp: number;
}

export type View = 'menu' | 'port' | 'requests';
