-- Edit suggestions for the removed activity types cannot be applied any more: close the pending ones first.
UPDATE "edit_suggestions" SET "status" = 'rejected', "reviewed_at" = now() WHERE "field" = 'activity_types' AND "status" = 'pending';--> statement-breakpoint
DROP TABLE "activity_activity_types" CASCADE;--> statement-breakpoint
DROP TABLE "activity_types" CASCADE;
