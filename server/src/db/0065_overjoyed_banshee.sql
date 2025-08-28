CREATE TYPE "public"."dynasty_league_user_roles" AS ENUM('manager', 'member');--> statement-breakpoint
CREATE TYPE "public"."dynasty_league_invitation_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TABLE "dynasty_league" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"resolved" boolean,
	"league" "league_type" NOT NULL,
	"inviteOnly" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dynasty_league_invitation" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "dynasty_league_invitation_status" DEFAULT 'pending' NOT NULL,
	"outgoing_id" text NOT NULL,
	"incoming_id" text NOT NULL,
	"dynasty_league_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dynasty_league_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"balance" double precision DEFAULT 200 NOT NULL,
	"placement" integer,
	"user_id" text NOT NULL,
	"dynasty_league_id" integer NOT NULL,
	"starting_balance" double precision DEFAULT 100 NOT NULL,
	"role" "dynasty_league_user_roles" NOT NULL
);
--> statement-breakpoint
DROP INDEX "idx_message_match_id";--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "match_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "parlay" ALTER COLUMN "match_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "dynasty_league_id" integer;--> statement-breakpoint
ALTER TABLE "parlay" ADD COLUMN "dynasty_league_user_id" integer;--> statement-breakpoint
ALTER TABLE "dynasty_league_invitation" ADD CONSTRAINT "dynasty_league_invitation_outgoing_id_user_id_fk" FOREIGN KEY ("outgoing_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynasty_league_invitation" ADD CONSTRAINT "dynasty_league_invitation_incoming_id_user_id_fk" FOREIGN KEY ("incoming_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynasty_league_invitation" ADD CONSTRAINT "dynasty_league_invitation_dynasty_league_id_dynasty_league_id_fk" FOREIGN KEY ("dynasty_league_id") REFERENCES "public"."dynasty_league"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynasty_league_user" ADD CONSTRAINT "dynasty_league_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynasty_league_user" ADD CONSTRAINT "dynasty_league_user_dynasty_league_id_dynasty_league_id_fk" FOREIGN KEY ("dynasty_league_id") REFERENCES "public"."dynasty_league"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dynasty_league_user_created_at" ON "dynasty_league_user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_dynasty_league_user_dynasty_league_id" ON "dynasty_league_user" USING btree ("dynasty_league_id");--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_dynasty_league_id_dynasty_league_id_fk" FOREIGN KEY ("dynasty_league_id") REFERENCES "public"."dynasty_league"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parlay" ADD CONSTRAINT "parlay_dynasty_league_user_id_dynasty_league_user_id_fk" FOREIGN KEY ("dynasty_league_user_id") REFERENCES "public"."dynasty_league_user"("id") ON DELETE cascade ON UPDATE no action;