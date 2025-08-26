-- Add unique constraint on organization names
ALTER TABLE "orgs" ADD CONSTRAINT "orgs_name_unique" UNIQUE ("name");

-- Add unique constraint on webhook orgId and id combination
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_orgId_id_unique" UNIQUE ("orgId", "id");
