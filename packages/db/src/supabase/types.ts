import type { Database } from './types.generated';

export * from './types.generated';

export type TableName = keyof Database['public']['Tables'];
