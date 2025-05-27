import { sql } from 'drizzle-orm';
import { db } from '../src/client';

const tablesToEnableRealtime = [
  'events',
  'requests',
  'webhooks',
  'connections',
] as const;

async function isTableInPublication(tableName: string): Promise<boolean> {
  const result = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND tablename = ${tableName}
    ) as exists;
  `);
  return result.rows[0]?.exists ?? false;
}

async function enableRealtimeForTable(tableName: string) {
  console.log(`Checking realtime status for table: ${tableName}`);

  const isAlreadyEnabled = await isTableInPublication(tableName);
  if (isAlreadyEnabled) {
    console.log(`Table ${tableName} is already enabled for realtime`);
    return;
  }

  console.log(`Enabling realtime for table: ${tableName}`);
  await db.execute(sql`
    ALTER PUBLICATION supabase_realtime ADD TABLE "public"."${sql.raw(tableName)}";
  `);
  console.log(`Realtime enabled for table: ${tableName}`);
}

async function setupAllRealtime() {
  try {
    // Process tables sequentially to avoid deadlocks
    for (const table of tablesToEnableRealtime) {
      await enableRealtimeForTable(table);
    }
    console.log('All realtime subscriptions have been set up successfully');
  } catch (error) {
    console.error('Error setting up realtime subscriptions:', error);
    throw error;
  }
}

setupAllRealtime()
  .then(() => {
    console.log('Realtime setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Realtime setup failed:', error);
    process.exit(1);
  });
