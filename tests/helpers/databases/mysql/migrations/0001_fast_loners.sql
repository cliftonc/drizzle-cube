CREATE TABLE `time_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`department_id` int NOT NULL,
	`date` timestamp NOT NULL,
	`allocation_type` varchar(50) NOT NULL,
	`hours` decimal(4,2) NOT NULL,
	`description` text,
	`billable_hours` decimal(4,2) DEFAULT '0.00',
	`organisation_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `time_entries_id` PRIMARY KEY(`id`)
);
-- --> statement-breakpoint
-- ALTER TABLE `analytics_pages` MODIFY COLUMN `config` json NOT NULL;--> statement-breakpoint
-- ALTER TABLE `productivity` MODIFY COLUMN `happiness_index` int;--> statement-breakpoint
-- ALTER TABLE `analytics_pages` ADD `description` varchar(255);--> statement-breakpoint
-- ALTER TABLE `analytics_pages` ADD `order` int DEFAULT 0;--> statement-breakpoint
-- ALTER TABLE `analytics_pages` ADD `is_active` boolean DEFAULT true;--> statement-breakpoint
-- ALTER TABLE `analytics_pages` ADD `updated_at` timestamp DEFAULT (now());--> statement-breakpoint
-- ALTER TABLE `productivity` ADD `pull_requests` int DEFAULT 0;--> statement-breakpoint
-- ALTER TABLE `productivity` ADD `live_deployments` int DEFAULT 0;--> statement-breakpoint
-- ALTER TABLE `productivity` ADD `days_off` boolean DEFAULT false;--> statement-breakpoint
-- ALTER TABLE `productivity` DROP COLUMN `commits`;--> statement-breakpoint
-- ALTER TABLE `productivity` DROP COLUMN `code_reviews`;