-- Trust & Safety: user reports, blocks, and mutes.
CREATE TABLE `contentReports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reporterId` int NOT NULL,
  `postId` int NOT NULL,
  `reason` varchar(80) NOT NULL,
  `details` text,
  `status` enum('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
  `reviewedBy` int,
  `reviewedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `contentReports_reporter_post_unique` (`reporterId`,`postId`)
);
CREATE TABLE `userBlocks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `blockerId` int NOT NULL,
  `blockedId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userBlocks_blocker_blocked_unique` (`blockerId`,`blockedId`)
);
CREATE TABLE `userMutes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `muterId` int NOT NULL,
  `mutedId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userMutes_muter_muted_unique` (`muterId`,`mutedId`)
);
