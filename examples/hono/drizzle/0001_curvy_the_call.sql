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
