CREATE TABLE "battle_pass" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"maxTier" integer NOT NULL,
	"isActive" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "battle_pass_tier" (
	"id" serial PRIMARY KEY NOT NULL,
	"battlePassId" integer,
	"tier" integer NOT NULL,
	"xpRequired" integer NOT NULL,
	"cosmeticId" integer
);
--> statement-breakpoint
CREATE TABLE "user_battle_pass_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text,
	"battlePassId" integer,
	"currentXp" integer DEFAULT 0,
	"currentTier" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "battle_pass_tier" ADD CONSTRAINT "battle_pass_tier_battlePassId_battle_pass_id_fk" FOREIGN KEY ("battlePassId") REFERENCES "public"."battle_pass"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_pass_tier" ADD CONSTRAINT "battle_pass_tier_cosmeticId_cosmetic_id_fk" FOREIGN KEY ("cosmeticId") REFERENCES "public"."cosmetic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" ADD CONSTRAINT "user_battle_pass_progress_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" ADD CONSTRAINT "user_battle_pass_progress_battlePassId_battle_pass_id_fk" FOREIGN KEY ("battlePassId") REFERENCES "public"."battle_pass"("id") ON DELETE no action ON UPDATE no action;