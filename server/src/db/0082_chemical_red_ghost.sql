ALTER TABLE "battle_pass_tier" ALTER COLUMN "cosmeticId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_cosmetic" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_cosmetic" ALTER COLUMN "cosmetic_id" SET NOT NULL;