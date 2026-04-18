CREATE TABLE IF NOT EXISTS "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"status" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exports" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"query_id" integer,
	"file_path" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"natural_language_query" text,
	"sql_query" text NOT NULL,
	"results" jsonb,
	"is_saved" boolean DEFAULT false,
	"executed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scraped_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"domain" text NOT NULL,
	"title" text,
	"content" jsonb NOT NULL,
	"selectors" jsonb,
	"scraped_at" timestamp DEFAULT now(),
	"scraper_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scrapers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"selectors" jsonb NOT NULL,
	"frequency" text NOT NULL,
	"max_pages" integer DEFAULT 10,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_media_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"content" text NOT NULL,
	"author" text,
	"metrics" jsonb,
	"sentiment" text,
	"keywords" jsonb,
	"collected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "exports" ADD CONSTRAINT "exports_query_id_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."queries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "scraped_data" ADD CONSTRAINT "scraped_data_scraper_id_scrapers_id_fk" FOREIGN KEY ("scraper_id") REFERENCES "public"."scrapers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
