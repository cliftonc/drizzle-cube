CREATE TABLE `employee_teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`team_id` integer NOT NULL,
	`role` text,
	`joined_at` integer,
	`organisation_id` integer NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`organisation_id` integer NOT NULL,
	`created_at` integer
);
