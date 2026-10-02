CREATE TABLE `postEvidence` (
  `id` int AUTO_INCREMENT NOT NULL,
  `postId` int NOT NULL,
  `addedBy` int NOT NULL,
  `label` varchar(180) NOT NULL,
  `description` text NOT NULL,
  `url` varchar(500),
  `verificationStatus` enum('unverified','verified','rejected') NOT NULL DEFAULT 'unverified',
  `verifiedBy` int,
  `verifiedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `postEvidence_id` PRIMARY KEY(`id`)
);
