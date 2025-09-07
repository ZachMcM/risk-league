ALTER TABLE "battle_pass_tier" DROP CONSTRAINT "battle_pass_tier_battlePassId_battle_pass_id_fk";
--> statement-breakpoint
ALTER TABLE "battle_pass_tier" DROP CONSTRAINT "battle_pass_tier_cosmeticId_cosmetic_id_fk";
--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" DROP CONSTRAINT "user_battle_pass_progress_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" DROP CONSTRAINT "user_battle_pass_progress_battlePassId_battle_pass_id_fk";
--> statement-breakpoint
ALTER TABLE "battle_pass" ALTER COLUMN "createdAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" ALTER COLUMN "currentXp" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" ALTER COLUMN "createdAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "battle_pass_tier" ADD CONSTRAINT "battle_pass_tier_battlePassId_battle_pass_id_fk" FOREIGN KEY ("battlePassId") REFERENCES "public"."battle_pass"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_pass_tier" ADD CONSTRAINT "battle_pass_tier_cosmeticId_cosmetic_id_fk" FOREIGN KEY ("cosmeticId") REFERENCES "public"."cosmetic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" ADD CONSTRAINT "user_battle_pass_progress_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" ADD CONSTRAINT "user_battle_pass_progress_battlePassId_battle_pass_id_fk" FOREIGN KEY ("battlePassId") REFERENCES "public"."battle_pass"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" DROP COLUMN "currentTier";