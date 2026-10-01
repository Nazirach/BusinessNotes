import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const user = { id: 7, openId: "user-7", name: "Test User", email: "test@example.com", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const context = (authenticated = true): TrpcContext => ({
  user: authenticated ? user : undefined,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("business router authorization and validation", () => {
  it("rejects createPost for anonymous callers", async () => {
    const caller = appRouter.createCaller(context(false));
    await expect(caller.business.createPost({ body: "A useful business signal" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects malformed post and interest inputs before reaching persistence", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.business.createPost({ body: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.business.interest({ opportunityId: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("validates public news search bounds before persistence", async () => {
    const caller = appRouter.createCaller(context(false));
    await expect(caller.business.searchNews({ query: "valid", limit: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.business.searchNews({ query: "valid", limit: 31 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires a meaningful query for news search", async () => {
    const caller = appRouter.createCaller(context(false));
    await expect(caller.business.searchNews({ query: "a" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("bounds news search at the router boundary", async () => {
    const caller = appRouter.createCaller(context(false));
    await expect(caller.business.searchNews({ query: "news", limit: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.business.searchNews({ query: "news", limit: 31 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects anonymous social and moderation mutations", async () => {
    const anonymous = appRouter.createCaller(context(false));
    await expect(anonymous.business.comment({ postId: 1, body: "test comment" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anonymous.business.like({ postId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anonymous.business.reportPost({ postId: 1, reason: "spam" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anonymous.business.interest({ opportunityId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("keeps the authenticated POST interaction chain separate from opportunity interest", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.business.comment({ postId: 0, body: "test comment" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.business.like({ postId: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.business.reportPost({ postId: 0, reason: "spam" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.business.interest({ opportunityId: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("validates report input before persistence", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.business.reportPost({ postId: 1, reason: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.business.reportPost({ postId: 1, reason: "x".repeat(81) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("protects profile and company operations for anonymous callers", async () => {
    const caller = appRouter.createCaller(context(false));
    await expect(caller.business.profile()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.business.companies()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.business.updateProfile({ headline: "", bio: "", location: "", industry: "" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.business.createCompany({ name: "Ac", description: "", industry: "", location: "", website: "" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects invalid Batch 1 write inputs before persistence", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.business.createCompany({ name: "A", description: "", industry: "", location: "", website: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("protects bulk editorial review mutations", async () => {
    const anonymous = appRouter.createCaller(context(false));
    await expect(anonymous.business.bulkReviewReporter({ requestIds: [1], decision: "approved" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anonymous.business.bulkReviewAppeal({ appealIds: [1], decision: "approved" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
