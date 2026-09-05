CREATE TABLE `postSources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `postId` int NOT NULL,
  `addedBy` int NOT NULL,
  `url` varchar(500) NOT NULL,
  `publisher` varchar(180) NULL,
  `title` varchar(220) NULL,
  `publishedAt` timestamp NULL,
  `note` text NULL,
  `verificationStatus` enum('unverified','verified','rejected') NOT NULL DEFAULT 'unverified',
  `verifiedBy` int NULL,
  `verifiedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
