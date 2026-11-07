CREATE TABLE "activity_challenges" (
	"activity_id" uuid NOT NULL,
	"challenge_id" uuid NOT NULL,
	CONSTRAINT "activity_challenges_activity_id_challenge_id_pk" PRIMARY KEY("activity_id","challenge_id")
);
--> statement-breakpoint
CREATE TABLE "activity_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"license" text,
	"access" text,
	"language" text,
	"is_managed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "activity_sources_code_unique" UNIQUE("code")
);
--> statement-breakpoint
-- Objectives become per-division rows. Existing links are expanded to one row per division
-- the activity has and the objective belongs to; links that match no division are dropped.
ALTER TABLE "activity_educational_goals" DROP CONSTRAINT "activity_educational_goals_activity_id_goal_id_pk";--> statement-breakpoint
ALTER TABLE "activity_educational_goals" ADD COLUMN "age_group" text;--> statement-breakpoint
INSERT INTO "activity_educational_goals" ("activity_id", "goal_id", "age_group")
SELECT aeg."activity_id", aeg."goal_id", aag."age_group"
FROM "activity_educational_goals" aeg
JOIN "activity_age_groups" aag ON aag."activity_id" = aeg."activity_id"
JOIN "educational_goal_age_groups" gag ON gag."goal_id" = aeg."goal_id" AND gag."age_group" = aag."age_group"
WHERE aeg."age_group" IS NULL;--> statement-breakpoint
DELETE FROM "activity_educational_goals" WHERE "age_group" IS NULL;--> statement-breakpoint
ALTER TABLE "activity_educational_goals" ALTER COLUMN "age_group" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_educational_goals" ADD CONSTRAINT "activity_educational_goals_activity_id_goal_id_age_group_pk" PRIMARY KEY("activity_id","goal_id","age_group");--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "physical_risk_level" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "physical_risk" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "physical_mitigation" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "psychological_risk_level" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "psychological_risk" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "psychological_mitigation" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "activity_educational_goals" ADD COLUMN "observable_behaviour" text;--> statement-breakpoint
ALTER TABLE "activity_sdgs" ADD COLUMN "justification" text;--> statement-breakpoint
ALTER TABLE "activity_challenges" ADD CONSTRAINT "activity_challenges_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_challenges" ADD CONSTRAINT "activity_challenges_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_challenges_challenge_idx" ON "activity_challenges" USING btree ("challenge_id");--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_source_id_activity_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."activity_sources"("id") ON DELETE set null ON UPDATE no action;