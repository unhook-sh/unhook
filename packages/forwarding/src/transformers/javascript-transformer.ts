import type { ForwardingRuleType } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import ivm from 'isolated-vm';
import type { ForwardingContext, TransformResult } from '../types';

const log = debug('unhook:forwarding:javascript-transformer');

const DEFAULT_TIMEOUT = 5000; // 5 seconds
const DEFAULT_MEMORY_LIMIT = 128; // 128MB

/**
 * Execute JavaScript transformation code in a sandboxed environment
 */
export async function transformWithJavaScript(
  code: string,
  context: ForwardingContext,
): Promise<TransformResult> {
  if (!code || code.trim().length === 0) {
    return {
      data: context.request.body,
      success: true,
    };
  }

  const isolate = new ivm.Isolate({
    memoryLimit: DEFAULT_MEMORY_LIMIT,
  });

  try {
    const isolateContext = await isolate.createContext();

    // Create a jail object to hold our functions and data
    const jail = isolateContext.global;
    await jail.set('global', jail.derefInto());

    // Prepare the payload to pass to the transformation function
    const payload = {
      event: {
        id: context.event.id,
        source: context.event.source,
        timestamp: context.event.timestamp?.toISOString(),
        webhookId: context.event.webhookId,
      },
      request: {
        body: context.request.body ? JSON.parse(context.request.body) : null,
        contentType: context.request.contentType,
        headers: context.request.headers,
        method: context.request.method,
        sourceUrl: context.request.sourceUrl,
      },
    };

    // Pass the payload as a JSON string to avoid reference issues
    await jail.set(
      '__payload',
      new ivm.ExternalCopy(JSON.stringify(payload)).copyInto(),
    );

    // Helper functions available in the sandbox
    const helperCode = `
      const payload = JSON.parse(__payload);
      const event = payload.event;
      const request = payload.request;
      const body = request.body;
      const headers = request.headers;

      // Helper functions
      function extractField(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
      }

      function formatDate(date, format = 'iso') {
        const d = new Date(date);
        if (format === 'iso') return d.toISOString();
        if (format === 'unix') return Math.floor(d.getTime() / 1000);
        return d.toString();
      }

      // The user's transformation function should be defined as 'transform'
      ${code}

      // Execute the transformation
      let result;
      if (typeof transform === 'function') {
        result = transform({ event, request, body, headers });
      } else {
        // If no transform function is defined, return the body as-is
        result = body;
      }

      // Return the result as a JSON string
      JSON.stringify(result);
    `;

    const script = await isolate.compileScript(helperCode);
    const result = await script.run(isolateContext, {
      timeout: DEFAULT_TIMEOUT,
    });

    // Parse the result back from JSON
    const transformedData = JSON.parse(result);

    return {
      data: transformedData,
      success: true,
    };
  } catch (error) {
    log('Transformation error:', error);
    return {
      error:
        error instanceof Error ? error.message : 'Unknown transformation error',
      success: false,
    };
  } finally {
    // Clean up the isolate
    isolate.dispose();
  }
}

/**
 * Validate transformation code by running it with sample data
 */
export async function validateTransformation(
  code: string,
  sampleInput: unknown,
): Promise<{ valid: boolean; error?: string; output?: unknown }> {
  const mockContext: ForwardingContext = {
    event: {
      apiKeyId: 'apiKeyId',
      createdAt: new Date(),
      failedReason: null,
      id: 'evt_sample',
      maxRetries: 3,
      orgId: 'org_sample',
      originRequest: {
        body: JSON.stringify(sampleInput),
        clientIp: '127.0.0.1',
        contentType: 'application/json',
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        size: 100,
        sourceUrl: 'https://example.com/webhook',
      },
      retryCount: 0,
      source: '*',
      status: 'pending',
      timestamp: new Date(),
      updatedAt: null,
      userId: 'user_sample',
      webhookId: 'wh_sample',
    },
    request: {
      body: JSON.stringify(sampleInput),
      clientIp: '127.0.0.1',
      contentType: 'application/json',
      headers: { 'content-type': 'application/json' },
      method: 'POST',
      size: 100,
      sourceUrl: 'https://example.com/webhook',
    },
    rule: {} as ForwardingRuleType, // We don't need the full rule for validation
  };

  const result = await transformWithJavaScript(code, mockContext);

  if (result.success) {
    return {
      output: result.data,
      valid: true,
    };
  }
  return {
    error: result.error,
    valid: false,
  };
}
