import { describe, expect, it } from 'bun:test';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { handleUserDeleted } from '../user-deleted';

describe('handleUserDeleted', () => {
  it('should handle user.deleted event with minimal payload', async () => {
    const mockEvent: WebhookEvent = {
      data: {
        deleted: true,
        id: 'user_31vA3qvRNDG6DnVoUNIWUvNDBkb',
        object: 'user',
      },
      type: 'user.deleted',
    } as WebhookEvent;

    const response = await handleUserDeleted(mockEvent);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('User deleted event processed');
  });

  it('should handle user.deleted event with different user ID', async () => {
    const mockEvent: WebhookEvent = {
      data: {
        deleted: true,
        id: 'user_different123',
        object: 'user',
      },
      type: 'user.deleted',
    } as WebhookEvent;

    const response = await handleUserDeleted(mockEvent);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('User deleted event processed');
  });
});
