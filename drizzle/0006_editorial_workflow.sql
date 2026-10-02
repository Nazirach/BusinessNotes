ALTER TABLE `posts` ADD COLUMN `status` varchar(24) NOT NULL DEFAULT 'published';
ALTER TABLE `posts` ADD COLUMN `submittedAt` timestamp NULL;
ALTER TABLE `posts` ADD COLUMN `publishedAt` timestamp NULL;
ALTER TABLE `posts` ADD COLUMN `reviewedBy` int NULL;
ALTER TABLE `posts` ADD COLUMN `reviewedAt` timestamp NULL;
ALTER TABLE `posts` ADD COLUMN `editorialNote` text NULL;
UPDATE `posts` SET `publishedAt` = `createdAt` WHERE `status` = 'published' AND `publishedAt` IS NULL;
