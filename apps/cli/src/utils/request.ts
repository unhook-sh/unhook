import type { MenuItem } from '~/components/select-input';
import type { RequestItem } from '../types';

import type { RequestType } from '@acme/db/schema';

export function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 1000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;

  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}

export function requestsToMenuItems(requests: RequestItem[]): MenuItem[] {
  return requests.map((req) => ({
    label: `${req.method} ${req.url.length > 30 ? `${req.url.substring(0, 30)}...` : req.url} ${req.status} ${formatTime(req.timestamp)}`,
    value: req.id,
    hotkey: '',
  }));
}

export function requestToTableData(request: RequestType, isSelected: boolean) {
  return {
    selected: isSelected ? '→' : '',
    method: request.request.method,
    url:
      request.request.url.length > 35
        ? `${request.request.url.substring(0, 35)}...`
        : request.request.url,
    status: request.status,
    time: formatTime(request.createdAt.getTime()),
    id: request.id,
    isSelected,
  };
}

export function generateMockRequest(): RequestItem {
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const statuses = [200, 201, 204, 400, 401, 403, 404, 500];
  const paths = [
    '/users',
    '/products',
    '/orders',
    '/auth/login',
    '/health',
    '/metrics',
  ];

  return {
    id: `req_${Date.now()}`,
    method: methods[Math.floor(Math.random() * methods.length)] || 'GET',
    url: `https://api.example.com${paths[Math.floor(Math.random() * paths.length)]}`,
    status: statuses[Math.floor(Math.random() * statuses.length)] || 200,
    timestamp: Date.now(),
  };
}
