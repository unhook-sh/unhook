export interface PageProps {
  port: number;
  apiKey: string;
  clientId: string;
  debug: boolean;
  version: string;
}

export interface RequestItem {
  id: string;
  method: string;
  url: string;
  status: number;
  timestamp: number;
}

export type View = 'menu' | 'port' | 'requests';
