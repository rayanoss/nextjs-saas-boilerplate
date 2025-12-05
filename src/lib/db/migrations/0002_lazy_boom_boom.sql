ALTER TABLE "webhook_events" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "webhook_events_user_id_idx" ON "webhook_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "webhook_events_user_id_processed_idx" ON "webhook_events" USING btree ("user_id","processed");