CREATE TABLE "attributes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attributes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"value_type" text DEFAULT 'string' NOT NULL,
	"organisation_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_attribute_values" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "employee_attribute_values_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"employee_id" integer NOT NULL,
	"attribute_id" integer NOT NULL,
	"value" text,
	"organisation_id" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_attributes_org" ON "attributes" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "idx_employee_attribute_values_org" ON "employee_attribute_values" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "idx_employee_attribute_values_lookup" ON "employee_attribute_values" USING btree ("employee_id","attribute_id");