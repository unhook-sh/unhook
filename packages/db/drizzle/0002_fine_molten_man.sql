-- Add columns as nullable first
ALTER TABLE "requests" ADD COLUMN "destinationName" text;
ALTER TABLE "requests" ADD COLUMN "destinationUrl" text;

-- Populate existing records with values from the destination JSON column
UPDATE "requests"
SET
  "destinationName" = COALESCE("destination"->>'name', 'unknown'),
  "destinationUrl" = COALESCE("destination"->>'url', 'http://localhost:3000')
WHERE "destinationName" IS NULL OR "destinationUrl" IS NULL;

-- Make columns NOT NULL after populating
ALTER TABLE "requests" ALTER COLUMN "destinationName" SET NOT NULL;
ALTER TABLE "requests" ALTER COLUMN "destinationUrl" SET NOT NULL;