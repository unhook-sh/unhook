export interface PageProps {
  port: number;
  apiKey: string;
  clientId: string;
  debug: boolean;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

export interface RequestItem {
  id: string;
  method: string;
  url: string;
  status: number;
  timestamp: number;
}

export type View = 'menu' | 'port' | 'requests';
