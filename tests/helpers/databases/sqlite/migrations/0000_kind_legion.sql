CREATE TABLE `analytics_pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`organisation_id` integer NOT NULL,
	`config` text NOT NULL,
	`order` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`organisation_id` integer NOT NULL,
	`budget` real
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`active` integer DEFAULT true,
	`department_id` integer,
	`organisation_id` integer NOT NULL,
	`salary` real,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `productivity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`date` integer NOT NULL,
	`lines_of_code` integer DEFAULT 0,
	`pull_requests` integer DEFAULT 0,
	`live_deployments` integer DEFAULT 0,
	`days_off` integer DEFAULT false,
	`happiness_index` integer,
	`organisation_id` integer NOT NULL,
	`created_at` integer
);
