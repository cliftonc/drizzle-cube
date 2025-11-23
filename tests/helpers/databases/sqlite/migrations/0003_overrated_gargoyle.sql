CREATE TABLE `inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`warehouse` text NOT NULL,
	`stock_level` integer NOT NULL,
	`organisation_id` integer NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`sku` text NOT NULL,
	`price` real NOT NULL,
	`organisation_id` integer NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`revenue` real NOT NULL,
	`sale_date` integer NOT NULL,
	`organisation_id` integer NOT NULL,
	`created_at` integer
);
