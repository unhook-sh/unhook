export interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  status: number;
  host: string;
  path: string;
  request: string;
  level: string;
  userAgent: string;
  location: string;
  searchParams: { [key: string]: string };
  externalApis: { method: string; url: string; status: number }[];
  details: Record<string, unknown>;
}
