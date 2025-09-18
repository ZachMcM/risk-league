ALTER TABLE "baseball_team_stats" RENAME COLUMN "hitsAllowed" TO "hits_allowed";--> statement-breakpoint
ALTER TABLE "baseball_team_stats" RENAME COLUMN "runsAllowed" TO "runs_allowed";--> statement-breakpoint
ALTER TABLE "baseball_team_stats" RENAME COLUMN "pitchesThrown" TO "pitches_thrown";--> statement-breakpoint
ALTER TABLE "battle_pass" RENAME COLUMN "isActive" TO "is_active";--> statement-breakpoint
ALTER TABLE "battle_pass" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "battle_pass_tier" RENAME COLUMN "battlePassId" TO "battle_pass_id";--> statement-breakpoint
ALTER TABLE "battle_pass_tier" RENAME COLUMN "xpRequired" TO "xp_required";--> statement-breakpoint
ALTER TABLE "battle_pass_tier" RENAME COLUMN "cosmeticId" TO "cosmetic_id";--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" RENAME COLUMN "battlePassId" TO "battle_pass_id";--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" RENAME COLUMN "currentXp" TO "current_xp";--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "battle_pass_tier" DROP CONSTRAINT "battle_pass_tier_battlePassId_battle_pass_id_fk";
--> statement-breakpoint
ALTER TABLE "battle_pass_tier" DROP CONSTRAINT "battle_pass_tier_cosmeticId_cosmetic_id_fk";
--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" DROP CONSTRAINT "user_battle_pass_progress_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" DROP CONSTRAINT "user_battle_pass_progress_battlePassId_battle_pass_id_fk";
--> statement-breakpoint
ALTER TABLE "battle_pass_tier" ADD CONSTRAINT "battle_pass_tier_battle_pass_id_battle_pass_id_fk" FOREIGN KEY ("battle_pass_id") REFERENCES "public"."battle_pass"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_pass_tier" ADD CONSTRAINT "battle_pass_tier_cosmetic_id_cosmetic_id_fk" FOREIGN KEY ("cosmetic_id") REFERENCES "public"."cosmetic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" ADD CONSTRAINT "user_battle_pass_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" ADD CONSTRAINT "user_battle_pass_progress_battle_pass_id_battle_pass_id_fk" FOREIGN KEY ("battle_pass_id") REFERENCES "public"."battle_pass"("id") ON DELETE cascade ON UPDATE no action;