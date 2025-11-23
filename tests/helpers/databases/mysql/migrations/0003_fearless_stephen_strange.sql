CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`warehouse` varchar(100) NOT NULL,
	`stock_level` int NOT NULL,
	`organisation_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`sku` varchar(50) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`organisation_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`quantity` int NOT NULL,
	`revenue` decimal(10,2) NOT NULL,
	`sale_date` timestamp NOT NULL,
	`organisation_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
