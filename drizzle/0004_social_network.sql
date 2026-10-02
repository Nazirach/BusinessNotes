CREATE TABLE `follows` (
  `id` int AUTO_INCREMENT NOT NULL,
  `followerId` int NOT NULL,
  `followingId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `follows_id` PRIMARY KEY(`id`),
  CONSTRAINT `follows_follower_following_unique` UNIQUE(`followerId`,`followingId`)
);

CREATE TABLE `conversations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `directKey` varchar(64) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `conversations_id` PRIMARY KEY(`id`),
  CONSTRAINT `conversations_directKey_unique` UNIQUE(`directKey`)
);

CREATE TABLE `conversationParticipants` (
  `id` int AUTO_INCREMENT NOT NULL,
  `conversationId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `conversationParticipants_id` PRIMARY KEY(`id`),
  CONSTRAINT `conversation_participants_conversation_user_unique` UNIQUE(`conversationId`,`userId`)
);

CREATE TABLE `messages` (
  `id` int AUTO_INCREMENT NOT NULL,
  `conversationId` int NOT NULL,
  `senderId` int NOT NULL,
  `body` text NOT NULL,
  `readAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
