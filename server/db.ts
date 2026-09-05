import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { auditLogs, companies, InsertUser, opportunities, posts, profiles, users, interests, postComments, postLikes, postSaves, follows, conversations, conversationParticipants, messages, notifications, leads, verificationRequests, postCorrections, postTakedowns, postAppeals, postSources, postEvidence, reporterRequests, contentReports, userBlocks, userMutes, mediaAssets, mediaCaptions, mediaModeration, moderationCases, privacySettings } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function requestReporterStatus(userId: number, input: { outlet?: string; bio: string; evidence?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (!input.bio.trim()) throw new Error("Reporter bio is required");
  const user = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]) throw new Error("User not found");
  if (user[0].role === "reporter" || user[0].role === "editor" || user[0].role === "admin") throw new Error("User already has an elevated editorial role");
  const existing = await db.select().from(reporterRequests).where(and(eq(reporterRequests.userId, userId), eq(reporterRequests.status, "pending"))).limit(1);
  if (existing[0]) return existing[0];
  const result = await db.insert(reporterRequests).values({ userId, outlet: input.outlet?.trim() || null, bio: input.bio.trim(), evidence: input.evidence?.trim() || null });
  const id = Number(result[0]?.insertId);
  await db.insert(auditLogs).values({ userId, action: "reporter.request", entityType: "user", entityId: userId, metadata: JSON.stringify({ requestId: id }) });
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  await Promise.all(admins.map(admin => createNotification({ userId: admin.id, type: "reporter", title: "Reporter application submitted", body: `User #${userId} requested reporter status.` })));
  return (await db.select().from(reporterRequests).where(eq(reporterRequests.id, id)).limit(1))[0];
}

export async function listReporterRequests(status?: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return [];
  const whereClause = status ? eq(reporterRequests.status, status) : undefined;
  return db.select({
    id: reporterRequests.id, userId: reporterRequests.userId, status: reporterRequests.status,
    outlet: reporterRequests.outlet, bio: reporterRequests.bio, evidence: reporterRequests.evidence,
    reviewedBy: reporterRequests.reviewedBy, reviewedAt: reporterRequests.reviewedAt, reviewNote: reporterRequests.reviewNote,
    createdAt: reporterRequests.createdAt, userName: users.name, userEmail: users.email,
  }).from(reporterRequests).leftJoin(users, eq(users.id, reporterRequests.userId))
    .where(whereClause).orderBy(desc(reporterRequests.createdAt));
}

export async function reviewReporterStatus(adminId: number, requestId: number, decision: "approved" | "rejected", note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const row = await db.select().from(reporterRequests).where(eq(reporterRequests.id, requestId)).limit(1);
  if (!row[0]) throw new Error("Reporter request not found");
  if (row[0].status !== "pending") throw new Error("Reporter request is not pending");
  await db.update(reporterRequests).set({ status: decision, reviewedBy: adminId, reviewedAt: new Date(), reviewNote: note?.trim() || null }).where(eq(reporterRequests.id, requestId));
  if (decision === "approved") await db.update(users).set({ role: "reporter", updatedAt: new Date() }).where(eq(users.id, row[0].userId));
  await db.insert(auditLogs).values({ userId: adminId, action: `reporter.${decision}`, entityType: "user", entityId: row[0].userId, metadata: JSON.stringify({ requestId, note: note?.trim() || null }) });
  await createNotification({ userId: row[0].userId, type: "reporter", title: decision === "approved" ? "Reporter status approved" : "Reporter application rejected", body: note?.trim() || (decision === "approved" ? "You can now submit journalism content as a verified reporter." : "Your reporter application was not approved.") });
  return (await db.select().from(reporterRequests).where(eq(reporterRequests.id, requestId)).limit(1))[0];
}

export async function setEditorRole(adminId: number, userId: number, enabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const target = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!target[0]) throw new Error("User not found");
  if (target[0].role === "admin") throw new Error("Admin role cannot be changed here");
  const nextRole = enabled ? "editor" : "user";
  await db.update(users).set({ role: nextRole, updatedAt: new Date() }).where(eq(users.id, userId));
  await db.insert(auditLogs).values({ userId: adminId, action: enabled ? "editor.grant" : "editor.revoke", entityType: "user", entityId: userId, metadata: JSON.stringify({ previousRole: target[0].role, nextRole }) });
  await createNotification({ userId, type: "editorial", title: enabled ? "Editor access granted" : "Editor access revoked", body: enabled ? "You can now review and publish editorial submissions." : "Your editor access has been revoked." });
  return (await db.select({ id: users.id, role: users.role, name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1))[0];
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listBusinessData(viewerId?: number) {
  const db = await getDb();
  if (!db) return { posts: [], opportunities: [], companies: [] };
  const [postRows, opportunityRows, companyRows] = await Promise.all([
    db.select({ post: posts, authorName: users.name }).from(posts).leftJoin(users, eq(posts.authorId, users.id)).where(eq(posts.status, "published")).orderBy(desc(posts.createdAt)).limit(60),
    db.select().from(opportunities).orderBy(desc(opportunities.createdAt)).limit(60),
    db.select().from(companies).orderBy(desc(companies.createdAt)).limit(60),
  ]);
  const allowedOwner = async (ownerId: number) => {
    if (!viewerId) {
      const settings = await db.select({ discoverability: privacySettings.discoverability }).from(privacySettings).where(eq(privacySettings.userId, ownerId)).limit(1);
      return (settings[0]?.discoverability ?? "everyone") !== "nobody";
    }
    return await canDiscover(db, viewerId, ownerId) && !(await isMuted(db, viewerId, ownerId));
  };
  const visiblePosts = [];
  for (const row of postRows) if (row.post.authorId === undefined || await allowedOwner(row.post.authorId)) visiblePosts.push({ ...row.post, authorName: row.authorName });
  const visibleOpportunities = [];
  for (const row of opportunityRows) if (await allowedOwner(row.ownerId)) visibleOpportunities.push(row);
  const visibleCompanies = [];
  for (const row of companyRows) if (await allowedOwner(row.ownerId)) visibleCompanies.push(row);
  return { posts: visiblePosts.slice(0, 30), opportunities: visibleOpportunities.slice(0, 30), companies: visibleCompanies.slice(0, 30) };
}

export async function createBusinessPost(input: { authorId: number; type: "post" | "article" | "insight" | "news" | "video"; title?: string; body: string; source?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const isEditorial = input.type === "article" || input.type === "news";
  if (isEditorial) {
    const author = await db.select({ role: users.role }).from(users).where(eq(users.id, input.authorId)).limit(1);
    if (!author[0]) throw new Error("Author not found");
    if (!["reporter", "editor", "admin"].includes(author[0].role)) throw new Error("Reporter or editor access is required for journalism content");
    if (input.type === "news" && !input.source?.trim()) throw new Error("News requires a source URL");
  }
  const result = await db.insert(posts).values({ ...input, verificationStatus: input.source ? "review" : "unverified", status: isEditorial ? "draft" : "published", publishedAt: isEditorial ? null : new Date() });
  const insertedId = Number(result[0]?.insertId);
  const saved = await db.select().from(posts).where(eq(posts.id, insertedId)).limit(1);
  if (!saved[0]) throw new Error("Post could not be loaded after save");
  return saved[0];
}

export async function addPostEvidence(userId: number, input: { postId: number; label: string; description: string; url?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const post = await db.select().from(posts).where(and(eq(posts.id, input.postId), eq(posts.authorId, userId))).limit(1);
  if (!post[0]) throw new Error("Editorial post not found");
  if (!(post[0].type === "article" || post[0].type === "news")) throw new Error("Evidence can only be attached to articles or news");
  if (!input.label.trim() || !input.description.trim()) throw new Error("Evidence label and description are required");
  const result = await db.insert(postEvidence).values({ postId: input.postId, addedBy: userId, label: input.label.trim(), description: input.description.trim(), url: input.url?.trim() || null });
  const id = Number(result[0]?.insertId);
  await db.insert(auditLogs).values({ userId, action: "editorial.evidence.add", entityType: "post", entityId: input.postId, metadata: JSON.stringify({ evidenceId: id }) });
  return (await db.select().from(postEvidence).where(eq(postEvidence.id, id)).limit(1))[0];
}

export async function addPostSource(userId: number, input: { postId: number; url: string; publisher?: string; title?: string; publishedAt?: Date; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const post = await db.select({ id: posts.id, authorId: posts.authorId, type: posts.type }).from(posts).where(eq(posts.id, input.postId)).limit(1);
  if (!post[0]) throw new Error("Editorial post not found");
  if (post[0].authorId !== userId) throw new Error("Only the author can add a source");
  if (!(post[0].type === "article" || post[0].type === "news")) throw new Error("Sources can only be attached to articles or news");
  const result = await db.insert(postSources).values({ postId: input.postId, addedBy: userId, url: input.url.trim(), publisher: input.publisher?.trim() || null, title: input.title?.trim() || null, publishedAt: input.publishedAt, note: input.note?.trim() || null });
  const id = Number(result[0]?.insertId);
  await db.insert(auditLogs).values({ userId, action: "editorial.source.add", entityType: "post", entityId: input.postId, metadata: JSON.stringify({ sourceId: id, url: input.url.trim() }) });
  return (await db.select().from(postSources).where(eq(postSources.id, id)).limit(1))[0];
}

export async function listPostSources(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postSources).where(eq(postSources.postId, postId)).orderBy(desc(postSources.createdAt));
}

export async function verifyPostSource(adminId: number, sourceId: number, decision: "verified" | "rejected", note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const row = await db.select().from(postSources).where(eq(postSources.id, sourceId)).limit(1);
  if (!row[0]) throw new Error("Source not found");
  await db.update(postSources).set({ verificationStatus: decision, verifiedBy: adminId, verifiedAt: new Date(), note: note?.trim() || row[0].note }).where(eq(postSources.id, sourceId));
  await db.insert(auditLogs).values({ userId: adminId, action: `editorial.source.${decision}`, entityType: "post", entityId: row[0].postId, metadata: JSON.stringify({ sourceId, note: note?.trim() || null }) });
  return (await db.select().from(postSources).where(eq(postSources.id, sourceId)).limit(1))[0];
}

export async function getPublicEditorialById(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ post: posts, authorName: users.name }).from(posts).leftJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.id, postId), eq(posts.status, "published"), inArray(posts.type, ["article", "news"]))).limit(1);
  if (!rows[0]) return null;
  return { ...rows[0].post, authorName: rows[0].authorName };
}

export async function listPublishedNews() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ post: posts, authorName: users.name }).from(posts).leftJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.type, "news"), eq(posts.status, "published"))).orderBy(desc(posts.publishedAt), desc(posts.createdAt)).limit(50);
  const postRows = rows.map(row => ({ ...row.post, authorName: row.authorName }));
  const sources = postRows.length ? await db.select().from(postSources).where(inArray(postSources.postId, postRows.map(row => row.id))).orderBy(desc(postSources.createdAt)) : [];
  const byPost = new Map<number, typeof sources>();
  for (const source of sources) byPost.set(source.postId, [...(byPost.get(source.postId) ?? []), source]);
  return postRows.map(row => ({ ...row, sources: byPost.get(row.id) ?? [] }));
}

export async function listEditorialPostsByAuthor(authorId: number, includeAll = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const whereClause = includeAll ? inArray(posts.type, ["article", "news"]) : and(eq(posts.authorId, authorId), inArray(posts.type, ["article", "news"]));
  const rows = await db.select().from(posts).where(whereClause).orderBy(desc(posts.createdAt));
  if (!rows.length) return [];
  const sources = await db.select().from(postSources).where(inArray(postSources.postId, rows.map(row => row.id))).orderBy(desc(postSources.createdAt));
  const evidence = await db.select().from(postEvidence).where(inArray(postEvidence.postId, rows.map(row => row.id))).orderBy(desc(postEvidence.createdAt));
  const byPost = new Map<number, typeof sources>();
  const evidenceByPost = new Map<number, typeof evidence>();
  for (const source of sources) byPost.set(source.postId, [...(byPost.get(source.postId) ?? []), source]);
  for (const item of evidence) evidenceByPost.set(item.postId, [...(evidenceByPost.get(item.postId) ?? []), item]);
  return rows.map(row => ({ ...row, sources: byPost.get(row.id) ?? [], evidence: evidenceByPost.get(row.id) ?? [] }));
}

export async function listEditorialCorrectionHistory(userId: number, postId: number, canSeeAll = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const post = await db.select({ authorId: posts.authorId, type: posts.type }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post[0]) throw new Error("Editorial post not found");
  if (!(post[0].type === "article" || post[0].type === "news")) throw new Error("Only articles or news have correction history");
  if (!canSeeAll && post[0].authorId !== userId) throw new Error("Only the author can view correction history");
  return db.select().from(postCorrections).where(eq(postCorrections.postId, postId)).orderBy(desc(postCorrections.createdAt));
}

export async function listEditorialQueue(status?: "draft" | "review" | "published" | "rejected" | "takedown") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const whereClause = status ? and(inArray(posts.type, ["article", "news"]), eq(posts.status, status)) : and(inArray(posts.type, ["article", "news"]), eq(posts.status, "review"));
  return db.select({ id: posts.id, authorId: posts.authorId, type: posts.type, title: posts.title, body: posts.body, source: posts.source, status: posts.status, submittedAt: posts.submittedAt, publishedAt: posts.publishedAt, reviewedBy: posts.reviewedBy, reviewedAt: posts.reviewedAt, editorialNote: posts.editorialNote, authorName: users.name }).from(posts).leftJoin(users, eq(users.id, posts.authorId)).where(whereClause).orderBy(desc(posts.submittedAt), desc(posts.createdAt));
}

export async function updateEditorialDraft(authorId: number, postId: number, input: { title: string; body: string; source?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const row = await db.select().from(posts).where(and(eq(posts.id, postId), eq(posts.authorId, authorId))).limit(1);
  if (!row[0]) throw new Error("Editorial post not found");
  if (!(row[0].type === "article" || row[0].type === "news")) throw new Error("Only articles or news can be edited here");
  if (!(row[0].status === "draft" || row[0].status === "rejected")) throw new Error("Only draft or rejected editorial content can be edited");
  if (!input.title.trim() || !input.body.trim()) throw new Error("Title and body are required");
  await db.update(posts).set({ title: input.title.trim(), body: input.body.trim(), source: input.source?.trim() || null, updatedAt: new Date(), editorialNote: row[0].status === "rejected" ? null : row[0].editorialNote }).where(eq(posts.id, postId));
  await db.insert(auditLogs).values({ userId: authorId, action: "editorial.draft.update", entityType: "post", entityId: postId, metadata: JSON.stringify({ previousStatus: row[0].status }) });
  return (await db.select().from(posts).where(eq(posts.id, postId)).limit(1))[0];
}

export async function submitEditorialPost(authorId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const row = await db.select().from(posts).where(and(eq(posts.id, postId), eq(posts.authorId, authorId))).limit(1);
  if (!row[0]) throw new Error("Editorial post not found");
  if (!["draft", "rejected"].includes(row[0].status)) throw new Error("Editorial post cannot be submitted from its current status");
  await db.update(posts).set({ status: "review", submittedAt: new Date(), editorialNote: null }).where(eq(posts.id, postId));
  await db.insert(auditLogs).values({ userId: authorId, action: "editorial.submit", entityType: "post", entityId: postId, metadata: JSON.stringify({ type: row[0].type }) });
  return (await db.select().from(posts).where(eq(posts.id, postId)).limit(1))[0];
}

export async function reviewEditorialPost(adminId: number, postId: number, decision: "approved" | "rejected", note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const row = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!row[0]) throw new Error("Editorial post not found");
  if (row[0].status !== "review") throw new Error("Editorial post is not awaiting review");
  await db.update(posts).set({ status: decision === "approved" ? "published" : "rejected", publishedAt: decision === "approved" ? new Date() : null, reviewedBy: adminId, reviewedAt: new Date(), editorialNote: note ?? null }).where(eq(posts.id, postId));
  await db.insert(auditLogs).values({ userId: adminId, action: `editorial.${decision}`, entityType: "post", entityId: postId, metadata: JSON.stringify({ note: note ?? null }) });
  await createNotification({ userId: row[0].authorId, type: "editorial", title: decision === "approved" ? "Content published" : "Content needs revision", body: note || (decision === "approved" ? "Your submission has been published." : "Your submission was not approved. Review the editorial note and resubmit.") });
  return (await db.select().from(posts).where(eq(posts.id, postId)).limit(1))[0];
}

export async function correctEditorialPost(authorId: number, postId: number, input: { title?: string; body: string; source?: string; reason: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const row = await db.select().from(posts).where(and(eq(posts.id, postId), eq(posts.authorId, authorId))).limit(1);
  if (!row[0]) throw new Error("Editorial post not found");
  if (!(["article", "news"].includes(row[0].type) && row[0].status === "published")) throw new Error("Only published articles or news can be corrected");
  if (!input.body.trim() || !input.reason.trim()) throw new Error("Correction body and reason are required");
  await db.insert(postCorrections).values({ postId, requesterId: authorId, previousTitle: row[0].title, previousBody: row[0].body, previousSource: row[0].source, correctedTitle: input.title ?? row[0].title, correctedBody: input.body.trim(), correctedSource: input.source ?? row[0].source, reason: input.reason.trim() });
  await db.update(posts).set({ title: input.title ?? row[0].title, body: input.body.trim(), source: input.source ?? row[0].source, updatedAt: new Date() }).where(eq(posts.id, postId));
  await db.insert(auditLogs).values({ userId: authorId, action: "editorial.correct", entityType: "post", entityId: postId, metadata: JSON.stringify({ reason: input.reason.trim() }) });
  return (await db.select().from(posts).where(eq(posts.id, postId)).limit(1))[0];
}

export async function takedownEditorialPost(adminId: number, postId: number, reason: string, evidence?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const actor = await db.select({ role: users.role }).from(users).where(eq(users.id, adminId)).limit(1);
  if (!actor[0] || !["admin", "editor"].includes(actor[0].role)) throw new Error("Editor or admin access is required");
  const row = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!row[0]) throw new Error("Editorial post not found");
  if (!["article", "news"].includes(row[0].type)) throw new Error("Only articles or news can be taken down");
  if (row[0].status === "takedown") throw new Error("Editorial post is already taken down");
  if (!reason.trim()) throw new Error("Takedown reason is required");
  await db.insert(postTakedowns).values({ postId, adminId, reason: reason.trim(), evidence: evidence?.trim() || null });
  await db.update(posts).set({ status: "takedown", editorialNote: reason.trim(), reviewedBy: adminId, reviewedAt: new Date() }).where(eq(posts.id, postId));
  await db.insert(auditLogs).values({ userId: adminId, action: "editorial.takedown", entityType: "post", entityId: postId, metadata: JSON.stringify({ reason: reason.trim(), evidence: evidence?.trim() || null }) });
  await createNotification({ userId: row[0].authorId, type: "editorial", title: "Content taken down", body: reason.trim() });
  return (await db.select().from(posts).where(eq(posts.id, postId)).limit(1))[0];
}

export async function appealEditorialPost(userId: number, postId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const row = await db.select().from(posts).where(and(eq(posts.id, postId), eq(posts.authorId, userId))).limit(1);
  if (!row[0]) throw new Error("Editorial post not found");
  if (!["rejected", "takedown"].includes(row[0].status)) throw new Error("Only rejected or taken-down content can be appealed");
  if (!reason.trim()) throw new Error("Appeal reason is required");
  const existing = await db.select().from(postAppeals).where(and(eq(postAppeals.postId, postId), eq(postAppeals.appellantId, userId), eq(postAppeals.status, "pending"))).limit(1);
  if (existing[0]) return existing[0];
  const result = await db.insert(postAppeals).values({ postId, appellantId: userId, reason: reason.trim() });
  const appealId = Number(result[0]?.insertId);
  await db.insert(auditLogs).values({ userId, action: "editorial.appeal", entityType: "post", entityId: postId, metadata: JSON.stringify({ appealId, reason: reason.trim() }) });
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  await Promise.all(admins.map(admin => createNotification({ userId: admin.id, type: "editorial", title: "Editorial appeal submitted", body: `Post #${postId}: ${reason.trim()}` })));
  return (await db.select().from(postAppeals).where(eq(postAppeals.id, appealId)).limit(1))[0];
}

export async function listEditorialAppeals(status?: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return [];
  const whereClause = status ? eq(postAppeals.status, status) : undefined;
  return db.select({
    id: postAppeals.id, postId: postAppeals.postId, appellantId: postAppeals.appellantId, reason: postAppeals.reason,
    status: postAppeals.status, reviewedBy: postAppeals.reviewedBy, reviewedAt: postAppeals.reviewedAt,
    reviewNote: postAppeals.reviewNote, createdAt: postAppeals.createdAt, title: posts.title, type: posts.type,
    postStatus: posts.status, appellantName: users.name,
  }).from(postAppeals).leftJoin(posts, eq(posts.id, postAppeals.postId)).leftJoin(users, eq(users.id, postAppeals.appellantId))
    .where(whereClause).orderBy(desc(postAppeals.createdAt));
}

export async function reviewEditorialAppeal(adminId: number, appealId: number, decision: "approved" | "rejected", note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const row = await db.select().from(postAppeals).where(eq(postAppeals.id, appealId)).limit(1);
  if (!row[0]) throw new Error("Appeal not found");
  if (row[0].status !== "pending") throw new Error("Appeal is not pending");
  if (row[0].appellantId === adminId) throw new Error("Appeal reviewer must be independent from the appellant");
  const reviewer = await db.select({ role: users.role }).from(users).where(eq(users.id, adminId)).limit(1);
  if (!reviewer[0] || reviewer[0].role !== "admin") throw new Error("Admin access is required");
  const post = await db.select().from(posts).where(eq(posts.id, row[0].postId)).limit(1);
  if (!post[0]) throw new Error("Editorial post not found");
  await db.update(postAppeals).set({ status: decision, reviewedBy: adminId, reviewedAt: new Date(), reviewNote: note?.trim() || null }).where(eq(postAppeals.id, appealId));
  if (decision === "approved" && ["rejected", "takedown"].includes(post[0].status)) {
    await db.update(posts).set({ status: "published", publishedAt: post[0].publishedAt ?? new Date(), editorialNote: note?.trim() || null, reviewedBy: adminId, reviewedAt: new Date() }).where(eq(posts.id, post[0].id));
  }
  await db.insert(auditLogs).values({ userId: adminId, action: `editorial.appeal.${decision}`, entityType: "post", entityId: post[0].id, metadata: JSON.stringify({ appealId, note: note?.trim() || null }) });
  await createNotification({ userId: row[0].appellantId, type: "editorial", title: decision === "approved" ? "Appeal approved" : "Appeal rejected", body: note?.trim() || (decision === "approved" ? "Your appeal was approved and the content is restored." : "Your appeal was rejected.") });
  return (await db.select().from(postAppeals).where(eq(postAppeals.id, appealId)).limit(1))[0];
}

export async function reportPost(userId: number, postId: number, reason: string, details?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const post = await db.select({ id: posts.id, authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post[0]) throw new Error("Post not found");
  if (post[0].authorId === userId) throw new Error("You cannot report your own post");
  if (!reason.trim()) throw new Error("Report reason is required");
  const existing = await db.select().from(contentReports).where(and(eq(contentReports.reporterId, userId), eq(contentReports.postId, postId))).limit(1);
  if (existing[0]) return existing[0];
  const result = await db.insert(contentReports).values({ reporterId: userId, postId, reason: reason.trim().slice(0, 80), details: details?.trim() || null });
  const id = Number(result[0]?.insertId);
  await db.insert(auditLogs).values({ userId, action: "trust.report", entityType: "post", entityId: postId, metadata: JSON.stringify({ reportId: id, reason: reason.trim() }) });
  const existingCase = await db.select({ id: moderationCases.id }).from(moderationCases).where(and(eq(moderationCases.postId, postId), eq(moderationCases.reportId, id))).limit(1);
  if (!existingCase[0]) {
    const caseResult = await db.insert(moderationCases).values({ postId, reportId: id, openedBy: userId, priority: "normal", note: "Automatically opened from content report; admin review required." });
    const caseId = Number(caseResult[0]?.insertId);
    await db.insert(auditLogs).values({ userId, action: "moderation.case.auto_open", entityType: "moderation_case", entityId: caseId, metadata: JSON.stringify({ postId, reportId: id }) });
  }
  return (await db.select().from(contentReports).where(eq(contentReports.id, id)).limit(1))[0];
}

export async function toggleUserBlock(userId: number, targetUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (userId === targetUserId) throw new Error("Cannot block yourself");
  const target = await db.select({ id: users.id }).from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!target[0]) throw new Error("User not found");
  const existing = await db.select().from(userBlocks).where(and(eq(userBlocks.blockerId, userId), eq(userBlocks.blockedId, targetUserId))).limit(1);
  if (existing[0]) { await db.delete(userBlocks).where(eq(userBlocks.id, existing[0].id)); await db.insert(auditLogs).values({ userId, action: "trust.unblock", entityType: "user", entityId: targetUserId }); return { blocked: false }; }
  await db.insert(userBlocks).values({ blockerId: userId, blockedId: targetUserId });
  await db.insert(auditLogs).values({ userId, action: "trust.block", entityType: "user", entityId: targetUserId });
  return { blocked: true };
}

export async function toggleUserMute(userId: number, targetUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (userId === targetUserId) throw new Error("Cannot mute yourself");
  const target = await db.select({ id: users.id }).from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!target[0]) throw new Error("User not found");
  const existing = await db.select().from(userMutes).where(and(eq(userMutes.muterId, userId), eq(userMutes.mutedId, targetUserId))).limit(1);
  if (existing[0]) { await db.delete(userMutes).where(eq(userMutes.id, existing[0].id)); await db.insert(auditLogs).values({ userId, action: "trust.unmute", entityType: "user", entityId: targetUserId }); return { muted: false }; }
  await db.insert(userMutes).values({ muterId: userId, mutedId: targetUserId });
  await db.insert(auditLogs).values({ userId, action: "trust.mute", entityType: "user", entityId: targetUserId });
  return { muted: true };
}

export async function listBlockedUsers(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: users.id, name: users.name }).from(userBlocks).innerJoin(users, eq(userBlocks.blockedId, users.id)).where(eq(userBlocks.blockerId, userId)).orderBy(desc(userBlocks.createdAt));
}

export async function listMutedUsers(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: users.id, name: users.name }).from(userMutes).innerJoin(users, eq(userMutes.mutedId, users.id)).where(eq(userMutes.muterId, userId)).orderBy(desc(userMutes.createdAt));
}

export async function listAuditLogs(adminId: number, input?: { action?: string; entityType?: string; limit?: number }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const limit = Math.min(Math.max(input?.limit ?? 100, 1), 200);
  const filters = [input?.action ? eq(auditLogs.action, input.action) : undefined, input?.entityType ? eq(auditLogs.entityType, input.entityType) : undefined].filter(Boolean) as any[];
  const rows = await db.select().from(auditLogs).where(filters.length ? and(...filters) : undefined).orderBy(desc(auditLogs.createdAt)).limit(limit);
  return rows;
}

export async function listContentReports(adminId: number, status?: "pending" | "reviewed" | "dismissed") {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const whereClause = status ? eq(contentReports.status, status) : undefined;
  return db.select({ id: contentReports.id, postId: contentReports.postId, reporterId: contentReports.reporterId, reason: contentReports.reason, details: contentReports.details, status: contentReports.status, reviewedBy: contentReports.reviewedBy, reviewedAt: contentReports.reviewedAt, createdAt: contentReports.createdAt, title: posts.title, postBody: posts.body, authorId: posts.authorId }).from(contentReports).leftJoin(posts, eq(posts.id, contentReports.postId)).where(whereClause).orderBy(desc(contentReports.createdAt));
}

export async function reviewContentReport(adminId: number, reportId: number, decision: "reviewed" | "dismissed", note?: string) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const row = await db.select().from(contentReports).where(eq(contentReports.id, reportId)).limit(1);
  if (!row[0]) throw new Error("Report not found"); if (row[0].status !== "pending") throw new Error("Report is already reviewed");
  await db.update(contentReports).set({ status: decision, reviewedBy: adminId, reviewedAt: new Date() }).where(eq(contentReports.id, reportId));
  await db.insert(auditLogs).values({ userId: adminId, action: `trust.report.${decision}`, entityType: "report", entityId: reportId, metadata: JSON.stringify({ postId: row[0].postId, note: note?.trim() || null }) });
  return (await db.select().from(contentReports).where(eq(contentReports.id, reportId)).limit(1))[0];
}

export async function createModerationCase(adminId: number, input: { postId: number; reportId?: number; priority?: "low" | "normal" | "high" | "critical"; note?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, input.postId)).limit(1); if (!post[0]) throw new Error("Post not found");
  if (input.reportId) {
    const existing = await db.select({ id: moderationCases.id }).from(moderationCases).where(and(eq(moderationCases.reportId, input.reportId), inArray(moderationCases.status, ["open", "under_review"]))).limit(1);
    if (existing[0]) return (await db.select().from(moderationCases).where(eq(moderationCases.id, existing[0].id)).limit(1))[0];
  }
  const result = await db.insert(moderationCases).values({ postId: input.postId, reportId: input.reportId ?? null, openedBy: adminId, priority: input.priority ?? "normal", note: input.note?.trim() || null });
  const id = Number(result[0]?.insertId);
  await db.insert(auditLogs).values({ userId: adminId, action: "moderation.case.open", entityType: "moderation_case", entityId: id, metadata: JSON.stringify({ postId: input.postId, reportId: input.reportId ?? null, priority: input.priority ?? "normal" }) });
  return (await db.select().from(moderationCases).where(eq(moderationCases.id, id)).limit(1))[0];
}

export async function reviewModerationCase(adminId: number, caseId: number, decision: "resolved" | "dismissed", note?: string) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const row = await db.select().from(moderationCases).where(eq(moderationCases.id, caseId)).limit(1); if (!row[0]) throw new Error("Moderation case not found"); if (["resolved", "dismissed"].includes(row[0].status)) throw new Error("Moderation case is already closed");
  await db.update(moderationCases).set({ status: decision, decision, note: note?.trim() || row[0].note, reviewedBy: adminId, reviewedAt: new Date() }).where(eq(moderationCases.id, caseId));
  await db.insert(auditLogs).values({ userId: adminId, action: `moderation.case.${decision}`, entityType: "moderation_case", entityId: caseId, metadata: JSON.stringify({ postId: row[0].postId, note: note?.trim() || null }) });
  return (await db.select().from(moderationCases).where(eq(moderationCases.id, caseId)).limit(1))[0];
}

export async function listAdminReviewQueue(adminId: number) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const reports = await listContentReports(adminId, "pending");
  const cases = await db.select({ id: moderationCases.id, postId: moderationCases.postId, reportId: moderationCases.reportId, status: moderationCases.status, priority: moderationCases.priority, note: moderationCases.note, createdAt: moderationCases.createdAt, title: posts.title }).from(moderationCases).leftJoin(posts, eq(posts.id, moderationCases.postId)).where(inArray(moderationCases.status, ["open", "under_review"])).orderBy(desc(moderationCases.createdAt));
  const appeals = await listEditorialAppeals("pending");
  return { reports, cases, appeals };
}

export async function getPrivacySettings(userId: number) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(privacySettings).where(eq(privacySettings.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(privacySettings).values({ userId });
  return (await db.select().from(privacySettings).where(eq(privacySettings.userId, userId)).limit(1))[0];
}

export async function updatePrivacySettings(userId: number, input: { profileVisibility?: "public" | "connections" | "private"; discoverability?: "everyone" | "connections" | "nobody"; allowMessages?: "everyone" | "connections" | "nobody"; personalizedRecommendations?: boolean }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  await getPrivacySettings(userId);
  await db.update(privacySettings).set({ ...input, personalizedRecommendations: input.personalizedRecommendations === undefined ? undefined : input.personalizedRecommendations ? 1 : 0 }).where(eq(privacySettings.userId, userId));
  await db.insert(auditLogs).values({ userId, action: "privacy.settings.update", entityType: "user", entityId: userId, metadata: JSON.stringify(input) });
  return (await db.select().from(privacySettings).where(eq(privacySettings.userId, userId)).limit(1))[0];
}

export async function createOpportunity(input: { ownerId: number; title: string; description: string; sector: string; location?: string; value?: string; type: string; stage?: string; deadline?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(opportunities).values(input);
  const insertedId = Number(result[0]?.insertId);
  const saved = await db.select().from(opportunities).where(eq(opportunities.id, insertedId)).limit(1);
  if (!saved[0]) throw new Error("Opportunity could not be loaded after save");
  return saved[0];
}

export async function listOpportunitiesByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(opportunities).where(eq(opportunities.ownerId, ownerId)).orderBy(desc(opportunities.createdAt));
}

export async function updateOpportunity(ownerId: number, opportunityId: number, input: { title: string; description: string; sector: string; location?: string; value?: string; type: string; stage?: string; deadline?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(opportunities).where(and(eq(opportunities.id, opportunityId), eq(opportunities.ownerId, ownerId))).limit(1);
  if (!existing[0]) throw new Error("Opportunity not found or not owned by you");
  await db.update(opportunities).set(input).where(eq(opportunities.id, opportunityId));
  await db.insert(auditLogs).values({ userId: ownerId, action: "opportunity.updated", entityType: "opportunity", entityId: opportunityId, metadata: JSON.stringify({ fields: Object.keys(input) }) });
  const saved = await db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
  if (!saved[0]) throw new Error("Opportunity could not be loaded after update");
  return saved[0];
}

export async function updateCompany(ownerId: number, companyId: number, input: { name: string; description: string; industry: string; location: string; website?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(companies).where(and(eq(companies.id, companyId), eq(companies.ownerId, ownerId))).limit(1);
  if (!existing[0]) throw new Error("Company not found or not owned by you");
  await db.update(companies).set(input).where(eq(companies.id, companyId));
  await db.insert(auditLogs).values({ userId: ownerId, action: "company.updated", entityType: "company", entityId: companyId, metadata: JSON.stringify({ fields: Object.keys(input) }) });
  const saved = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!saved[0]) throw new Error("Company could not be loaded after update");
  return saved[0];
}

export async function markOpportunityInterest(userId: number, opportunityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const opportunity = await db.select({ id: opportunities.id, ownerId: opportunities.ownerId }).from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
  if (!opportunity[0]) throw new Error("Opportunity not found");
  if (opportunity[0].ownerId === userId) throw new Error("Cannot interest in your own opportunity");

  const existing = await db.select({ id: interests.id }).from(interests)
    .where(and(eq(interests.userId, userId), eq(interests.opportunityId, opportunityId))).limit(1);
  if (existing[0]) return { success: true, alreadyInterested: true } as const;

  try {
    await db.insert(interests).values({ userId, opportunityId });
  } catch (error) {
    // A concurrent request may win the unique constraint between the read and insert.
    if (error instanceof Error && /duplicate|unique/i.test(error.message)) {
      return { success: true, alreadyInterested: true } as const;
    }
    throw error;
  }
  await db.update(opportunities)
    .set({ interestedCount: sql`${opportunities.interestedCount} + 1` })
    .where(eq(opportunities.id, opportunityId));
  await db.insert(leads).values({ opportunityId, ownerId: opportunity[0].ownerId, prospectId: userId }).catch(error => {
    if (!(error instanceof Error && /duplicate|unique/i.test(error.message))) throw error;
  });
  await createNotification({ userId: opportunity[0].ownerId, type: "opportunity_interest", title: "New opportunity interest", body: "Someone expressed interest in your opportunity." });
  await db.insert(auditLogs).values({
    userId,
    action: "opportunity.interest.created",
    entityType: "opportunity",
    entityId: opportunityId,
    metadata: JSON.stringify({ source: "business.interest" }),
  });
  return { success: true, alreadyInterested: false } as const;
}

export async function getProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertProfile(userId: number, input: { headline: string; bio: string; location: string; industry: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(profiles).values({ userId, ...input }).onDuplicateKeyUpdate({
    set: input,
  });
  const saved = await getProfile(userId);
  if (!saved) throw new Error("Profile could not be loaded after save");
  return saved;
}

export async function listCompaniesByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(companies).where(eq(companies.ownerId, ownerId)).orderBy(desc(companies.createdAt));
}

export async function createCompany(input: { ownerId: number; name: string; description: string; industry: string; location: string; website?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(companies).values(input);
  const insertedId = Number(result[0]?.insertId);
  const saved = await db.select().from(companies).where(eq(companies.id, insertedId)).limit(1);
  if (!saved[0]) throw new Error("Company could not be loaded after save");
  return saved[0];
}

export async function getPostById(postId: number, authorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(posts).where(and(eq(posts.id, postId), eq(posts.authorId, authorId))).limit(1);
  return rows[0];
}


export async function getPostSocial(userId: number | null, postIds: number[]) {
  const db = await getDb();
  if (!db || postIds.length === 0) return {};

  const [likeCounts, commentCounts, saveCounts] = await Promise.all([
    db.select({ postId: postLikes.postId, count: count() }).from(postLikes).where(inArray(postLikes.postId, postIds)).groupBy(postLikes.postId),
    db.select({ postId: postComments.postId, count: count() }).from(postComments).where(inArray(postComments.postId, postIds)).groupBy(postComments.postId),
    db.select({ postId: postSaves.postId, count: count() }).from(postSaves).where(inArray(postSaves.postId, postIds)).groupBy(postSaves.postId),
  ]);

  const postAuthors = await db.select({ postId: posts.id, authorId: posts.authorId }).from(posts).where(inArray(posts.id, postIds));
  const authorIds = [...new Set(postAuthors.map(row => row.authorId))];
  const userLikes = userId === null ? [] : await db.select({ postId: postLikes.postId }).from(postLikes)
    .where(and(eq(postLikes.userId, userId), inArray(postLikes.postId, postIds)));
  const userSaves = userId === null ? [] : await db.select({ postId: postSaves.postId }).from(postSaves)
    .where(and(eq(postSaves.userId, userId), inArray(postSaves.postId, postIds)));
  const userFollows = userId === null || authorIds.length === 0 ? [] : await db.select({ followingId: follows.followingId }).from(follows)
    .where(and(eq(follows.followerId, userId), inArray(follows.followingId, authorIds)));

  const followedIds = new Set(userFollows.map(row => row.followingId));
  const authorByPost = new Map(postAuthors.map(row => [row.postId, row.authorId]));
  const result: Record<number, { likes: number; comments: number; saves: number; liked: boolean; saved: boolean; following: boolean }> = {};
  for (const postId of postIds) {
    result[postId] = { likes: 0, comments: 0, saves: 0, liked: false, saved: false, following: followedIds.has(authorByPost.get(postId) ?? -1) };
  }
  for (const row of likeCounts) result[row.postId].likes = Number(row.count);
  for (const row of commentCounts) result[row.postId].comments = Number(row.count);
  for (const row of saveCounts) result[row.postId].saves = Number(row.count);
  for (const row of userLikes) result[row.postId].liked = true;
  for (const row of userSaves) result[row.postId].saved = true;
  return result;
}

export async function listPostComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: postComments.id,
    postId: postComments.postId,
    userId: postComments.userId,
    body: postComments.body,
    createdAt: postComments.createdAt,
    authorName: users.name,
  }).from(postComments).leftJoin(users, eq(postComments.userId, users.id))
    .where(eq(postComments.postId, postId)).orderBy(desc(postComments.createdAt)).limit(50);
}

export async function createPostComment(userId: number, postId: number, body: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post[0]) throw new Error("Post not found");
  const author = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (author[0]?.authorId !== undefined && await isBlockedEitherDirection(db, userId, author[0].authorId)) throw new Error("Interaction unavailable because of block status");
  const result = await db.insert(postComments).values({ userId, postId, body });
  const insertedId = Number(result[0]?.insertId);
  const saved = await db.select({
    id: postComments.id, postId: postComments.postId, userId: postComments.userId,
    body: postComments.body, createdAt: postComments.createdAt, authorName: users.name,
  }).from(postComments).leftJoin(users, eq(postComments.userId, users.id))
    .where(eq(postComments.id, insertedId)).limit(1);
  if (!saved[0]) throw new Error("Comment could not be loaded after save");
  const author = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (author[0] && author[0].authorId !== userId) await createNotification({ userId: author[0].authorId, type: "comment", title: "New comment", body: body.slice(0, 180) });
  return saved[0];
}

export async function togglePostLike(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post[0]) throw new Error("Post not found");
  const author = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (author[0]?.authorId !== undefined && await isBlockedEitherDirection(db, userId, author[0].authorId)) throw new Error("Interaction unavailable because of block status");
  const existing = await db.select({ id: postLikes.id }).from(postLikes)
    .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId))).limit(1);
  let liked: boolean;
  if (existing[0]) {
    await db.delete(postLikes).where(eq(postLikes.id, existing[0].id));
    liked = false;
  } else {
    await db.insert(postLikes).values({ userId, postId });
    liked = true;
  }
  const [{ count: likeCount }] = await db.select({ count: count() }).from(postLikes).where(eq(postLikes.postId, postId));
  const author = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (liked && author[0] && author[0].authorId !== userId) await createNotification({ userId: author[0].authorId, type: "like", title: "New like", body: "Someone liked your post." });
  return { liked, likes: Number(likeCount) };
}

export async function togglePostSave(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post[0]) throw new Error("Post not found");
  const author = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (author[0]?.authorId !== undefined && await isBlockedEitherDirection(db, userId, author[0].authorId)) throw new Error("Interaction unavailable because of block status");
  const existing = await db.select({ id: postSaves.id }).from(postSaves)
    .where(and(eq(postSaves.userId, userId), eq(postSaves.postId, postId))).limit(1);
  let saved: boolean;
  if (existing[0]) {
    await db.delete(postSaves).where(eq(postSaves.id, existing[0].id));
    saved = false;
  } else {
    await db.insert(postSaves).values({ userId, postId });
    saved = true;
  }
  const [{ count: saveCount }] = await db.select({ count: count() }).from(postSaves).where(eq(postSaves.postId, postId));
  return { saved, saves: Number(saveCount) };
}

export async function toggleFollow(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (followerId === followingId) throw new Error("Cannot follow yourself");
  const target = await db.select({ id: users.id }).from(users).where(eq(users.id, followingId)).limit(1);
  if (!target[0]) throw new Error("User not found");
  if (await isBlockedEitherDirection(db, followerId, followingId)) throw new Error("Follow unavailable because of block status");
  if (!(await canDiscover(db, followerId, followingId))) throw new Error("This user is not discoverable");
  const existing = await db.select({ id: follows.id }).from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))).limit(1);
  if (existing[0]) {
    await db.delete(follows).where(eq(follows.id, existing[0].id));
    return { following: false };
  }
  await db.insert(follows).values({ followerId, followingId });
  await createNotification({ userId: followingId, type: "follow", title: "New follower", body: "Someone followed you." });
  return { following: true };
}

async function areConnected(db: Awaited<ReturnType<typeof getDb>>, userId: number, otherUserId: number) {
  if (!db) return false;
  const rows = await db.select({ followerId: follows.followerId, followingId: follows.followingId }).from(follows)
    .where(sql`(${follows.followerId} = ${userId} AND ${follows.followingId} = ${otherUserId}) OR (${follows.followerId} = ${otherUserId} AND ${follows.followingId} = ${userId})`);
  return rows.some(r => r.followerId === userId && r.followingId === otherUserId) && rows.some(r => r.followerId === otherUserId && r.followingId === userId);
}

async function isBlockedEitherDirection(db: Awaited<ReturnType<typeof getDb>>, userId: number, otherUserId: number) {
  if (!db) return false;
  const rows = await db.select({ id: userBlocks.id }).from(userBlocks).where(sql`(${userBlocks.blockerId} = ${userId} AND ${userBlocks.blockedId} = ${otherUserId}) OR (${userBlocks.blockerId} = ${otherUserId} AND ${userBlocks.blockedId} = ${userId})`).limit(1);
  return Boolean(rows[0]);
}

async function isMuted(db: Awaited<ReturnType<typeof getDb>>, userId: number, otherUserId: number) {
  if (!db) return false;
  const rows = await db.select({ id: userMutes.id }).from(userMutes).where(and(eq(userMutes.muterId, userId), eq(userMutes.mutedId, otherUserId))).limit(1);
  return Boolean(rows[0]);
}

async function canDiscover(db: Awaited<ReturnType<typeof getDb>>, viewerId: number, targetId: number) {
  if (!db || viewerId === targetId) return false;
  if (await isBlockedEitherDirection(db, viewerId, targetId)) return false;
  const settings = await db.select({ discoverability: privacySettings.discoverability }).from(privacySettings).where(eq(privacySettings.userId, targetId)).limit(1);
  const visibility = settings[0]?.discoverability ?? "everyone";
  if (visibility === "nobody") return false;
  if (visibility === "connections") return areConnected(db, viewerId, targetId);
  return true;
}

async function canMessage(db: Awaited<ReturnType<typeof getDb>>, senderId: number, recipientId: number) {
  if (!db || senderId === recipientId) return false;
  if (await isBlockedEitherDirection(db, senderId, recipientId)) return false;
  const settings = await db.select({ allowMessages: privacySettings.allowMessages }).from(privacySettings).where(eq(privacySettings.userId, recipientId)).limit(1);
  const policy = settings[0]?.allowMessages ?? "everyone";
  if (policy === "nobody") return false;
  if (policy === "connections") return areConnected(db, senderId, recipientId);
  return true;
}

export async function canUserDiscover(viewerId: number, targetId: number) {
  const db = await getDb();
  return Boolean(db && await canDiscover(db, viewerId, targetId));
}

export async function isPersonalizedRecommendationsEnabled(userId: number) {
  const db = await getDb();
  if (!db) return true;
  const settings = await db.select({ personalizedRecommendations: privacySettings.personalizedRecommendations }).from(privacySettings).where(eq(privacySettings.userId, userId)).limit(1);
  return settings[0]?.personalizedRecommendations !== 0;
}

export async function listPeople(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ id: users.id, name: users.name }).from(users)
    .where(sql`${users.id} <> ${userId}`).orderBy(desc(users.createdAt)).limit(100);
  const visible = [];
  for (const person of rows) {
    if (await canDiscover(db, userId, person.id)) visible.push(person);
    if (visible.length >= 50) break;
  }
  return visible;
}

export async function getDirectConversation(userId: number, otherUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (userId === otherUserId) throw new Error("Cannot message yourself");
  const target = await db.select({ id: users.id }).from(users).where(eq(users.id, otherUserId)).limit(1);
  if (!target[0]) throw new Error("User not found");
  if (!(await canMessage(db, userId, otherUserId))) throw new Error("Messaging is restricted by privacy settings or block status");
  const directKey = [userId, otherUserId].sort((a, b) => a - b).join(":");
  await db.insert(conversations).values({ directKey }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  const conversation = await db.select().from(conversations).where(eq(conversations.directKey, directKey)).limit(1);
  if (!conversation[0]) throw new Error("Conversation could not be created");
  await db.insert(conversationParticipants).values([
    { conversationId: conversation[0].id, userId },
    { conversationId: conversation[0].id, userId: otherUserId },
  ]).onDuplicateKeyUpdate({ set: { conversationId: conversation[0].id } });
  return conversation[0];
}

async function assertConversationMember(db: Awaited<ReturnType<typeof getDb>>, conversationId: number, userId: number) {
  if (!db) throw new Error("Database is not available");
  const member = await db.select({ id: conversationParticipants.id }).from(conversationParticipants)
    .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, userId))).limit(1);
  if (!member[0]) throw new Error("Conversation not found");
}

export async function listConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ conversation: conversations })
    .from(conversationParticipants)
    .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
    .where(eq(conversationParticipants.userId, userId))
    .orderBy(desc(conversations.updatedAt)).limit(50);
  return Promise.all(rows.map(async ({ conversation }) => {
    const participants = await db.select({ id: users.id, name: users.name })
      .from(conversationParticipants).innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(eq(conversationParticipants.conversationId, conversation.id));
    const last = await db.select({ id: messages.id, body: messages.body, senderId: messages.senderId, createdAt: messages.createdAt })
      .from(messages).where(eq(messages.conversationId, conversation.id)).orderBy(desc(messages.createdAt)).limit(1);
    return { ...conversation, participants, lastMessage: last[0] ?? null };
  }));
}

export async function listConversationMessages(userId: number, conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  await assertConversationMember(db, conversationId, userId);
  const rows = await db.select({ id: messages.id, conversationId: messages.conversationId, senderId: messages.senderId, senderName: users.name, body: messages.body, readAt: messages.readAt, createdAt: messages.createdAt })
    .from(messages).leftJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt).limit(100);
  await db.update(messages).set({ readAt: new Date() }).where(and(eq(messages.conversationId, conversationId), sql`${messages.senderId} <> ${userId}`, sql`${messages.readAt} IS NULL`));
  return rows;
}

export async function sendMessage(userId: number, conversationId: number, body: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await assertConversationMember(db, conversationId, userId);
  const participants = await db.select({ userId: conversationParticipants.userId }).from(conversationParticipants)
    .where(eq(conversationParticipants.conversationId, conversationId));
  const recipient = participants.find(row => row.userId !== userId)?.userId;
  if (!recipient) throw new Error("Recipient not found");
  if (!(await canMessage(db, userId, recipient))) throw new Error("Messaging is restricted by privacy settings or block status");
  const result = await db.insert(messages).values({ conversationId, senderId: userId, body });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
  await createNotification({ userId: recipient, type: "message", title: "New message", body: body.slice(0, 180) });
  const insertedId = Number(result[0]?.insertId);
  const saved = await db.select({ id: messages.id, conversationId: messages.conversationId, senderId: messages.senderId, senderName: users.name, body: messages.body, readAt: messages.readAt, createdAt: messages.createdAt })
    .from(messages).leftJoin(users, eq(messages.senderId, users.id)).where(eq(messages.id, insertedId)).limit(1);
  if (!saved[0]) throw new Error("Message could not be loaded after save");
  return saved[0];
}

export async function createNotification(input: { userId: number; type: string; title: string; body?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(notifications).values(input);
  const id = Number(result[0]?.insertId);
  const saved = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  if (!saved[0]) throw new Error("Notification could not be loaded after save");
  return saved[0];
}

export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function markNotificationRead(userId: number, notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.update(notifications).set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  return { success: true, updated: Number(result[0]?.affectedRows ?? 0) > 0 };
}


export async function listOpportunityLeads(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: leads.id, opportunityId: leads.opportunityId, ownerId: leads.ownerId, prospectId: leads.prospectId, status: leads.status, createdAt: leads.createdAt, updatedAt: leads.updatedAt, opportunityTitle: opportunities.title, prospectName: users.name, prospectEmail: users.email })
    .from(leads).innerJoin(opportunities, eq(leads.opportunityId, opportunities.id)).innerJoin(users, eq(leads.prospectId, users.id))
    .where(eq(leads.ownerId, ownerId)).orderBy(desc(leads.createdAt)).limit(100);
}

export async function updateLeadStatus(ownerId: number, leadId: number, status: "new" | "contacted" | "qualified" | "rejected" | "won" | "lost") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.ownerId, ownerId))).limit(1);
  if (!existing[0]) throw new Error("Lead not found or not owned by you");
  await db.update(leads).set({ status }).where(eq(leads.id, leadId));
  const saved = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!saved[0]) throw new Error("Lead could not be loaded after update");
  return saved[0];
}

export async function getOpportunityMatches(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const profile = await getProfile(userId);
  const rows = await db.select().from(opportunities).where(sql`${opportunities.ownerId} <> ${userId}`).orderBy(desc(opportunities.createdAt)).limit(100);
  const candidateOwners = [...new Set(rows.map(row => row.ownerId))];
  const accessibleOwners: number[] = [];
  for (const ownerId of candidateOwners) if (await canDiscover(db, userId, ownerId) && !(await isMuted(db, userId, ownerId))) accessibleOwners.push(ownerId);
  const accessibleRows = rows.filter(row => accessibleOwners.includes(row.ownerId));
  const now = Date.now();
  const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase();
  const industry = normalize(profile?.industry), location = normalize(profile?.location), headline = normalize(profile?.headline), bio = normalize(profile?.bio);
  return accessibleRows.map(opportunity => {
    const sector = normalize(opportunity.sector), opLocation = normalize(opportunity.location);
    let score = 0; const reasons: string[] = [];
    if (industry && sector && (sector.includes(industry) || industry.includes(sector))) { score += 55; reasons.push("Industry matches your profile"); }
    if (location && opLocation && (opLocation.includes(location) || location.includes(opLocation))) { score += 20; reasons.push("Location matches"); }
    if (headline && sector && headline.includes(sector)) { score += 10; reasons.push("Relevant to your headline"); }
    if (bio && sector && bio.includes(sector)) { score += 10; reasons.push("Relevant to your profile"); }
    if (opportunity.verificationStatus === "verified") { score += 5; reasons.push("Verified opportunity"); }
    if (opportunity.deadline && opportunity.deadline.getTime() >= now) score += 5;
    return { opportunity, score: Math.min(score, 100), reasons };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || b.opportunity.createdAt.getTime() - a.opportunity.createdAt.getTime()).slice(0, 20);
}

export async function requestVerification(requesterId: number, entityType: "company" | "opportunity", entityId: number, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (entityType === "company") {
    const entity = await db.select({ id: companies.id, ownerId: companies.ownerId, verified: companies.verified }).from(companies).where(eq(companies.id, entityId)).limit(1);
    if (!entity[0]) throw new Error("Company not found");
    if (entity[0].ownerId !== requesterId) throw new Error("Not authorized");
    if (entity[0].verified) throw new Error("Company is already verified");
  } else {
    const entity = await db.select({ id: opportunities.id, ownerId: opportunities.ownerId, verificationStatus: opportunities.verificationStatus }).from(opportunities).where(eq(opportunities.id, entityId)).limit(1);
    if (!entity[0]) throw new Error("Opportunity not found");
    if (entity[0].ownerId !== requesterId) throw new Error("Not authorized");
    if (entity[0].verificationStatus === "verified") throw new Error("Opportunity is already verified");
  }
  const pending = await db.select().from(verificationRequests).where(and(eq(verificationRequests.entityType, entityType), eq(verificationRequests.entityId, entityId), eq(verificationRequests.status, "pending"))).limit(1);
  if (pending[0]) return pending[0];
  const result = await db.insert(verificationRequests).values({ entityType, entityId, requesterId, note });
  const id = Number(result[0]?.insertId);
  if (entityType === "opportunity") await db.update(opportunities).set({ verificationStatus: "review" }).where(eq(opportunities.id, entityId));
  await db.insert(auditLogs).values({ userId: requesterId, action: "verification.requested", entityType, entityId, metadata: JSON.stringify({ requestId: id }) });
  const saved = await db.select().from(verificationRequests).where(eq(verificationRequests.id, id)).limit(1);
  if (!saved[0]) throw new Error("Verification request could not be loaded after save");
  return saved[0];
}

export async function listVerificationRequests(requesterId: number, admin: boolean) {
  const db = await getDb();
  if (!db) return [];
  if (admin) return db.select().from(verificationRequests).orderBy(desc(verificationRequests.createdAt)).limit(100);
  return db.select().from(verificationRequests).where(eq(verificationRequests.requesterId, requesterId)).orderBy(desc(verificationRequests.createdAt)).limit(50);
}

export async function reviewVerification(adminId: number, requestId: number, decision: "approved" | "rejected", note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const request = await db.select().from(verificationRequests).where(eq(verificationRequests.id, requestId)).limit(1);
  if (!request[0]) throw new Error("Verification request not found");
  if (request[0].status !== "pending") throw new Error("Verification request is already decided");
  await db.update(verificationRequests).set({ status: decision, note: note ?? request[0].note, reviewedBy: adminId, reviewedAt: new Date() }).where(eq(verificationRequests.id, requestId));
  if (request[0].entityType === "company") await db.update(companies).set({ verified: decision === "approved" ? 1 : 0 }).where(eq(companies.id, request[0].entityId));
  else await db.update(opportunities).set({ verificationStatus: decision === "approved" ? "verified" : "unverified" }).where(eq(opportunities.id, request[0].entityId));
  await db.insert(auditLogs).values({ userId: adminId, action: `verification.${decision}`, entityType: request[0].entityType, entityId: request[0].entityId, metadata: JSON.stringify({ requestId }) });
  await createNotification({ userId: request[0].requesterId, type: "verification", title: decision === "approved" ? "Verification approved" : "Verification rejected", body: note || (decision === "approved" ? "Your verification request was approved." : "Your verification request was rejected.") });
  const saved = await db.select().from(verificationRequests).where(eq(verificationRequests.id, requestId)).limit(1);
  if (!saved[0]) throw new Error("Verification request could not be loaded after review");
  return saved[0];
}

export async function uploadMedia(input: {
  ownerId: number;
  kind: "image" | "video";
  originalName: string;
  mimeType: string;
  data: Buffer;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];
  const allowed = input.kind === "image" ? imageTypes : videoTypes;
  if (!allowed.includes(input.mimeType)) throw new Error("Unsupported media format");
  const maxBytes = input.kind === "image" ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
  if (input.data.byteLength > maxBytes) throw new Error(`Media exceeds ${input.kind === "image" ? 10 : 20}MB limit`);
  const ext = input.originalName.includes(".") ? input.originalName.slice(input.originalName.lastIndexOf(".")) : input.kind === "image" ? ".jpg" : ".mp4";
  const { storagePut } = await import("./storage");
  const uploaded = await storagePut(`businessnotes/media/${input.ownerId}/${Date.now()}${ext}`, input.data, input.mimeType);
  const result = await db.insert(mediaAssets).values({
    ownerId: input.ownerId, kind: input.kind, status: input.kind === "video" ? "processing" : "ready",
    originalName: input.originalName.slice(0, 255), mimeType: input.mimeType, sizeBytes: input.data.byteLength,
    storageKey: uploaded.key, url: uploaded.url,
  });
  const id = Number(result[0]?.insertId);
  await db.insert(mediaModeration).values({ mediaId: id, status: "pending" });
  await db.insert(auditLogs).values({ userId: input.ownerId, action: "media.upload", entityType: "media", entityId: id, metadata: JSON.stringify({ kind: input.kind, mimeType: input.mimeType, sizeBytes: input.data.byteLength, moderationStatus: "pending" }) });
  return (await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1))[0];
}

export async function processVideoMedia(userId: number, mediaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const row = (await db.select().from(mediaAssets).where(eq(mediaAssets.id, mediaId)).limit(1))[0];
  if (!row) throw new Error("Media not found");
  if (row.ownerId !== userId && !["admin", "editor"].includes((await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1))[0]?.role ?? "")) throw new Error("Not authorized");
  if (row.kind !== "video") throw new Error("Only video media can be processed");
  if (row.status === "ready") return row;
  const { storageGetSignedUrl, storagePut } = await import("./storage");
  const os = await import("os"); const fs = await import("fs/promises"); const path = await import("path"); const cp = await import("child_process"); const util = await import("util");
  const execFile = util.promisify(cp.execFile);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "bn-video-"));
  const inputPath = path.join(dir, "input"); const thumbPath = path.join(dir, "thumb.jpg");
  try {
    await db.update(mediaAssets).set({ status: "processing", processingError: null }).where(eq(mediaAssets.id, mediaId));
    const signed = await storageGetSignedUrl(row.storageKey);
    const resp = await fetch(signed);
    if (!resp.ok) throw new Error(`Unable to fetch uploaded video (${resp.status})`);
    await fs.writeFile(inputPath, Buffer.from(await resp.arrayBuffer()));
    const probe = await execFile("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=width,height", "-of", "json", inputPath]);
    const metadata = JSON.parse(probe.stdout || "{}");
    const stream = (metadata.streams || []).find((s: any) => s.width || s.height) || {};
    const durationMs = Math.round(Number(metadata.format?.duration || 0) * 1000);
    await execFile("ffmpeg", ["-y", "-ss", "0", "-i", inputPath, "-frames:v", "1", "-q:v", "3", thumbPath]);
    const thumb = await storagePut(`businessnotes/media/${row.ownerId}/${mediaId}-thumb.jpg`, await fs.readFile(thumbPath), "image/jpeg");
    await db.update(mediaAssets).set({ status: "ready", thumbnailUrl: thumb.url, durationMs: durationMs || null, width: Number(stream.width) || null, height: Number(stream.height) || null, processingError: null }).where(eq(mediaAssets.id, mediaId));
    await db.insert(auditLogs).values({ userId, action: "media.process", entityType: "media", entityId: mediaId, metadata: JSON.stringify({ durationMs, width: stream.width, height: stream.height, thumbnailUrl: thumb.url }) });
    return (await db.select().from(mediaAssets).where(eq(mediaAssets.id, mediaId)).limit(1))[0];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video processing failed";
    await db.update(mediaAssets).set({ status: "failed", processingError: message.slice(0, 4000) }).where(eq(mediaAssets.id, mediaId));
    throw new Error(message);
  } finally { await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined); }
}

export async function upsertMediaCaption(userId: number, input: { mediaId: number; language: string; format: "vtt" | "srt" | "text"; content: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  if (!input.language.trim() || !input.content.trim()) throw new Error("Caption language and content are required");
  if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/.test(input.language.trim())) throw new Error("Caption language must use a valid BCP-47-like tag");
  if (input.format === "vtt" && !/^WEBVTT(?:\r?\n|$)/i.test(input.content.trim())) throw new Error("WebVTT captions must start with WEBVTT");
  if (input.format === "srt" && !/^\s*\d+\s*\r?\n\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}\s+-->\s+/.test(input.content.trim())) throw new Error("Invalid SRT caption format");
  const media = (await db.select().from(mediaAssets).where(eq(mediaAssets.id, input.mediaId)).limit(1))[0];
  if (!media) throw new Error("Media not found");
  if (media.ownerId !== userId) throw new Error("Not authorized");
  if (media.kind !== "video") throw new Error("Captions are only available for video");
  const existing = (await db.select().from(mediaCaptions).where(and(eq(mediaCaptions.mediaId, input.mediaId), eq(mediaCaptions.language, input.language.trim()))).limit(1))[0];
  if (existing) {
    await db.update(mediaCaptions).set({ format: input.format, content: input.content.trim() }).where(eq(mediaCaptions.id, existing.id));
    await db.insert(auditLogs).values({ userId, action: "media.caption.update", entityType: "media", entityId: input.mediaId, metadata: JSON.stringify({ language: input.language, format: input.format }) });
    return (await db.select().from(mediaCaptions).where(eq(mediaCaptions.id, existing.id)).limit(1))[0];
  }
  const result = await db.insert(mediaCaptions).values({ mediaId: input.mediaId, language: input.language.trim(), format: input.format, content: input.content.trim(), createdBy: userId });
  const id = Number(result[0]?.insertId);
  await db.insert(auditLogs).values({ userId, action: "media.caption.create", entityType: "media", entityId: input.mediaId, metadata: JSON.stringify({ captionId: id, language: input.language, format: input.format }) });
  return (await db.select().from(mediaCaptions).where(eq(mediaCaptions.id, id)).limit(1))[0];
}

export async function listPublicMediaCaptions(mediaId: number) {
  const db = await getDb(); if (!db) return [];
  const media = (await db.select().from(mediaAssets).where(eq(mediaAssets.id, mediaId)).limit(1))[0];
  if (!media) throw new Error("Media not found");
  const moderation = (await db.select().from(mediaModeration).where(eq(mediaModeration.mediaId, mediaId)).limit(1))[0];
  if (moderation?.status !== "approved") return [];
  return db.select({ id: mediaCaptions.id, language: mediaCaptions.language, format: mediaCaptions.format, content: mediaCaptions.content })
    .from(mediaCaptions).where(eq(mediaCaptions.mediaId, mediaId)).orderBy(mediaCaptions.language);
}

export async function listMediaCaptions(userId: number, mediaId: number) {
  const db = await getDb(); if (!db) return [];
  const media = (await db.select().from(mediaAssets).where(eq(mediaAssets.id, mediaId)).limit(1))[0];
  if (!media || (media.ownerId !== userId)) throw new Error("Not authorized");
  return db.select().from(mediaCaptions).where(eq(mediaCaptions.mediaId, mediaId)).orderBy(desc(mediaCaptions.createdAt));
}

export async function listMediaModerationQueue(userId: number) {
  const db = await getDb(); if (!db) return [];
  const user = (await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1))[0];
  if (user?.role !== "admin" && user?.role !== "editor") throw new Error("Editor access required");
  const rows = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(100);
  const mods = await db.select().from(mediaModeration);
  return rows.map(row => ({ ...row, moderationStatus: mods.find(mod => mod.mediaId === row.id)?.status ?? "pending", moderationNote: mods.find(mod => mod.mediaId === row.id)?.note ?? null })).filter(row => row.moderationStatus === "pending");
}

export async function reviewMediaModeration(userId: number, mediaId: number, decision: "approved" | "rejected", note?: string) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const user = (await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1))[0];
  if (user?.role !== "admin" && user?.role !== "editor") throw new Error("Editor access required");
  const media = (await db.select().from(mediaAssets).where(eq(mediaAssets.id, mediaId)).limit(1))[0];
  if (!media) throw new Error("Media not found");
  const existing = (await db.select().from(mediaModeration).where(eq(mediaModeration.mediaId, mediaId)).limit(1))[0];
  if (existing && existing.status !== "pending") throw new Error("Media moderation is already decided");
  if (existing) await db.update(mediaModeration).set({ status: decision, reviewedBy: userId, reviewedAt: new Date(), note: note?.trim() || null }).where(eq(mediaModeration.id, existing.id));
  else await db.insert(mediaModeration).values({ mediaId, status: decision, reviewedBy: userId, reviewedAt: new Date(), note: note?.trim() || null });
  await db.insert(auditLogs).values({ userId, action: "media.moderation.review", entityType: "media", entityId: mediaId, metadata: JSON.stringify({ decision, note: note?.trim() || null }) });
  if (media.ownerId !== userId) await db.insert(notifications).values({ userId: media.ownerId, type: "media.moderation", title: decision === "approved" ? "Media approved" : "Media rejected", body: note?.trim() || `Your ${media.kind} was ${decision}.`, entityType: "media", entityId: mediaId });
  return (await db.select().from(mediaModeration).where(eq(mediaModeration.mediaId, mediaId)).limit(1))[0];
}

export async function attachMediaToPost(userId: number, mediaId: number, postId: number) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const media = (await db.select().from(mediaAssets).where(eq(mediaAssets.id, mediaId)).limit(1))[0];
  if (!media) throw new Error("Media not found");
  if (media.ownerId !== userId) throw new Error("Not authorized");
  const post = (await db.select().from(posts).where(eq(posts.id, postId)).limit(1))[0];
  if (!post) throw new Error("Post not found");
  if (post.authorId !== userId) throw new Error("Not authorized");
  const moderation = (await db.select().from(mediaModeration).where(eq(mediaModeration.mediaId, mediaId)).limit(1))[0];
  if (moderation?.status !== "approved") throw new Error("Media must be approved by moderation before attachment");
  if (media.kind === "video" && media.status !== "ready") throw new Error("Video must finish processing first");
  await db.update(mediaAssets).set({ postId }).where(eq(mediaAssets.id, mediaId));
  await db.insert(auditLogs).values({ userId, action: "media.attach", entityType: "media", entityId: mediaId, metadata: JSON.stringify({ postId }) });
  return (await db.select().from(mediaAssets).where(eq(mediaAssets.id, mediaId)).limit(1))[0];
}

export async function listMyMedia(userId: number) {
  const db = await getDb(); if (!db) return [];
  const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.ownerId, userId)).orderBy(desc(mediaAssets.createdAt)).limit(50);
  const mods = await db.select().from(mediaModeration);
  return rows.map(row => ({ ...row, moderationStatus: mods.find(mod => mod.mediaId === row.id)?.status ?? "pending", moderationNote: mods.find(mod => mod.mediaId === row.id)?.note ?? null }));
}
