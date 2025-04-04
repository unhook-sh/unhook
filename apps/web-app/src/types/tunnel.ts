export interface Tunnel {
  id: string;
  forwardingAddress: string;
  createdAt: string;
  lastActivity?: string;
  status: 'active' | 'inactive';
  localPort: number;
  metrics?: {
    invocations: number;
    errorRate: number;
    requestsHandled: number;
    avgResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    bandwidthUsed: number;
    statusCodes?: {
      '200': number;
      '201': number;
      '204': number;
      '400': number;
      '401': number;
      '404': number;
      '500': number;
    };
    topPaths?: {
      path: string;
      count: number;
      avgLatency: number;
    }[];
  };
}
