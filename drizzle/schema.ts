import { relations } from "drizzle-orm";
import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "reporter", "editor", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  headline: varchar("headline", { length: 180 }),
  bio: text("bio"),
  location: varchar("location", { length: 120 }),
  industry: varchar("industry", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const reporterRequests = mysqlTable("reporterRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  outlet: varchar("outlet", { length: 180 }),
  bio: text("bio").notNull(),
  evidence: text("evidence"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 120 }),
  location: varchar("location", { length: 120 }),
  website: varchar("website", { length: 255 }),
  verified: int("verified").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  companyId: int("companyId"),
  type: mysqlEnum("type", ["post", "article", "insight", "news", "video"]).default("post").notNull(),
  title: varchar("title", { length: 220 }),
  body: text("body").notNull(),
  source: varchar("source", { length: 255 }),
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "review", "verified"]).default("unverified").notNull(),
  status: varchar("status", { length: 24 }).default("published").notNull(),
  submittedAt: timestamp("submittedAt"),
  publishedAt: timestamp("publishedAt"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  editorialNote: text("editorialNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const postCorrections = mysqlTable("postCorrections", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  requesterId: int("requesterId").notNull(),
  previousTitle: varchar("previousTitle", { length: 220 }),
  previousBody: text("previousBody").notNull(),
  previousSource: varchar("previousSource", { length: 255 }),
  correctedTitle: varchar("correctedTitle", { length: 220 }),
  correctedBody: text("correctedBody").notNull(),
  correctedSource: varchar("correctedSource", { length: 255 }),
  reason: text("reason").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postTakedowns = mysqlTable("postTakedowns", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  adminId: int("adminId").notNull(),
  reason: text("reason").notNull(),
  evidence: text("evidence"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postAppeals = mysqlTable("postAppeals", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  appellantId: int("appellantId").notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postEvidence = mysqlTable("postEvidence", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  addedBy: int("addedBy").notNull(),
  label: varchar("label", { length: 180 }).notNull(),
  description: text("description").notNull(),
  url: varchar("url", { length: 500 }),
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "verified", "rejected"]).default("unverified").notNull(),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postSources = mysqlTable("postSources", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  addedBy: int("addedBy").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  publisher: varchar("publisher", { length: 180 }),
  title: varchar("title", { length: 220 }),
  publishedAt: timestamp("publishedAt"),
  note: text("note"),
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "verified", "rejected"]).default("unverified").notNull(),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const mediaAssets = mysqlTable("mediaAssets", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  postId: int("postId"),
  kind: mysqlEnum("kind", ["image", "video"]).notNull(),
  status: mysqlEnum("status", ["uploaded", "processing", "ready", "failed"]).default("uploaded").notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  url: varchar("url", { length: 600 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 600 }),
  durationMs: int("durationMs"),
  width: int("width"),
  height: int("height"),
  processingError: text("processingError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const mediaCaptions = mysqlTable("mediaCaptions", {
  id: int("id").autoincrement().primaryKey(),
  mediaId: int("mediaId").notNull(),
  language: varchar("language", { length: 16 }).notNull(),
  format: mysqlEnum("format", ["vtt", "srt", "text"]).default("vtt").notNull(),
  content: text("content").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const mediaModeration = mysqlTable("mediaModeration", {
  id: int("id").autoincrement().primaryKey(),
  mediaId: int("mediaId").notNull().unique(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  companyId: int("companyId"),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description").notNull(),
  sector: varchar("sector", { length: 120 }).notNull(),
  location: varchar("location", { length: 120 }),
  value: varchar("value", { length: 80 }),
  type: varchar("type", { length: 80 }).notNull(),
  stage: varchar("stage", { length: 80 }),
  deadline: timestamp("deadline"),
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "review", "verified"]).default("unverified").notNull(),
  interestedCount: int("interestedCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const interests = mysqlTable("interests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  opportunityId: int("opportunityId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  userOpportunityUnique: uniqueIndex("interests_user_opportunity_unique").on(table.userId, table.opportunityId),
}));

export const postComments = mysqlTable("postComments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postLikes = mysqlTable("postLikes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  userPostUnique: uniqueIndex("postLikes_user_post_unique").on(table.userId, table.postId),
}));

export const postSaves = mysqlTable("postSaves", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  userPostUnique: uniqueIndex("postSaves_user_post_unique").on(table.userId, table.postId),
}));

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  opportunityId: int("opportunityId").notNull(),
  ownerId: int("ownerId").notNull(),
  prospectId: int("prospectId").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "rejected", "won", "lost"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  opportunityProspectUnique: uniqueIndex("leads_opportunity_prospect_unique").on(table.opportunityId, table.prospectId),
}));

export const verificationRequests = mysqlTable("verificationRequests", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["company", "opportunity"]).notNull(),
  entityId: int("entityId").notNull(),
  requesterId: int("requesterId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  note: text("note"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const contentReports = mysqlTable("contentReports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull(),
  postId: int("postId").notNull(),
  reason: varchar("reason", { length: 80 }).notNull(),
  details: text("details"),
  status: mysqlEnum("status", ["pending", "reviewed", "dismissed"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  reporterPostUnique: uniqueIndex("contentReports_reporter_post_unique").on(table.reporterId, table.postId),
}));


export const moderationCases = mysqlTable("moderationCases", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId"),
  postId: int("postId").notNull(),
  openedBy: int("openedBy").notNull(),
  status: mysqlEnum("status", ["open", "under_review", "resolved", "dismissed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "critical"]).default("normal").notNull(),
  decision: varchar("decision", { length: 80 }),
  note: text("note"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const privacySettings = mysqlTable("privacySettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  profileVisibility: mysqlEnum("profileVisibility", ["public", "connections", "private"]).default("public").notNull(),
  discoverability: mysqlEnum("discoverability", ["everyone", "connections", "nobody"]).default("everyone").notNull(),
  allowMessages: mysqlEnum("allowMessages", ["everyone", "connections", "nobody"]).default("everyone").notNull(),
  personalizedRecommendations: int("personalizedRecommendations").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userBlocks = mysqlTable("userBlocks", {
  id: int("id").autoincrement().primaryKey(),
  blockerId: int("blockerId").notNull(),
  blockedId: int("blockedId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  blockerBlockedUnique: uniqueIndex("userBlocks_blocker_blocked_unique").on(table.blockerId, table.blockedId),
}));

export const userMutes = mysqlTable("userMutes", {
  id: int("id").autoincrement().primaryKey(),
  muterId: int("muterId").notNull(),
  mutedId: int("mutedId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  muterMutedUnique: uniqueIndex("userMutes_muter_muted_unique").on(table.muterId, table.mutedId),
}));

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: int("entityId").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  followerFollowingUnique: uniqueIndex("follows_follower_following_unique").on(table.followerId, table.followingId),
}));

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  directKey: varchar("directKey", { length: 64 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const conversationParticipants = mysqlTable("conversationParticipants", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  conversationUserUnique: uniqueIndex("conversation_participants_conversation_user_unique").on(table.conversationId, table.userId),
}));

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  body: text("body").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 60 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  companies: many(companies),
  posts: many(posts),
  opportunities: many(opportunities),
  followers: many(follows, { relationName: "follower" }),
  following: many(follows, { relationName: "following" }),
  conversationParticipants: many(conversationParticipants),
  sentMessages: many(messages),
  notifications: many(notifications),
  leadsOwned: many(leads, { relationName: "leadOwner" }),
  leadsProspects: many(leads, { relationName: "leadProspect" }),
  verificationRequests: many(verificationRequests, { relationName: "verificationRequester" }),
  verificationReviews: many(verificationRequests, { relationName: "verificationReviewer" }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  opportunity: one(opportunities, { fields: [leads.opportunityId], references: [opportunities.id] }),
  owner: one(users, { fields: [leads.ownerId], references: [users.id], relationName: "leadOwner" }),
  prospect: one(users, { fields: [leads.prospectId], references: [users.id], relationName: "leadProspect" }),
}));

export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => ({
  requester: one(users, { fields: [verificationRequests.requesterId], references: [users.id], relationName: "verificationRequester" }),
  reviewer: one(users, { fields: [verificationRequests.reviewedBy], references: [users.id], relationName: "verificationReviewer" }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: "follower" }),
  following: one(users, { fields: [follows.followingId], references: [users.id], relationName: "following" }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, { fields: [conversationParticipants.conversationId], references: [conversations.id] }),
  user: one(users, { fields: [conversationParticipants.userId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type PostComment = typeof postComments.$inferSelect;
export type PostLike = typeof postLikes.$inferSelect;
export type PostSave = typeof postSaves.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type PostCorrection = typeof postCorrections.$inferSelect;
export type PostTakedown = typeof postTakedowns.$inferSelect;
export type PostAppeal = typeof postAppeals.$inferSelect;
export type PostSource = typeof postSources.$inferSelect;
export type PostEvidence = typeof postEvidence.$inferSelect;
