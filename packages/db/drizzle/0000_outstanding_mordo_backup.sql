DO $$ BEGIN
    CREATE TYPE "public"."apiKeyUsageType" AS ENUM('webhook-event', 'mcp-server', 'webhook-event-request');
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."destinationType" AS ENUM('slack', 'discord', 'teams', 'webhook', 'email');
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."eventStatus" AS ENUM('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."localConnectionStatus" AS ENUM('connected', 'disconnected');
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."requestStatus" AS ENUM('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."stripeSubscriptionStatus" AS ENUM('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'paused', 'trialing', 'unpaid');
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."userRole" AS ENUM('admin', 'superAdmin', 'user');
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."webhookAccessRequestStatus" AS ENUM('pending', 'approved', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."webhookStatus" AS ENUM('active', 'inactive');
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "apiKeyUsage" (
        "apiKeyId" varchar(128) NOT NULL,
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "metadata" json,
        "orgId" varchar DEFAULT auth.jwt()->>'org_id' NOT NULL,
        "type" "apiKeyUsageType" NOT NULL,
        "updatedAt" timestamp with time zone,
        "userId" varchar DEFAULT auth.jwt()->>'sub' NOT NULL
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "apiKeys" (
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "expiresAt" timestamp with time zone,
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "isActive" boolean DEFAULT true NOT NULL,
        "key" text NOT NULL,
        "lastUsedAt" timestamp with time zone,
        "name" text NOT NULL,
        "orgId" varchar DEFAULT auth.jwt()->>'org_id' NOT NULL,
        "updatedAt" timestamp with time zone,
        "userId" varchar DEFAULT auth.jwt()->>'sub' NOT NULL,
        CONSTRAINT "apiKeys_key_unique" UNIQUE("key")
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "authCodes" (
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "expiresAt" timestamp with time zone NOT NULL,
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "orgId" varchar DEFAULT auth.jwt()->>'org_id' NOT NULL,
        "sessionId" text NOT NULL,
        "updatedAt" timestamp with time zone,
        "usedAt" timestamp with time zone,
        "userId" varchar DEFAULT auth.jwt()->>'sub' NOT NULL
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "connections" (
        "clientHostname" text,
        "clientId" text NOT NULL,
        "clientOs" text,
        "clientVersion" text,
        "connectedAt" timestamp with time zone DEFAULT now() NOT NULL,
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "disconnectedAt" timestamp with time zone,
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "ipAddress" text NOT NULL,
        "lastPingAt" timestamp with time zone DEFAULT now() NOT NULL,
        "orgId" varchar DEFAULT auth.jwt()->>'org_id' NOT NULL,
        "updatedAt" timestamp with time zone,
        "userId" varchar DEFAULT auth.jwt()->>'sub' NOT NULL,
        "webhookId" varchar(128) NOT NULL
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "events" (
        "apiKeyId" varchar(128) NOT NULL,
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "failedReason" text,
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "maxRetries" integer DEFAULT 3 NOT NULL,
        "orgId" varchar DEFAULT auth.jwt()->>'org_id' NOT NULL,
        "originRequest" json NOT NULL,
        "retryCount" integer DEFAULT 0 NOT NULL,
        "source" text DEFAULT '*' NOT NULL,
        "status" "eventStatus" DEFAULT 'pending' NOT NULL,
        "timestamp" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone,
        "userId" varchar DEFAULT auth.jwt()->>'sub' NOT NULL,
        "webhookId" varchar(128) NOT NULL
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "forwardingDestinations" (
        "config" json NOT NULL,
        "createdAt" timestamp with time zone DEFAULT now(),
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "isActive" boolean DEFAULT true NOT NULL,
        "name" text NOT NULL,
        "orgId" varchar DEFAULT auth.jwt()->>'org_id' NOT NULL,
        "type" "destinationType" NOT NULL,
        "updatedAt" timestamp with time zone,
        "userId" varchar DEFAULT auth.jwt()->>'sub' NOT NULL
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "forwardingExecutions" (
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "destinationResponse" json,
        "error" text,
        "eventId" varchar(128) NOT NULL,
        "executionTimeMs" integer,
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "orgId" varchar DEFAULT auth.jwt()->>'org_id' NOT NULL,
        "originalPayload" json NOT NULL,
        "ruleId" varchar(128) NOT NULL,
        "success" boolean NOT NULL,
        "transformedPayload" json,
        "userId" varchar DEFAULT auth.jwt()->>'sub' NOT NULL
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "forwardingRules" (
        "createdAt" timestamp with time zone DEFAULT now(),
        "createdByUserId" varchar DEFAULT auth.jwt()->>'sub' NOT NULL,
        "description" text,
        "destinationId" varchar(128) NOT NULL,
        "errorCount" integer DEFAULT 0 NOT NULL,
        "executionCount" integer DEFAULT 0 NOT NULL,
        "filters" json DEFAULT '{}'::json NOT NULL,
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "isActive" boolean DEFAULT true NOT NULL,
        "lastError" text,
        "lastErrorAt" timestamp with time zone,
        "lastExecutedAt" timestamp with time zone,
        "name" text NOT NULL,
        "orgId" varchar DEFAULT auth.jwt()->>'org_id' NOT NULL,
        "priority" integer DEFAULT 0 NOT NULL,
        "transformation" text,
        "transformationExamples" json DEFAULT '[]'::json,
        "updatedAt" timestamp with time zone,
        "userId" varchar DEFAULT auth.jwt()->>'sub' NOT NULL,
        "webhookId" varchar(128) NOT NULL
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "orgMembers" (
        "createdAt" timestamp with time zone DEFAULT now(),
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "orgId" varchar DEFAULT auth.jwt()->>'org_id' NOT NULL,
        "role" "userRole" DEFAULT 'user' NOT NULL,
        "updatedAt" timestamp with time zone,
        "userId" varchar DEFAULT auth.jwt()->>'sub' NOT NULL,
        CONSTRAINT "orgMembers_userId_orgId_unique" UNIQUE("userId","orgId")
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "orgs" (
        "clerkOrgId" text NOT NULL,
        "createdAt" timestamp with time zone DEFAULT now(),
        "createdByUserId" varchar NOT NULL,
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "stripeCustomerId" text,
        "stripeSubscriptionId" text,
        "stripeSubscriptionStatus" "stripeSubscriptionStatus",
        "updatedAt" timestamp with time zone,
        CONSTRAINT "orgs_clerkOrgId_unique" UNIQUE("clerkOrgId")
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "requests" (
        "apiKeyId" varchar(128) NOT NULL,
        "completedAt" timestamp with time zone,
        "connectionId" varchar(128),
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "destination" json NOT NULL,
        "eventId" varchar(128),
        "failedReason" text,
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "orgId" varchar DEFAULT auth.jwt()->>'org_id' NOT NULL,
        "request" json NOT NULL,
        "response" json,
        "responseTimeMs" integer DEFAULT 0 NOT NULL,
        "source" text DEFAULT '*' NOT NULL,
        "status" "requestStatus" NOT NULL,
        "timestamp" timestamp with time zone NOT NULL,
        "userId" varchar DEFAULT auth.jwt()->>'sub' NOT NULL,
        "webhookId" varchar(128) NOT NULL
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "user" (
        "avatarUrl" text,
        "clerkId" text NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "email" text NOT NULL,
        "firstName" text,
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "lastLoggedInAt" timestamp with time zone,
        "lastName" text,
        "online" boolean DEFAULT false NOT NULL,
        "updatedAt" timestamp with time zone,
        CONSTRAINT "user_clerkId_unique" UNIQUE("clerkId")
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "webhookAccessRequests" (
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        "expiresAt" timestamp with time zone NOT NULL,
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "orgId" varchar DEFAULT auth.jwt()->>'org_id' NOT NULL,
        "requesterEmail" text NOT NULL,
        "requesterId" varchar DEFAULT auth.jwt()->>'sub' NOT NULL,
        "requesterMessage" text,
        "respondedAt" timestamp with time zone,
        "responderId" varchar,
        "responseMessage" text,
        "status" "webhookAccessRequestStatus" DEFAULT 'pending' NOT NULL,
        "updatedAt" timestamp with time zone,
        "webhookId" varchar(128) NOT NULL
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "webhooks" (
        "apiKeyId" varchar(128) NOT NULL,
        "config" json DEFAULT '{"headers":{},"requests":{},"storage":{"maxRequestBodySize":1048576,"maxResponseBodySize":1048576,"storeHeaders":true,"storeRequestBody":true,"storeResponseBody":true}}'::json NOT NULL,
        "createdAt" timestamp with time zone DEFAULT now(),
        "id" varchar(128) PRIMARY KEY NOT NULL,
        "isPrivate" boolean DEFAULT false NOT NULL,
        "name" text NOT NULL,
        "orgId" varchar DEFAULT auth.jwt()->>'org_id' NOT NULL,
        "requestCount" integer DEFAULT 0 NOT NULL,
        "status" "webhookStatus" DEFAULT 'active' NOT NULL,
        "updatedAt" timestamp with time zone,
        "userId" varchar DEFAULT auth.jwt()->>'sub' NOT NULL
    );
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "apiKeyUsage" ADD CONSTRAINT "apiKeyUsage_apiKeyId_apiKeys_id_fk" FOREIGN KEY ("apiKeyId") REFERENCES "public"."apiKeys"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "apiKeyUsage" ADD CONSTRAINT "apiKeyUsage_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "apiKeyUsage" ADD CONSTRAINT "apiKeyUsage_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "apiKeys" ADD CONSTRAINT "apiKeys_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "apiKeys" ADD CONSTRAINT "apiKeys_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "authCodes" ADD CONSTRAINT "authCodes_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "authCodes" ADD CONSTRAINT "authCodes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "connections" ADD CONSTRAINT "connections_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "connections" ADD CONSTRAINT "connections_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "connections" ADD CONSTRAINT "connections_webhookId_webhooks_id_fk" FOREIGN KEY ("webhookId") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "events" ADD CONSTRAINT "events_apiKeyId_apiKeys_id_fk" FOREIGN KEY ("apiKeyId") REFERENCES "public"."apiKeys"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "events" ADD CONSTRAINT "events_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "events" ADD CONSTRAINT "events_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "events" ADD CONSTRAINT "events_webhookId_webhooks_id_fk" FOREIGN KEY ("webhookId") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "forwardingDestinations" ADD CONSTRAINT "forwardingDestinations_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "forwardingDestinations" ADD CONSTRAINT "forwardingDestinations_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "forwardingExecutions" ADD CONSTRAINT "forwardingExecutions_eventId_events_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "forwardingExecutions" ADD CONSTRAINT "forwardingExecutions_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "forwardingExecutions" ADD CONSTRAINT "forwardingExecutions_ruleId_forwardingRules_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."forwardingRules"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "forwardingExecutions" ADD CONSTRAINT "forwardingExecutions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "forwardingRules" ADD CONSTRAINT "forwardingRules_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "forwardingRules" ADD CONSTRAINT "forwardingRules_destinationId_forwardingDestinations_id_fk" FOREIGN KEY ("destinationId") REFERENCES "public"."forwardingDestinations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "forwardingRules" ADD CONSTRAINT "forwardingRules_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "forwardingRules" ADD CONSTRAINT "forwardingRules_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "forwardingRules" ADD CONSTRAINT "forwardingRules_webhookId_webhooks_id_fk" FOREIGN KEY ("webhookId") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "orgMembers" ADD CONSTRAINT "orgMembers_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "orgMembers" ADD CONSTRAINT "orgMembers_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "orgs" ADD CONSTRAINT "orgs_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "requests" ADD CONSTRAINT "requests_apiKeyId_apiKeys_id_fk" FOREIGN KEY ("apiKeyId") REFERENCES "public"."apiKeys"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "requests" ADD CONSTRAINT "requests_connectionId_connections_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "requests" ADD CONSTRAINT "requests_eventId_events_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "requests" ADD CONSTRAINT "requests_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "requests" ADD CONSTRAINT "requests_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "requests" ADD CONSTRAINT "requests_webhookId_webhooks_id_fk" FOREIGN KEY ("webhookId") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "webhookAccessRequests" ADD CONSTRAINT "webhookAccessRequests_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "webhookAccessRequests" ADD CONSTRAINT "webhookAccessRequests_requesterId_user_id_fk" FOREIGN KEY ("requesterId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "webhookAccessRequests" ADD CONSTRAINT "webhookAccessRequests_responderId_user_id_fk" FOREIGN KEY ("responderId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "webhookAccessRequests" ADD CONSTRAINT "webhookAccessRequests_webhookId_webhooks_id_fk" FOREIGN KEY ("webhookId") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_apiKeyId_apiKeys_id_fk" FOREIGN KEY ("apiKeyId") REFERENCES "public"."apiKeys"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "connections_org_status_idx" ON "connections" USING btree ("orgId","disconnectedAt","lastPingAt");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "connections_client_version_idx" ON "connections" USING btree ("clientVersion");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "events_org_status_timestamp_idx" ON "events" USING btree ("orgId","status","timestamp");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "events_webhook_status_idx" ON "events" USING btree ("webhookId","status");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "events_pending_idx" ON "events" USING btree ("timestamp") WHERE "events"."status" = 'pending';
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "forwarding_executions_rule_idx" ON "forwardingExecutions" USING btree ("ruleId");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "forwarding_executions_event_idx" ON "forwardingExecutions" USING btree ("eventId");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "forwarding_executions_created_idx" ON "forwardingExecutions" USING btree ("createdAt");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "forwarding_rules_webhook_active_idx" ON "forwardingRules" USING btree ("webhookId","isActive");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "forwarding_rules_priority_idx" ON "forwardingRules" USING btree ("priority");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "requests_webhook_id_idx" ON "requests" USING btree ("webhookId");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "requests_event_id_idx" ON "requests" USING btree ("eventId");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "requests_org_status_timestamp_idx" ON "requests" USING btree ("orgId","status","timestamp");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "requests_connection_timestamp_idx" ON "requests" USING btree ("connectionId","timestamp");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "requests_slow_idx" ON "requests" USING btree ("timestamp") WHERE "requests"."responseTimeMs" > 1000;
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "requests_pending_idx" ON "requests" USING btree ("timestamp") WHERE "requests"."status" = 'pending';
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "webhook_access_requests_webhook_status_idx" ON "webhookAccessRequests" USING btree ("webhookId","status");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "webhook_access_requests_requester_idx" ON "webhookAccessRequests" USING btree ("requesterId");
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE INDEX "webhook_access_requests_pending_expires_idx" ON "webhookAccessRequests" USING btree ("expiresAt") WHERE "webhookAccessRequests"."status" = 'pending';
EXCEPTION
    WHEN duplicate_object OR sqlstate = '42710' OR sqlstate = '42P07' THEN null;
END $$;