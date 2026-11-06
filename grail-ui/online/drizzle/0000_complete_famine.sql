CREATE TABLE `game_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`operation_id` text DEFAULT '' NOT NULL,
	`expires_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `game_rooms_expiry` ON `game_rooms` (`expires_at`);--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`player_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`room_code`) REFERENCES `game_rooms`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `game_sessions_expiry` ON `game_sessions` (`expires_at`);