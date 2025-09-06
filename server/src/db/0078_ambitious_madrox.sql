CREATE TYPE "public"."cosmetic_type" AS ENUM('banner', 'image');--> statement-breakpoint
CREATE TABLE "cosmetic" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"type" "cosmetic_type" NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"is_default" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_cosmetic" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"cosmetic_id" integer
);
--> statement-breakpoint
ALTER TABLE "user_cosmetic" ADD CONSTRAINT "user_cosmetic_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cosmetic" ADD CONSTRAINT "user_cosmetic_cosmetic_id_cosmetic_id_fk" FOREIGN KEY ("cosmetic_id") REFERENCES "public"."cosmetic"("id") ON DELETE cascade ON UPDATE no action;