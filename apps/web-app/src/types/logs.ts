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
  details: {
    request: {
      method: string;
      url: string;
      headers: Record<string, string>;
    };
    response: {
      status: number;
      headers: Record<string, string>;
      body: Record<string, unknown>;
    };
    headers: Record<string, string>;
  };
}
