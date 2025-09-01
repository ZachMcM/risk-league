ALTER TABLE "dynasty_league_invitation" DROP CONSTRAINT "dynasty_league_invitation_outgoing_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "dynasty_league_invitation" DROP CONSTRAINT "dynasty_league_invitation_incoming_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "dynasty_league_invitation" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "dynasty_league_invitation" DROP COLUMN "outgoing_id";--> statement-breakpoint
ALTER TABLE "dynasty_league_invitation" DROP COLUMN "incoming_id";--> statement-breakpoint
DROP TYPE "public"."dynasty_league_invitation_status";