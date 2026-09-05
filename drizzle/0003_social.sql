CREATE TABLE `postComments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `postId` int NOT NULL,
  `userId` int NOT NULL,
  `body` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `postComments_id` PRIMARY KEY(`id`)
);

CREATE TABLE `postLikes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `postId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `postLikes_id` PRIMARY KEY(`id`),
  CONSTRAINT `postLikes_user_post_unique` UNIQUE(`userId`,`postId`)
);

CREATE TABLE `postSaves` (
  `id` int AUTO_INCREMENT NOT NULL,
  `postId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `postSaves_id` PRIMARY KEY(`id`),
  CONSTRAINT `postSaves_user_post_unique` UNIQUE(`userId`,`postId`)
);
