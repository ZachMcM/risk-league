ALTER TABLE "battle_pass" RENAME COLUMN "startDate" TO "start_date";--> statement-breakpoint
ALTER TABLE "battle_pass" RENAME COLUMN "endDate" TO "end_date";--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_battle_pass_progress" ALTER COLUMN "battlePassId" SET NOT NULL;