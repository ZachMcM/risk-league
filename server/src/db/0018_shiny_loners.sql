CREATE TYPE "public"."friendly_match_request_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TABLE "friendly_match_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"incoming_id" text NOT NULL,
	"outgoing_id" text NOT NULL,
	"status" "friendly_match_request_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "friendly_match_request" ADD CONSTRAINT "friendly_match_request_incoming_id_user_id_fk" FOREIGN KEY ("incoming_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendly_match_request" ADD CONSTRAINT "friendly_match_request_outgoing_id_user_id_fk" FOREIGN KEY ("outgoing_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;