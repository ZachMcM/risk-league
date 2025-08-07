CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
ALTER TYPE "public"."choiceType" RENAME TO "choice_type";--> statement-breakpoint
CREATE TABLE "friendship" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"incoming_id" text NOT NULL,
	"outgoing_id" text NOT NULL,
	"status" "friendship_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "unique_friendship" UNIQUE("outgoing_id","incoming_id")
);
--> statement-breakpoint
ALTER TABLE "match" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "match_user" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "parlay" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "pick" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "player" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "prop" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_incoming_id_user_id_fk" FOREIGN KEY ("incoming_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_outgoing_id_user_id_fk" FOREIGN KEY ("outgoing_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;