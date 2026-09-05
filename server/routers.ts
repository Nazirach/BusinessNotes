import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createBusinessPost, createCompany, createOpportunity, createPostComment, getPostSocial, getProfile, listBusinessData, listCompaniesByOwner, listPostComments, listOpportunitiesByOwner, updateCompany, updateOpportunity, markOpportunityInterest, togglePostLike, togglePostSave, upsertProfile, toggleFollow, listPeople, getDirectConversation, listConversations, listConversationMessages, sendMessage, listNotifications, markNotificationRead, listOpportunityLeads, updateLeadStatus, getOpportunityMatches, requestVerification, listVerificationRequests, reviewVerification, listPublishedNews, getPublicEditorialById, listEditorialPostsByAuthor, listEditorialQueue, listEditorialCorrectionHistory, addPostEvidence, updateEditorialDraft, submitEditorialPost, reviewEditorialPost, correctEditorialPost, takedownEditorialPost, appealEditorialPost, addPostSource, listPostSources, verifyPostSource, requestReporterStatus, listReporterRequests, reviewReporterStatus, setEditorRole, listEditorialAppeals, reviewEditorialAppeal, uploadMedia, processVideoMedia, listMyMedia, upsertMediaCaption, listMediaCaptions, listPublicMediaCaptions, reviewMediaModeration, listMediaModerationQueue, attachMediaToPost, reportPost, toggleUserBlock, toggleUserMute, listAuditLogs, listBlockedUsers, listMutedUsers, listContentReports, reviewContentReport, createModerationCase, reviewModerationCase, listAdminReviewQueue, getPrivacySettings, updatePrivacySettings } from "./db";
import { assertRateLimit } from "./rateLimit";
import { generateBusinessContent, generateSourceGroundedAI, intelligentBusinessSearch, recommendBusinessOpportunities, matchBusinessPartners } from "./ai";

const postInput = z.object({
  type: z.enum(["post", "article", "insight", "news", "video"]).default("post"),
  title: z.string().trim().max(220).optional(),
  body: z.string().trim().min(1).max(10000),
  source: z.string().url().max(255).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user ?? null),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  business: router({
    list: publicProcedure.query(({ ctx }) => listBusinessData(ctx.user?.id)),
    news: publicProcedure.query(() => listPublishedNews()),
    publicEditorial: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => getPublicEditorialById(input.id)),
    aiGenerate: protectedProcedure.input(z.object({ prompt: z.string().trim().min(2).max(8000), format: z.enum(["post", "article", "headline", "summary", "video-script"]).optional() })).mutation(async ({ ctx, input }) => {
      try { assertRateLimit(`ai-generate:${ctx.user.id}`); return await generateBusinessContent(ctx.user.id, input); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message.includes("Too many") ? "TOO_MANY_REQUESTS" : "BAD_REQUEST", message: error instanceof Error ? error.message : "AI generation failed" }); }
    }),
    aiGrounded: protectedProcedure.input(z.object({ postId: z.number().int().positive(), question: z.string().trim().min(2).max(2000) })).mutation(async ({ ctx, input }) => {
      try { assertRateLimit(`ai-grounded:${ctx.user.id}`); return await generateSourceGroundedAI(ctx.user.id, input); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message.includes("Too many") ? "TOO_MANY_REQUESTS" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Source-grounded AI failed" }); }
    }),
    aiSearch: publicProcedure.input(z.object({ query: z.string().trim().min(2).max(180), limit: z.number().int().min(1).max(30).optional() })).query(async ({ input }) => intelligentBusinessSearch(input)),
    aiRecommend: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(20).optional() })).query(async ({ ctx, input }) => recommendBusinessOpportunities(ctx.user.id, input.limit)),
    aiMatch: protectedProcedure.input(z.object({ opportunityId: z.number().int().positive().optional(), query: z.string().trim().min(2).max(500).optional(), limit: z.number().int().min(1).max(20).optional() }).refine(v => v.opportunityId || v.query, "opportunityId or query is required")).query(async ({ ctx, input }) => matchBusinessPartners(ctx.user.id, input)),

    media: protectedProcedure.query(({ ctx }) => listMyMedia(ctx.user.id)),
    uploadMedia: protectedProcedure.input(z.object({
      kind: z.enum(["image", "video"]), originalName: z.string().trim().min(1).max(255), mimeType: z.string().trim().min(3).max(120), dataBase64: z.string().min(1).max(30000000),
    })).mutation(async ({ ctx, input }) => {
      try {
        const raw = input.dataBase64.includes(",") ? input.dataBase64.slice(input.dataBase64.indexOf(",") + 1) : input.dataBase64;
        const data = Buffer.from(raw, "base64");
        return await uploadMedia({ ownerId: ctx.user.id, kind: input.kind, originalName: input.originalName, mimeType: input.mimeType, data });
      } catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to upload media" }); }
    }),
    processVideo: protectedProcedure.input(z.object({ mediaId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { return await processVideoMedia(ctx.user.id, input.mediaId); }
      catch (error) { if (error instanceof Error && error.message === "Media not found") throw new TRPCError({ code: "NOT_FOUND", message: error.message }); if (error instanceof Error && error.message === "Not authorized") throw new TRPCError({ code: "FORBIDDEN", message: error.message }); throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to process video" }); }
    }),
    publicCaptions: publicProcedure.input(z.object({ mediaId: z.number().int().positive() })).query(async ({ input }) => { try { return await listPublicMediaCaptions(input.mediaId); } catch (error) { throw new TRPCError({ code: "NOT_FOUND", message: error instanceof Error ? error.message : "Media not found" }); } }),
    captions: protectedProcedure.input(z.object({ mediaId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      try { return await listMediaCaptions(ctx.user.id, input.mediaId); } catch (error) { throw new TRPCError({ code: "FORBIDDEN", message: error instanceof Error ? error.message : "Unable to list captions" }); }
    }),
    saveCaption: protectedProcedure.input(z.object({ mediaId: z.number().int().positive(), language: z.string().trim().min(2).max(16), format: z.enum(["vtt", "srt", "text"]), content: z.string().trim().min(1).max(500000) })).mutation(async ({ ctx, input }) => {
      try { return await upsertMediaCaption(ctx.user.id, input); } catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Not authorized" ? "FORBIDDEN" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to save caption" }); }
    }),
    moderationQueue: protectedProcedure.query(async ({ ctx }) => {
      try { return await listMediaModerationQueue(ctx.user.id); } catch (error) { throw new TRPCError({ code: "FORBIDDEN", message: error instanceof Error ? error.message : "Unable to load moderation queue" }); }
    }),
    moderateMedia: protectedProcedure.input(z.object({ mediaId: z.number().int().positive(), decision: z.enum(["approved", "rejected"]), note: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      try { return await reviewMediaModeration(ctx.user.id, input.mediaId, input.decision, input.note); } catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Editor access required" ? "FORBIDDEN" : error instanceof Error && error.message === "Media not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to moderate media" }); }
    }),
    attachMedia: protectedProcedure.input(z.object({ mediaId: z.number().int().positive(), postId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { return await attachMediaToPost(ctx.user.id, input.mediaId, input.postId); } catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Not authorized" ? "FORBIDDEN" : error instanceof Error && error.message === "Media not found" || error instanceof Error && error.message === "Post not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to attach media" }); }
    }),
    sources: publicProcedure.input(z.object({ postId: z.number().int().positive() })).query(({ input }) => listPostSources(input.postId)),
    editorialQueue: protectedProcedure.input(z.object({ status: z.enum(["draft", "review", "published", "rejected", "takedown"]).optional() }).optional()).query(({ ctx, input }) => {
      if (!["admin", "editor"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Editor access required" });
      return listEditorialQueue(input?.status);
    }),
    correctionHistory: protectedProcedure.input(z.object({ postId: z.number().int().positive() })).query(({ ctx, input }) => listEditorialCorrectionHistory(ctx.user.id, input.postId, ["admin", "editor"].includes(ctx.user.role))),

    myEditorial: protectedProcedure.query(({ ctx }) => listEditorialPostsByAuthor(ctx.user.id, ["admin", "editor"].includes(ctx.user.role))),
    profile: protectedProcedure.query(({ ctx }) => getProfile(ctx.user.id)),
    social: publicProcedure.input(z.object({ postIds: z.array(z.number().int().positive()).max(50) })).query(({ ctx, input }) => getPostSocial(ctx.user?.id ?? null, input.postIds)),
    comments: publicProcedure.input(z.object({ postId: z.number().int().positive() })).query(({ input }) => listPostComments(input.postId)),
    blockedUsers: protectedProcedure.query(({ ctx }) => listBlockedUsers(ctx.user.id)),
    mutedUsers: protectedProcedure.query(({ ctx }) => listMutedUsers(ctx.user.id)),
    auditLogs: protectedProcedure.input(z.object({ action: z.string().trim().max(80).optional(), entityType: z.string().trim().max(80).optional(), limit: z.number().int().min(1).max(200).optional() }).optional()).query(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return listAuditLogs(ctx.user.id, input);
    }),
    reports: protectedProcedure.input(z.object({ status: z.enum(["pending", "reviewed", "dismissed"]).optional() }).optional()).query(({ ctx, input }) => {
      if (!["admin", "editor"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Moderator access required" });
      return listContentReports(ctx.user.id, input?.status);
    }),
    reviewReport: protectedProcedure.input(z.object({ reportId: z.number().int().positive(), decision: z.enum(["reviewed", "dismissed"]), note: z.string().trim().max(2000).optional() })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return reviewContentReport(ctx.user.id, input.reportId, input.decision, input.note);
    }),
    createModerationCase: protectedProcedure.input(z.object({ postId: z.number().int().positive(), reportId: z.number().int().positive().optional(), priority: z.enum(["low", "normal", "high", "critical"]).optional(), note: z.string().trim().max(2000).optional() })).mutation(({ ctx, input }) => {
      if (!["admin", "editor"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Moderator access required" });
      return createModerationCase(ctx.user.id, input);
    }),
    reviewModerationCase: protectedProcedure.input(z.object({ caseId: z.number().int().positive(), decision: z.enum(["resolved", "dismissed"]), note: z.string().trim().max(2000).optional() })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return reviewModerationCase(ctx.user.id, input.caseId, input.decision, input.note);
    }),
    adminReviewQueue: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return listAdminReviewQueue(ctx.user.id);
    }),
    privacySettings: protectedProcedure.query(({ ctx }) => getPrivacySettings(ctx.user.id)),
    updatePrivacySettings: protectedProcedure.input(z.object({ profileVisibility: z.enum(["public", "connections", "private"]).optional(), discoverability: z.enum(["everyone", "connections", "nobody"]).optional(), allowMessages: z.enum(["everyone", "connections", "nobody"]).optional(), personalizedRecommendations: z.boolean().optional() })).mutation(({ ctx, input }) => updatePrivacySettings(ctx.user.id, input)),
    reportPost: protectedProcedure.input(z.object({ postId: z.number().int().positive(), reason: z.string().trim().min(2).max(80), details: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      try { assertRateLimit(`report:${ctx.user.id}`); return await reportPost(ctx.user.id, input.postId, input.reason, input.details); }
      catch (error) { const message = error instanceof Error ? error.message : "Unable to report post"; throw new TRPCError({ code: message === "Post not found" ? "NOT_FOUND" : message === "Rate limit exceeded" ? "TOO_MANY_REQUESTS" : "BAD_REQUEST", message }); }
    }),
    blockUser: protectedProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { return await toggleUserBlock(ctx.user.id, input.userId); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "User not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to update block" }); }
    }),
    muteUser: protectedProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { return await toggleUserMute(ctx.user.id, input.userId); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "User not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to update mute" }); }
    }),
    comment: protectedProcedure.input(z.object({ postId: z.number().int().positive(), body: z.string().trim().min(1).max(2000) })).mutation(async ({ ctx, input }) => {
      try { assertRateLimit(`comment:${ctx.user.id}`); } catch { throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many comments; try again shortly" }); }
      try { return await createPostComment(ctx.user.id, input.postId, input.body); } catch (error) {
        if (error instanceof Error && error.message === "Post not found") throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        throw error;
      }
    }),
    like: protectedProcedure.input(z.object({ postId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { assertRateLimit(`like:${ctx.user.id}`); } catch { throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many like actions; try again shortly" }); }
      try { return await togglePostLike(ctx.user.id, input.postId); } catch (error) {
        if (error instanceof Error && error.message === "Post not found") throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        throw error;
      }
    }),
    save: protectedProcedure.input(z.object({ postId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { assertRateLimit(`save:${ctx.user.id}`); } catch { throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many save actions; try again shortly" }); }
      try { return await togglePostSave(ctx.user.id, input.postId); } catch (error) {
        if (error instanceof Error && error.message === "Post not found") throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        throw error;
      }
    }),
    follow: protectedProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { assertRateLimit(`follow:${ctx.user.id}`); } catch { throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many follow actions; try again shortly" }); }
      try { return await toggleFollow(ctx.user.id, input.userId); } catch (error) {
        if (error instanceof Error && error.message === "User not found") throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        if (error instanceof Error && error.message === "Cannot follow yourself") throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        throw error;
      }
    }),
    people: protectedProcedure.query(({ ctx }) => listPeople(ctx.user.id)),
    conversations: protectedProcedure.query(({ ctx }) => listConversations(ctx.user.id)),
    startConversation: protectedProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { return await getDirectConversation(ctx.user.id, input.userId); } catch (error) {
        if (error instanceof Error && error.message === "User not found") throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        if (error instanceof Error && error.message === "Cannot message yourself") throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        throw error;
      }
    }),
    conversationMessages: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).query(({ ctx, input }) => listConversationMessages(ctx.user.id, input.conversationId)),
    sendMessage: protectedProcedure.input(z.object({ conversationId: z.number().int().positive(), body: z.string().trim().min(1).max(5000) })).mutation(async ({ ctx, input }) => {
      try { assertRateLimit(`message:${ctx.user.id}`); } catch { throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many messages; try again shortly" }); }
      try { return await sendMessage(ctx.user.id, input.conversationId, input.body); } catch (error) {
        if (error instanceof Error && error.message === "Conversation not found") throw new TRPCError({ code: "FORBIDDEN", message: "Conversation not found" });
        throw error;
      }
    }),
    notifications: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
    markNotificationRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(({ ctx, input }) => markNotificationRead(ctx.user.id, input.notificationId)),
    updateProfile: protectedProcedure.input(z.object({
      headline: z.string().trim().max(180),
      bio: z.string().trim().max(5000),
      location: z.string().trim().max(120),
      industry: z.string().trim().max(120),
    })).mutation(({ ctx, input }) => upsertProfile(ctx.user.id, input)),
    companies: protectedProcedure.query(({ ctx }) => listCompaniesByOwner(ctx.user.id)),
    createCompany: protectedProcedure.input(z.object({
      name: z.string().trim().min(2).max(180),
      description: z.string().trim().min(1).max(10000),
      industry: z.string().trim().min(2).max(120),
      location: z.string().trim().min(1).max(120),
      website: z.union([z.string().trim().url().max(255), z.literal("")]).optional().transform(value => value || undefined),
    })).mutation(({ ctx, input }) => createCompany({ ...input, ownerId: ctx.user.id })),
    updateCompany: protectedProcedure.input(z.object({
      companyId: z.number().int().positive(),
      name: z.string().trim().min(2).max(180),
      description: z.string().trim().min(1).max(10000),
      industry: z.string().trim().min(2).max(120),
      location: z.string().trim().min(1).max(120),
      website: z.union([z.string().trim().url().max(255), z.literal("")]).optional().transform(value => value || undefined),
    })).mutation(async ({ ctx, input }) => {
      try { return await updateCompany(ctx.user.id, input.companyId, { name: input.name, description: input.description, industry: input.industry, location: input.location, website: input.website }); }
      catch (error) { if (error instanceof Error && error.message.includes("not found or not owned")) throw new TRPCError({ code: "FORBIDDEN", message: error.message }); throw error; }
    }),
    opportunities: protectedProcedure.query(({ ctx }) => listOpportunitiesByOwner(ctx.user.id)),
    createPost: protectedProcedure.input(postInput).mutation(({ ctx, input }) => {
      try { assertRateLimit(`post:${ctx.user.id}`); } catch { throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many posts; try again shortly" }); }
      return createBusinessPost({ ...input, authorId: ctx.user.id });
    }),
    addEvidence: protectedProcedure.input(z.object({ postId: z.number().int().positive(), label: z.string().trim().min(2).max(180), description: z.string().trim().min(3).max(5000), url: z.string().url().max(500).optional() })).mutation(async ({ ctx, input }) => {
      try { return await addPostEvidence(ctx.user.id, input); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Editorial post not found" ? "NOT_FOUND" : error instanceof Error && error.message.includes("Only the author") ? "FORBIDDEN" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to add evidence" }); }
    }),
    addSource: protectedProcedure.input(z.object({ postId: z.number().int().positive(), url: z.string().url().max(500), publisher: z.string().trim().max(180).optional(), title: z.string().trim().max(220).optional(), publishedAt: z.coerce.date().optional(), note: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      try { return await addPostSource(ctx.user.id, input); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Editorial post not found" ? "NOT_FOUND" : error instanceof Error && error.message === "Only the author can add a source" ? "FORBIDDEN" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to add source" }); }
    }),
    verifySource: protectedProcedure.input(z.object({ sourceId: z.number().int().positive(), decision: z.enum(["verified", "rejected"]), note: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      try { return await verifyPostSource(ctx.user.id, input.sourceId, input.decision, input.note); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Source not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to verify source" }); }
    }),
    updateEditorialDraft: protectedProcedure.input(z.object({ postId: z.number().int().positive(), title: z.string().trim().min(3).max(220), body: z.string().trim().min(1).max(10000), source: z.string().url().max(255).optional() })).mutation(async ({ ctx, input }) => {
      try { return await updateEditorialDraft(ctx.user.id, input.postId, input); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Editorial post not found" ? "NOT_FOUND" : error instanceof Error && error.message.includes("Only") ? "FORBIDDEN" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to update editorial draft" }); }
    }),
    submitEditorial: protectedProcedure.input(z.object({ postId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { return await submitEditorialPost(ctx.user.id, input.postId); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Editorial post not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to submit editorial post" }); }
    }),
    reviewEditorial: protectedProcedure.input(z.object({ postId: z.number().int().positive(), decision: z.enum(["approved", "rejected"]), note: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      if (!["admin", "editor"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Editor access required" });
      try { return await reviewEditorialPost(ctx.user.id, input.postId, input.decision, input.note); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Editorial post not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to review editorial post" }); }
    }),
    correctEditorial: protectedProcedure.input(z.object({ postId: z.number().int().positive(), title: z.string().trim().max(220).optional(), body: z.string().trim().min(1).max(10000), source: z.string().url().max(255).optional(), reason: z.string().trim().min(3).max(2000) })).mutation(async ({ ctx, input }) => {
      try { return await correctEditorialPost(ctx.user.id, input.postId, input); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Editorial post not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to correct editorial post" }); }
    }),
    takedownEditorial: protectedProcedure.input(z.object({ postId: z.number().int().positive(), reason: z.string().trim().min(3).max(2000), evidence: z.string().trim().max(4000).optional() })).mutation(async ({ ctx, input }) => {
      if (!["admin", "editor"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Editor access required" });
      try { return await takedownEditorialPost(ctx.user.id, input.postId, input.reason, input.evidence); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Editorial post not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to take down editorial post" }); }
    }),
    requestReporter: protectedProcedure.input(z.object({ outlet: z.string().trim().max(180).optional(), bio: z.string().trim().min(20).max(5000), evidence: z.string().trim().max(4000).optional() })).mutation(async ({ ctx, input }) => {
      try { return await requestReporterStatus(ctx.user.id, input); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "User not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to request reporter status" }); }
    }),
    reporterRequests: protectedProcedure.input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }).optional()).query(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return listReporterRequests(input?.status);
    }),
    reviewReporter: protectedProcedure.input(z.object({ requestId: z.number().int().positive(), decision: z.enum(["approved", "rejected"]), note: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      try { return await reviewReporterStatus(ctx.user.id, input.requestId, input.decision, input.note); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Reporter request not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to review reporter request" }); }
    }),
    setEditor: protectedProcedure.input(z.object({ userId: z.number().int().positive(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      try { return await setEditorRole(ctx.user.id, input.userId, input.enabled); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "User not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to change editor role" }); }
    }),
    editorialAppeals: protectedProcedure.input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }).optional()).query(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return listEditorialAppeals(input?.status);
    }),
    reviewAppeal: protectedProcedure.input(z.object({ appealId: z.number().int().positive(), decision: z.enum(["approved", "rejected"]), note: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      try { return await reviewEditorialAppeal(ctx.user.id, input.appealId, input.decision, input.note); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Appeal not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to review appeal" }); }
    }),
    appealEditorial: protectedProcedure.input(z.object({ postId: z.number().int().positive(), reason: z.string().trim().min(3).max(2000) })).mutation(async ({ ctx, input }) => {
      try { return await appealEditorialPost(ctx.user.id, input.postId, input.reason); }
      catch (error) { throw new TRPCError({ code: error instanceof Error && error.message === "Editorial post not found" ? "NOT_FOUND" : "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to submit appeal" }); }
    }),
    createOpportunity: protectedProcedure.input(z.object({
      title: z.string().trim().min(3).max(220), description: z.string().trim().min(10).max(10000), sector: z.string().trim().min(2).max(120), location: z.string().trim().max(120).optional(), value: z.string().trim().max(80).optional(), type: z.string().trim().min(2).max(80), stage: z.string().trim().max(80).optional(), deadline: z.coerce.date().optional(),
    })).mutation(({ ctx, input }) => {
      try { assertRateLimit(`opportunity:${ctx.user.id}`); } catch { throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many opportunity submissions; try again shortly" }); }
      return createOpportunity({ ...input, ownerId: ctx.user.id });
    }),
    updateOpportunity: protectedProcedure.input(z.object({
      opportunityId: z.number().int().positive(),
      title: z.string().trim().min(3).max(220), description: z.string().trim().min(10).max(10000), sector: z.string().trim().min(2).max(120), location: z.string().trim().max(120).optional(), value: z.string().trim().max(80).optional(), type: z.string().trim().min(2).max(80), stage: z.string().trim().max(80).optional(), deadline: z.coerce.date().optional(),
    })).mutation(async ({ ctx, input }) => {
      try { const { opportunityId, ...data } = input; return await updateOpportunity(ctx.user.id, opportunityId, data); }
      catch (error) { if (error instanceof Error && error.message.includes("not found or not owned")) throw new TRPCError({ code: "FORBIDDEN", message: error.message }); throw error; }
    }),
    matches: protectedProcedure.query(({ ctx }) => getOpportunityMatches(ctx.user.id)),
    leads: protectedProcedure.query(({ ctx }) => listOpportunityLeads(ctx.user.id)),
    updateLead: protectedProcedure.input(z.object({ leadId: z.number().int().positive(), status: z.enum(["new", "contacted", "qualified", "rejected", "won", "lost"]) })).mutation(async ({ ctx, input }) => {
      try { return await updateLeadStatus(ctx.user.id, input.leadId, input.status); }
      catch (error) { if (error instanceof Error && error.message.includes("not found or not owned")) throw new TRPCError({ code: "FORBIDDEN", message: error.message }); throw error; }
    }),
    requestVerification: protectedProcedure.input(z.object({ entityType: z.enum(["company", "opportunity"]), entityId: z.number().int().positive(), note: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      try { return await requestVerification(ctx.user.id, input.entityType, input.entityId, input.note); }
      catch (error) { if (error instanceof Error && error.message === "Not authorized") throw new TRPCError({ code: "FORBIDDEN", message: error.message }); if (error instanceof Error && error.message.includes("not found")) throw new TRPCError({ code: "NOT_FOUND", message: error.message }); throw error; }
    }),
    verificationRequests: protectedProcedure.query(({ ctx }) => listVerificationRequests(ctx.user.id, ctx.user.role === "admin")),
    reviewVerification: protectedProcedure.input(z.object({ requestId: z.number().int().positive(), decision: z.enum(["approved", "rejected"]), note: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      try { return await reviewVerification(ctx.user.id, input.requestId, input.decision, input.note); }
      catch (error) { if (error instanceof Error && error.message.includes("not found")) throw new TRPCError({ code: "NOT_FOUND", message: error.message }); throw error; }
    }),
    interest: protectedProcedure.input(z.object({ opportunityId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try {
        assertRateLimit(`interest:${ctx.user.id}`);
        return await markOpportunityInterest(ctx.user.id, input.opportunityId);
      } catch (error) {
        if (error instanceof Error && error.message === "Rate limit exceeded") {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many interest actions; try again shortly" });
        }
        if (error instanceof Error && error.message === "Opportunity not found") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Opportunity not found" });
        }
        if (error instanceof Error && error.message === "Cannot interest in your own opportunity") {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw error;
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
