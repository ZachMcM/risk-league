ALTER TABLE "player" ALTER COLUMN "image" SET DEFAULT 'https://pub-6820f22e14b7440689345924f1390aed.r2.dev/players/default.png';--> statement-breakpoint
ALTER TABLE "player" ALTER COLUMN "image" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "image" text;