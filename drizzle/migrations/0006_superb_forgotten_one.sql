CREATE TABLE "activity_focuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_managed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "activity_focuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "activity_formats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_managed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "activity_formats_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "duration_min_minutes" integer;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "duration_max_minutes" integer;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "external_hash" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "format_id" uuid;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "focus_id" uuid;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "secondary_focus_id" uuid;--> statement-breakpoint
ALTER TABLE "activity_sources" ADD COLUMN "priority" integer;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "short_title" text;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "integration_age_groups" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_format_id_activity_formats_id_fk" FOREIGN KEY ("format_id") REFERENCES "public"."activity_formats"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_focus_id_activity_focuses_id_fk" FOREIGN KEY ("focus_id") REFERENCES "public"."activity_focuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_secondary_focus_id_activity_focuses_id_fk" FOREIGN KEY ("secondary_focus_id") REFERENCES "public"."activity_focuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_external_id_unique" ON "activities" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "activities_format_idx" ON "activities" USING btree ("format_id");--> statement-breakpoint
CREATE INDEX "activities_focus_idx" ON "activities" USING btree ("focus_id");