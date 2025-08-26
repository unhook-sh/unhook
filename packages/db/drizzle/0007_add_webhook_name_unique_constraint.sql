-- Add unique constraint on webhook names within an organization
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_orgId_name_unique" UNIQUE ("orgId", "name");
