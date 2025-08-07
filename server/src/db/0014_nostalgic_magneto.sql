ALTER TABLE "friendship" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "friendship" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."friendship_status";--> statement-breakpoint
CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted');--> statement-breakpoint
ALTER TABLE "friendship" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."friendship_status";--> statement-breakpoint
ALTER TABLE "friendship" ALTER COLUMN "status" SET DATA TYPE "public"."friendship_status" USING "status"::"public"."friendship_status";