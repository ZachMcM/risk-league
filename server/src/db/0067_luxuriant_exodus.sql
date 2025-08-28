ALTER TABLE "dynasty_league" RENAME COLUMN "inviteOnly" TO "invite_only";--> statement-breakpoint
ALTER TABLE "dynasty_league" ADD COLUMN "starting_balance" double precision NOT NULL;