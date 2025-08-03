ALTER TABLE "user" ALTER COLUMN "points" SET DEFAULT 1000;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "peakPoints" double precision DEFAULT 1000 NOT NULL;