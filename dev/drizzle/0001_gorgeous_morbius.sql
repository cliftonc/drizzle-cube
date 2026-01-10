CREATE TABLE "pr_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pr_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"pr_number" integer NOT NULL,
	"event_type" text NOT NULL,
	"employee_id" integer NOT NULL,
	"organisation_id" integer NOT NULL,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
