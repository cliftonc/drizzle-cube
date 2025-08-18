CREATE TABLE "analytics_pages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "analytics_pages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text,
	"organisation_id" integer NOT NULL,
	"config" jsonb NOT NULL,
	"order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "productivity" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "productivity_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"employee_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"lines_of_code" integer DEFAULT 0,
	"pull_requests" integer DEFAULT 0,
	"live_deployments" integer DEFAULT 0,
	"days_off" boolean DEFAULT false,
	"happiness_index" integer,
	"organisation_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
