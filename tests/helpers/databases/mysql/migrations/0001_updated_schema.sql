CREATE TABLE `analytics_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(255),
	`organisation_id` int NOT NULL,
	`config` json NOT NULL,
	`order` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `analytics_pages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`organisation_id` int NOT NULL,
	`budget` decimal(12,2),
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`active` boolean DEFAULT true,
	`department_id` int,
	`organisation_id` int NOT NULL,
	`salary` decimal(10,2),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`date` timestamp NOT NULL,
	`lines_of_code` int DEFAULT 0,
	`pull_requests` int DEFAULT 0,
	`live_deployments` int DEFAULT 0,
	`days_off` boolean DEFAULT false,
	`happiness_index` int,
	`organisation_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `productivity_id` PRIMARY KEY(`id`)
);
