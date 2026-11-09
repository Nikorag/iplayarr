CREATE TABLE "kv_store" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"queue" text NOT NULL,
	"data" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" text PRIMARY KEY NOT NULL,
	"data" text NOT NULL,
	"expires_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX "queue_entries_queue_idx" ON "queue_entries" USING btree ("queue","id");