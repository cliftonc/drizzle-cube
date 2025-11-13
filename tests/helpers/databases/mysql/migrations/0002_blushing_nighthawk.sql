CREATE TABLE `employee_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`team_id` int NOT NULL,
	`role` varchar(50),
	`joined_at` timestamp DEFAULT (now()),
	`organisation_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `employee_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`organisation_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
