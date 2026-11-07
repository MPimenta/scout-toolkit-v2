CREATE TABLE "challenge_goals" (
	"challenge_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	CONSTRAINT "challenge_goals_challenge_id_goal_id_pk" PRIMARY KEY("challenge_id","goal_id")
);
--> statement-breakpoint
CREATE TABLE "challenge_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_managed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "challenge_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"type_id" uuid NOT NULL,
	"age_group" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"is_managed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "challenges_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "educational_goal_age_groups" (
	"goal_id" uuid NOT NULL,
	"age_group" text NOT NULL,
	CONSTRAINT "educational_goal_age_groups_goal_id_age_group_pk" PRIMARY KEY("goal_id","age_group")
);
--> statement-breakpoint
CREATE TABLE "educational_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_managed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "educational_paths_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "general_objectives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_id" uuid NOT NULL,
	"path_id" uuid,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_managed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "general_objectives_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "educational_areas" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "educational_areas" ADD COLUMN "is_managed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "educational_goals" ADD COLUMN "general_objective_id" uuid;--> statement-breakpoint
ALTER TABLE "educational_goals" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "educational_goals" ADD COLUMN "is_managed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "challenge_goals" ADD CONSTRAINT "challenge_goals_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_goals" ADD CONSTRAINT "challenge_goals_goal_id_educational_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."educational_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_type_id_challenge_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."challenge_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_goal_age_groups" ADD CONSTRAINT "educational_goal_age_groups_goal_id_educational_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."educational_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_paths" ADD CONSTRAINT "educational_paths_area_id_educational_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."educational_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general_objectives" ADD CONSTRAINT "general_objectives_area_id_educational_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."educational_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general_objectives" ADD CONSTRAINT "general_objectives_path_id_educational_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."educational_paths"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "challenge_goals_goal_idx" ON "challenge_goals" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "challenges_type_idx" ON "challenges" USING btree ("type_id");--> statement-breakpoint
CREATE INDEX "challenges_age_group_idx" ON "challenges" USING btree ("age_group");--> statement-breakpoint
CREATE INDEX "educational_goal_age_groups_value_idx" ON "educational_goal_age_groups" USING btree ("age_group");--> statement-breakpoint
CREATE INDEX "general_objectives_area_idx" ON "general_objectives" USING btree ("area_id");--> statement-breakpoint
ALTER TABLE "educational_goals" ADD CONSTRAINT "educational_goals_general_objective_id_general_objectives_id_fk" FOREIGN KEY ("general_objective_id") REFERENCES "public"."general_objectives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "educational_goals_general_objective_idx" ON "educational_goals" USING btree ("general_objective_id");