CREATE TABLE "time_entries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "time_entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"employee_id" integer NOT NULL,
	"department_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"allocation_type" text NOT NULL,
	"hours" real NOT NULL,
	"description" text,
	"billable_hours" real DEFAULT 0,
	"organisation_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
