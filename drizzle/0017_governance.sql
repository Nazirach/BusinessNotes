-- Governance: moderation cases and privacy controls
CREATE TABLE `moderationCases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reportId` int,
  `postId` int NOT NULL,
  `openedBy` int NOT NULL,
  `status` enum('open','under_review','resolved','dismissed') NOT NULL DEFAULT 'open',
  `priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
  `decision` varchar(80),
  `note` text,
  `reviewedBy` int,
  `reviewedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
CREATE TABLE `privacySettings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `profileVisibility` enum('public','connections','private') NOT NULL DEFAULT 'public',
  `discoverability` enum('everyone','connections','nobody') NOT NULL DEFAULT 'everyone',
  `allowMessages` enum('everyone','connections','nobody') NOT NULL DEFAULT 'everyone',
  `personalizedRecommendations` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `privacySettings_user_unique` (`userId`)
);
