CREATE TABLE `time_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`department_id` integer NOT NULL,
	`date` integer NOT NULL,
	`allocation_type` text NOT NULL,
	`hours` real NOT NULL,
	`description` text,
	`billable_hours` real DEFAULT 0,
	`organisation_id` integer NOT NULL,
	`created_at` integer
);
