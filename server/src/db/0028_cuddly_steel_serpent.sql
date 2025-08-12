ALTER TABLE "player" ALTER COLUMN "number" SET DATA TYPE integer USING number::integer;--> statement-breakpoint
ALTER TABLE "player" ALTER COLUMN "number" DROP NOT NULL;