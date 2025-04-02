-- Create enum type for user roles
CREATE TYPE "userRole" AS ENUM ('admin', 'superAdmin', 'user');

-- Create Users table
CREATE TABLE IF NOT EXISTS "user" (
    "id" varchar(128) NOT NULL PRIMARY KEY,
    "avatarUrl" text,
    "clerkId" text UNIQUE,
    "email" text NOT NULL UNIQUE,
    "firstName" text,
    "lastName" text,
    "online" boolean NOT NULL DEFAULT false,
    "lastLoggedInAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now()
);

-- Create Orgs table
CREATE TABLE IF NOT EXISTS "orgs" (
    "id" varchar(128) NOT NULL PRIMARY KEY DEFAULT create_id('org'),
    "clerkOrgId" text,
    "createdByUserId" varchar(128) NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now()
);

-- Create OrgMembers table
CREATE TABLE IF NOT EXISTS "orgMembers" (
    "id" varchar(128) NOT NULL PRIMARY KEY DEFAULT create_id('member'),
    "orgId" varchar(128) NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
    "userId" varchar(128) NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "createdByUserId" varchar(128) NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "role" userRole NOT NULL DEFAULT 'user',
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    CONSTRAINT "orgUserUnique" UNIQUE ("orgId", "userId")
);

-- Create ShortUrl table
CREATE TABLE IF NOT EXISTS "short_url" (
    "id" varchar(128) NOT NULL PRIMARY KEY DEFAULT create_id('url'),
    "code" text NOT NULL UNIQUE,
    "redirectUrl" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now()
);

-- Create Tunnels table
CREATE TABLE IF NOT EXISTS "tunnels" (
    "id" varchar(128) NOT NULL PRIMARY KEY DEFAULT create_id('tunnel'),
    "clientId" text NOT NULL,
    "apiKey" text NOT NULL,
    "localAddr" text NOT NULL,
    "serverAddr" text NOT NULL,
    "status" text NOT NULL DEFAULT 'disconnected',
    "lastSeenAt" timestamp with time zone NOT NULL,
    "userId" varchar(128) NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "orgId" varchar(128) NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orgs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orgMembers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "short_url" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tunnels" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user table
CREATE POLICY "Users can view their own data"
ON "user"
FOR SELECT
TO authenticated
USING (
    "clerkId" = auth.jwt()->>'sub'
);

-- Create RLS policies for orgs table
CREATE POLICY "Users can view their orgs"
ON "orgs"
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM "orgMembers"
        WHERE "orgMembers"."orgId" = "orgs"."id"
        AND "orgMembers"."userId" IN (
            SELECT "id" FROM "user" WHERE "clerkId" = auth.jwt()->>'sub'
        )
    )
);

-- Create RLS policies for orgMembers table
CREATE POLICY "Users can view their org memberships"
ON "orgMembers"
FOR SELECT
TO authenticated
USING (
    "userId" IN (
        SELECT "id" FROM "user" WHERE "clerkId" = auth.jwt()->>'sub'
    )
);

-- Create RLS policies for tunnels table
CREATE POLICY "Users can view their tunnels"
ON "tunnels"
FOR SELECT
TO authenticated
USING (
    "userId" IN (
        SELECT "id" FROM "user" WHERE "clerkId" = auth.jwt()->>'sub'
    )
);