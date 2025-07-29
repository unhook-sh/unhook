-- Create the requesting_user_id function as per Clerk docs
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::text;
$$;--> statement-breakpoint

-- Create the requesting_org_id function for consistency
CREATE OR REPLACE FUNCTION requesting_org_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    ''
  )::text;
$$;--> statement-breakpoint

ALTER TABLE "apiKeys" ALTER COLUMN "orgId" SET DEFAULT requesting_org_id();--> statement-breakpoint
ALTER TABLE "apiKeys" ALTER COLUMN "userId" SET DEFAULT requesting_user_id();--> statement-breakpoint
ALTER TABLE "apiKeyUsage" ALTER COLUMN "orgId" SET DEFAULT requesting_org_id();--> statement-breakpoint
ALTER TABLE "apiKeyUsage" ALTER COLUMN "userId" SET DEFAULT requesting_user_id();--> statement-breakpoint
ALTER TABLE "authCodes" ALTER COLUMN "orgId" SET DEFAULT requesting_org_id();--> statement-breakpoint
ALTER TABLE "authCodes" ALTER COLUMN "userId" SET DEFAULT requesting_user_id();--> statement-breakpoint
ALTER TABLE "connections" ALTER COLUMN "orgId" SET DEFAULT requesting_org_id();--> statement-breakpoint
ALTER TABLE "connections" ALTER COLUMN "userId" SET DEFAULT requesting_user_id();--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "orgId" SET DEFAULT requesting_org_id();--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "userId" SET DEFAULT requesting_user_id();--> statement-breakpoint
ALTER TABLE "forwardingDestinations" ALTER COLUMN "orgId" SET DEFAULT requesting_org_id();--> statement-breakpoint
ALTER TABLE "forwardingDestinations" ALTER COLUMN "userId" SET DEFAULT requesting_user_id();--> statement-breakpoint
ALTER TABLE "forwardingExecutions" ALTER COLUMN "orgId" SET DEFAULT requesting_org_id();--> statement-breakpoint
ALTER TABLE "forwardingExecutions" ALTER COLUMN "userId" SET DEFAULT requesting_user_id();--> statement-breakpoint
ALTER TABLE "forwardingRules" ALTER COLUMN "orgId" SET DEFAULT requesting_org_id();--> statement-breakpoint
ALTER TABLE "forwardingRules" ALTER COLUMN "userId" SET DEFAULT requesting_user_id();--> statement-breakpoint
ALTER TABLE "orgMembers" ALTER COLUMN "orgId" SET DEFAULT requesting_org_id();--> statement-breakpoint
ALTER TABLE "orgMembers" ALTER COLUMN "userId" SET DEFAULT requesting_user_id();--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "orgId" SET DEFAULT requesting_org_id();--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "userId" SET DEFAULT requesting_user_id();--> statement-breakpoint
ALTER TABLE "webhookAccessRequests" ALTER COLUMN "orgId" SET DEFAULT requesting_org_id();--> statement-breakpoint
ALTER TABLE "webhookAccessRequests" ALTER COLUMN "requesterId" SET DEFAULT requesting_user_id();--> statement-breakpoint
ALTER TABLE "webhooks" ALTER COLUMN "orgId" SET DEFAULT requesting_org_id();--> statement-breakpoint
ALTER TABLE "webhooks" ALTER COLUMN "userId" SET DEFAULT requesting_user_id();