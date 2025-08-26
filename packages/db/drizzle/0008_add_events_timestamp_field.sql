-- Add timestamp field to events table
ALTER TABLE "events" ADD COLUMN "timestamp" timestamp with time zone NOT NULL DEFAULT now();
