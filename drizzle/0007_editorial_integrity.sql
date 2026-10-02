CREATE TABLE `postCorrections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `postId` int NOT NULL,
  `requesterId` int NOT NULL,
  `previousTitle` varchar(220) NULL,
  `previousBody` text NOT NULL,
  `previousSource` varchar(255) NULL,
  `correctedTitle` varchar(220) NULL,
  `correctedBody` text NOT NULL,
  `correctedSource` varchar(255) NULL,
  `reason` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
CREATE TABLE `postTakedowns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `postId` int NOT NULL,
  `adminId` int NOT NULL,
  `reason` text NOT NULL,
  `evidence` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
CREATE TABLE `postAppeals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `postId` int NOT NULL,
  `appellantId` int NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewedBy` int NULL,
  `reviewedAt` timestamp NULL,
  `reviewNote` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
