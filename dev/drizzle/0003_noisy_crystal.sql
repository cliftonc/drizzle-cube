CREATE TABLE "employee_teams" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "employee_teams_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"employee_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"role" text,
	"joined_at" timestamp DEFAULT now(),
	"organisation_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "teams_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text,
	"department_id" integer,
	"organisation_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "latitude" real;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "longitude" real;--> statement-breakpoint
CREATE INDEX "idx_employee_teams_org" ON "employee_teams" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "idx_employee_teams_employee" ON "employee_teams" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_employee_teams_team" ON "employee_teams" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_teams_org" ON "teams" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "idx_teams_org_dept" ON "teams" USING btree ("organisation_id","department_id");--> statement-breakpoint
CREATE INDEX "idx_employees_org" ON "employees" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "idx_employees_org_country" ON "employees" USING btree ("organisation_id","country");--> statement-breakpoint
CREATE INDEX "idx_employees_org_city" ON "employees" USING btree ("organisation_id","city");