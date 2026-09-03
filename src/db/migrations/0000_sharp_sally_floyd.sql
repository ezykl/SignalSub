CREATE TABLE `notification_log` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`type` text NOT NULL,
	`sent_at` text NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`billing_cycle` text DEFAULT 'monthly' NOT NULL,
	`next_renewal_date` text NOT NULL,
	`start_date` text NOT NULL,
	`color` text DEFAULT '#7B5EA7' NOT NULL,
	`icon_type` text DEFAULT 'initial' NOT NULL,
	`icon_value` text DEFAULT 'S' NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`is_trial` integer DEFAULT 0 NOT NULL,
	`trial_end_date` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`notify_before_days` integer DEFAULT 3 NOT NULL,
	`notification_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
