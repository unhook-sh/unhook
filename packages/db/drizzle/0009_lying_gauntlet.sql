CREATE INDEX "orgMembers_org_id_idx" ON "orgMembers" USING btree ("orgId");--> statement-breakpoint
CREATE INDEX "orgMembers_user_id_idx" ON "orgMembers" USING btree ("userId");--> statement-breakpoint
-- Fix duplicate org names before adding unique constraint
-- Rename duplicates by appending the org id to make them unique
-- Keep the first org (lowest ID) with the original name, rename the rest
-- Make renamed orgs lowercase and URL-friendly
WITH duplicates AS (
  SELECT "id", "name",
    ROW_NUMBER() OVER (PARTITION BY "name" ORDER BY "id") as rn
  FROM "orgs"
)
UPDATE "orgs" o
SET "name" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(o."name", '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || o."id"
FROM duplicates d
WHERE o."id" = d."id" AND d.rn > 1;--> statement-breakpoint
-- Now add the unique constraint (will only work if migration 0006 didn't already add it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' AND c.conname = 'orgs_name_unique'
  ) THEN
    ALTER TABLE "orgs" ADD CONSTRAINT "orgs_name_unique" UNIQUE("name");
  END IF;
END $$;--> statement-breakpoint
-- Add webhook constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' AND c.conname = 'webhooks_orgId_id_unique'
  ) THEN
    ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_orgId_id_unique" UNIQUE("orgId","id");
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' AND c.conname = 'webhooks_orgId_name_unique'
  ) THEN
    ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_orgId_name_unique" UNIQUE("orgId","name");
  END IF;
END $$;