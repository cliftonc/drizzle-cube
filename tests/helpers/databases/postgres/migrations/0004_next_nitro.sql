CREATE TABLE "inventory" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "inventory_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer NOT NULL,
	"warehouse" text NOT NULL,
	"stock_level" integer NOT NULL,
	"organisation_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"category" text NOT NULL,
	"sku" text NOT NULL,
	"price" real NOT NULL,
	"organisation_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sales_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"revenue" real NOT NULL,
	"sale_date" timestamp NOT NULL,
	"organisation_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
