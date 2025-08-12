ALTER TABLE "team" ALTER COLUMN "abbreviation" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "city" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "state" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "mascot" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "arena" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "nickname";