CREATE INDEX "orgMembers_org_id_idx" ON "orgMembers" USING btree ("orgId");--> statement-breakpoint
CREATE INDEX "orgMembers_user_id_idx" ON "orgMembers" USING btree ("userId");--> statement-breakpoint
ALTER TABLE "orgs" ADD CONSTRAINT "orgs_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_orgId_id_unique" UNIQUE("orgId","id");--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_orgId_name_unique" UNIQUE("orgId","name");