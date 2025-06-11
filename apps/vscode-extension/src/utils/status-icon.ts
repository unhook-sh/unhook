import { EventItem } from '../tree-items/event.item';
import type { RequestItem } from '../tree-items/request.item';

export function getStatusIcon(item: EventItem | RequestItem): string {
  const status = getStatusCode(item);

  switch (status) {
    case 200:
      return '✅';
    case 401:
      return '❌';
    case 404:
      return '⦸';
    case 102:
      return '⟳';
    default:
      return '◯';
  }
}

function getStatusCode(item: EventItem | RequestItem): number | undefined {
  if (item instanceof EventItem) {
    switch (item.event.status) {
      case 'completed':
        return 200;
      case 'failed':
        return 404;
      case 'processing':
        return 102;
      default:
        return undefined;
    }
  }
  return item.request.response?.status;
}
