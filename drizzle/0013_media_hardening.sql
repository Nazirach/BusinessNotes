-- Media hardening: enforce one caption track per media/language at DB level.
ALTER TABLE `mediaCaptions` ADD CONSTRAINT `mediaCaptions_media_language_unique` UNIQUE (`mediaId`, `language`);
