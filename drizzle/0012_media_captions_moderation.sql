CREATE TABLE `mediaCaptions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `mediaId` int NOT NULL,
  `language` varchar(16) NOT NULL,
  `format` enum('vtt','srt','text') NOT NULL DEFAULT 'vtt',
  `content` text NOT NULL,
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
CREATE TABLE `mediaModeration` (
  `id` int AUTO_INCREMENT NOT NULL,
  `mediaId` int NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewedBy` int,
  `reviewedAt` timestamp,
  `note` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mediaModeration_mediaId_unique` (`mediaId`)
);
