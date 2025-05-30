import { WebhookEventItem } from '../tree-items/webhook-event.item';
import type { WebhookRequestItem } from '../tree-items/webhook-request.item';

export function getStatusIcon(
  item: WebhookEventItem | WebhookRequestItem,
): string {
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

function getStatusCode(
  item: WebhookEventItem | WebhookRequestItem,
): number | undefined {
  if (item instanceof WebhookEventItem) {
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
