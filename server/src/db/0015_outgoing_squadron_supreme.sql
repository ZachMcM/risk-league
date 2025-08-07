ALTER TABLE "friendship" DROP CONSTRAINT "unique_friendship";--> statement-breakpoint
ALTER TABLE "friendship" DROP COLUMN "id";
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_outgoing_id_incoming_id_pk" PRIMARY KEY("outgoing_id","incoming_id");--> statement-breakpoint
