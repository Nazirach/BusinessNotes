ALTER TABLE `users` MODIFY COLUMN `role` enum('user','reporter','editor','admin') NOT NULL DEFAULT 'user';
CREATE TABLE `reporterRequests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `outlet` varchar(180),
  `bio` text NOT NULL,
  `evidence` text,
  `reviewedBy` int,
  `reviewedAt` timestamp,
  `reviewNote` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `reporterRequests_id` PRIMARY KEY(`id`)
);
CREATE INDEX `reporterRequests_userId_idx` ON `reporterRequests` (`userId`);
CREATE INDEX `reporterRequests_status_idx` ON `reporterRequests` (`status`);
