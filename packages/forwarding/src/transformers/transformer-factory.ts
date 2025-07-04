import type { ForwardingContext, TransformResult } from '../types';
import { transformWithJavaScript } from './javascript-transformer';

export async function applyTransformation(
  transformation: string | undefined,
  context: ForwardingContext,
): Promise<TransformResult> {
  if (!transformation || transformation.trim().length === 0) {
    // No transformation, return the original data
    return {
      success: true,
      data: context.request.body ? JSON.parse(context.request.body) : null,
    };
  }

  // For now, we only support JavaScript transformations
  // In the future, we could add support for other transformation types (JSONPath, JQ, etc.)
  return transformWithJavaScript(transformation, context);
}
