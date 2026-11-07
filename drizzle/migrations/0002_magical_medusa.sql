CREATE TABLE "activity_activity_types" (
	"activity_id" uuid NOT NULL,
	"activity_type_id" uuid NOT NULL,
	CONSTRAINT "activity_activity_types_activity_id_activity_type_id_pk" PRIMARY KEY("activity_id","activity_type_id")
);
--> statement-breakpoint
CREATE TABLE "activity_age_groups" (
	"activity_id" uuid NOT NULL,
	"age_group" text NOT NULL,
	CONSTRAINT "activity_age_groups_activity_id_age_group_pk" PRIMARY KEY("activity_id","age_group")
);
--> statement-breakpoint
CREATE TABLE "activity_group_sizes" (
	"activity_id" uuid NOT NULL,
	"group_size" text NOT NULL,
	CONSTRAINT "activity_group_sizes_activity_id_group_size_pk" PRIMARY KEY("activity_id","group_size")
);
--> statement-breakpoint
CREATE TABLE "activity_locations" (
	"activity_id" uuid NOT NULL,
	"location" text NOT NULL,
	CONSTRAINT "activity_locations_activity_id_location_pk" PRIMARY KEY("activity_id","location")
);
--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "activities_activity_type_id_activity_types_id_fk";
--> statement-breakpoint
DROP INDEX "activities_group_size_idx";--> statement-breakpoint
DROP INDEX "activities_location_idx";--> statement-breakpoint
DROP INDEX "activities_age_group_idx";--> statement-breakpoint
DROP INDEX "activities_activity_type_id_idx";--> statement-breakpoint
DROP INDEX "activities_filter_idx";--> statement-breakpoint
ALTER TABLE "activity_activity_types" ADD CONSTRAINT "activity_activity_types_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_activity_types" ADD CONSTRAINT "activity_activity_types_activity_type_id_activity_types_id_fk" FOREIGN KEY ("activity_type_id") REFERENCES "public"."activity_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_age_groups" ADD CONSTRAINT "activity_age_groups_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_group_sizes" ADD CONSTRAINT "activity_group_sizes_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_locations" ADD CONSTRAINT "activity_locations_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_activity_types_type_idx" ON "activity_activity_types" USING btree ("activity_type_id");--> statement-breakpoint
CREATE INDEX "activity_age_groups_value_idx" ON "activity_age_groups" USING btree ("age_group");--> statement-breakpoint
CREATE INDEX "activity_group_sizes_value_idx" ON "activity_group_sizes" USING btree ("group_size");--> statement-breakpoint
CREATE INDEX "activity_locations_value_idx" ON "activity_locations" USING btree ("location");--> statement-breakpoint
-- Backfill: every existing single value becomes one link (runs before the old columns are dropped).
INSERT INTO "activity_group_sizes" ("activity_id", "group_size") SELECT "id", "group_size" FROM "activities";--> statement-breakpoint
INSERT INTO "activity_locations" ("activity_id", "location") SELECT "id", "location" FROM "activities";--> statement-breakpoint
INSERT INTO "activity_age_groups" ("activity_id", "age_group") SELECT "id", "age_group" FROM "activities";--> statement-breakpoint
INSERT INTO "activity_activity_types" ("activity_id", "activity_type_id") SELECT "id", "activity_type_id" FROM "activities";--> statement-breakpoint
-- Pending edit suggestions on the renamed fields: valid single values become one-element JSON lists under the plural key.
-- Anything else cannot be applied to a list and is rejected rather than left to fail on review.
UPDATE "edit_suggestions" SET "status" = 'rejected'
WHERE "status" = 'pending'
  AND (
    ("field" = 'group_size' AND "suggested_value" NOT IN ('small', 'medium', 'large'))
    OR ("field" = 'location' AND "suggested_value" NOT IN ('inside', 'outside'))
    OR ("field" = 'age_group' AND "suggested_value" NOT IN ('cub_scouts', 'scouts', 'adventurers', 'rovers', 'leaders'))
  );--> statement-breakpoint
UPDATE "edit_suggestions" SET "field" = 'group_sizes', "suggested_value" = '["' || "suggested_value" || '"]'
WHERE "field" = 'group_size' AND "status" = 'pending';--> statement-breakpoint
UPDATE "edit_suggestions" SET "field" = 'locations', "suggested_value" = '["' || "suggested_value" || '"]'
WHERE "field" = 'location' AND "status" = 'pending';--> statement-breakpoint
UPDATE "edit_suggestions" SET "field" = 'age_groups', "suggested_value" = '["' || "suggested_value" || '"]'
WHERE "field" = 'age_group' AND "status" = 'pending';--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "group_size";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "location";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "age_group";--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "activity_type_id";