import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createClient } from '@supabase/supabase-js';
import { render, screen, waitFor } from '@testing-library/react';
import { createId } from '@unhook/id';
import { env } from '../env.client';
import type { EventType } from '../schema';
import type { Database, Json } from './types';
import { SubscriptionProvider, useSubscription } from './use-subscription';

type SupabaseEvent = Database['public']['Tables']['events']['Insert'];

// Test component that uses the subscription hook
interface TestComponentProps {
  table: 'events';
  onStatusChange?: (status: string, error?: Error) => void;
  onInsert?: (data: unknown) => void;
  onUpdate?: (newData: unknown, oldData: unknown) => void;
  onDelete?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

function TestComponent({
  table,
  onStatusChange,
  onInsert,
  onUpdate,
  onDelete,
  onError,
}: TestComponentProps) {
  const { status } = useSubscription({
    table,
    onStatusChange,
    onInsert,
    onUpdate,
    onDelete,
    onError,
  });

  return <div data-testid="status">{status}</div>;
}

describe('SubscriptionProvider and useSubscription Integration', () => {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  let testEvent: EventType;
  let userId: string;
  let orgId: string;
  let webhookId: string;

  beforeEach(async () => {
    userId = createId({ prefix: 'user' });
    orgId = createId({ prefix: 'org' });
    webhookId = createId({ prefix: 't' });

    // Create test user
    await supabase.from('user').insert([
      {
        id: userId,
        clerkId: userId,
        email: `test-${userId}@example.com`,
        online: true,
      },
    ]);

    // Create test org
    await supabase.from('orgs').insert([
      {
        id: orgId,
        clerkOrgId: orgId,
        name: 'test-org',
        createdByUserId: userId,
      },
    ]);

    // Create test webhook
    await supabase.from('webhooks').insert([
      {
        id: webhookId,
        name: 'test-webhook',
        apiKey: 'test-api-key',
        status: 'active',
        userId,
        orgId,
      },
    ]);

    // Create a test event
    testEvent = {
      id: createId({ prefix: 'e' }),
      timestamp: new Date(),
      status: 'pending',
      maxRetries: 3,
      retryCount: 0,
      originRequest: {
        sourceUrl: 'https://example.com',
        method: 'POST',
        id: '123',
        clientIp: '123',
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'test-user-agent',
        },
        size: 100,
        body: 'test-body',
      },
      apiKey: 'test-api-key',
      source: 'test-from',
      createdAt: new Date(),
      failedReason: null,
      updatedAt: null,
      userId,
      orgId,
      webhookId,
    };

    // Check if event exists and delete it first
    const { data: existingEvent } = await supabase
      .from('events')
      .select()
      .eq('id', testEvent.id)
      .single();

    if (existingEvent) {
      await supabase.from('events').delete().eq('id', testEvent.id);
    }

    // Create the test event
    const supabaseEvent: SupabaseEvent = {
      ...testEvent,
      timestamp: testEvent.timestamp.toISOString(),
      createdAt: testEvent.createdAt.toISOString(),
      originRequest: testEvent.originRequest as unknown as Json,
      updatedAt: testEvent.updatedAt?.toISOString() ?? null,
    };
    const { error } = await supabase.from('events').insert([supabaseEvent]);
    if (error) {
      throw new Error(`Failed to create test event: ${error.message}`);
    }
  });

  afterEach(async () => {
    // Clean up test data in reverse order of creation
    await supabase.from('events').delete().eq('id', testEvent.id);
    await supabase.from('webhooks').delete().eq('id', webhookId);
    await supabase.from('orgs').delete().eq('id', orgId);
    await supabase.from('user').delete().eq('id', userId);
  });

  // Helper function to wait for client initialization
  const waitForClientInitialization = async () => {
    await waitFor(
      () => {
        const statusElement = screen.getByTestId('status');
        return statusElement.textContent === 'connected';
      },
      { timeout: 5000 },
    );
  };

  it('should receive insert events', async () => {
    let insertReceived = false;
    const onInsert = (data: unknown) => {
      const event = data as Database['public']['Tables']['events']['Row'];
      expect(event.id).toBeDefined();
      insertReceived = true;
    };

    render(
      <SubscriptionProvider token={supabaseKey} url={supabaseUrl}>
        <TestComponent table="events" onInsert={onInsert} />
      </SubscriptionProvider>,
    );

    // Wait for client initialization
    await waitForClientInitialization();

    // Insert a new event
    const newEvent: EventType = {
      id: createId({ prefix: 'e' }),
      timestamp: new Date(),
      status: 'pending',
      maxRetries: 3,
      retryCount: 0,
      originRequest: {
        sourceUrl: 'https://example.com/test',
        method: 'GET',
        id: '123',
        clientIp: '123',
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'test-user-agent',
        },
        size: 100,
        body: 'test-body',
      },
      apiKey: 'test-api-key',
      source: 'test-from',
      createdAt: new Date(),
      failedReason: null,
      updatedAt: null,
      userId,
      orgId,
      webhookId,
    };

    // Check if event exists and delete it first
    const { data: existingEvent } = await supabase
      .from('events')
      .select()
      .eq('id', newEvent.id)
      .single();

    if (existingEvent) {
      await supabase.from('events').delete().eq('id', newEvent.id);
    }

    // Insert the new event
    const supabaseNewEvent: SupabaseEvent = {
      ...newEvent,
      timestamp: newEvent.timestamp.toISOString(),
      createdAt: newEvent.createdAt.toISOString(),
      originRequest: newEvent.originRequest as unknown as Json,
      updatedAt: newEvent.updatedAt?.toISOString() ?? null,
    };
    const { error } = await supabase.from('events').insert([supabaseNewEvent]);
    if (error) {
      throw new Error(`Failed to create new event: ${error.message}`);
    }

    // Wait for the subscription to receive the event
    await waitFor(() => expect(insertReceived).toBe(true), { timeout: 5000 });

    // Clean up the new event
    await supabase.from('events').delete().eq('id', newEvent.id);
  });

  it('should receive update events', async () => {
    let updateReceived = false;
    const onUpdate = (newData: unknown, oldData: unknown) => {
      const newEvent = newData as Database['public']['Tables']['events']['Row'];
      const oldEvent = oldData as Database['public']['Tables']['events']['Row'];
      expect(newEvent.status).toBe('completed');
      expect(oldEvent.status).toBe('pending');
      updateReceived = true;
    };

    render(
      <SubscriptionProvider token={supabaseKey} url={supabaseUrl}>
        <TestComponent table="events" onUpdate={onUpdate} />
      </SubscriptionProvider>,
    );

    // Wait for client initialization
    await waitForClientInitialization();

    // Update the test event
    const { error } = await supabase
      .from('events')
      .update({ status: 'completed' })
      .eq('id', testEvent.id);

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`);
    }

    // Wait for the subscription to receive the event
    await waitFor(() => expect(updateReceived).toBe(true), { timeout: 5000 });
  });

  it('should receive delete events', async () => {
    let deleteReceived = false;
    const onDelete = (data: unknown) => {
      const event = data as Database['public']['Tables']['events']['Row'];
      expect(event.id).toBe(testEvent.id);
      deleteReceived = true;
    };

    render(
      <SubscriptionProvider token={supabaseKey} url={supabaseUrl}>
        <TestComponent table="events" onDelete={onDelete} />
      </SubscriptionProvider>,
    );

    // Wait for client initialization
    await waitForClientInitialization();

    // Delete the test event
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', testEvent.id);
    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`);
    }

    // Wait for the subscription to receive the event
    await waitFor(() => expect(deleteReceived).toBe(true), { timeout: 5000 });
  });
});
