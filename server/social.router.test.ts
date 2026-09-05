import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getPostSocial: vi.fn(),
  listPostComments: vi.fn(),
  createPostComment: vi.fn(),
  togglePostLike: vi.fn(),
  togglePostSave: vi.fn(),
}));
vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, ...mocks };
});

const user = { id: 42, openId: "social-user", name: "Social User", email: "social@example.com", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const context = (authenticated = true): TrpcContext => ({
  user: authenticated ? user : undefined,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("social router", () => {
  it("returns social state for requested posts", async () => {
    const social = { 9: { likes: 3, comments: 2, saves: 1, liked: true, saved: false, following: true } };
    mocks.getPostSocial.mockResolvedValueOnce(social);
    await expect(appRouter.createCaller(context()).business.social({ postIds: [9] })).resolves.toEqual(social);
    expect(mocks.getPostSocial).toHaveBeenCalledWith(42, [9]);
  });

  it("creates a comment for the authenticated user", async () => {
    const saved = { id: 1, postId: 9, userId: 42, body: "Useful update", authorName: "Social User", createdAt: new Date() };
    mocks.createPostComment.mockResolvedValueOnce(saved);
    await expect(appRouter.createCaller(context()).business.comment({ postId: 9, body: "Useful update" })).resolves.toEqual(saved);
    expect(mocks.createPostComment).toHaveBeenCalledWith(42, 9, "Useful update");
  });

  it("toggles like and save for the authenticated user", async () => {
    mocks.togglePostLike.mockResolvedValueOnce({ liked: true, likes: 4 });
    mocks.togglePostSave.mockResolvedValueOnce({ saved: true, saves: 2 });
    const caller = appRouter.createCaller(context());
    await expect(caller.business.like({ postId: 9 })).resolves.toEqual({ liked: true, likes: 4 });
    await expect(caller.business.save({ postId: 9 })).resolves.toEqual({ saved: true, saves: 2 });
    expect(mocks.togglePostLike).toHaveBeenCalledWith(42, 9);
    expect(mocks.togglePostSave).toHaveBeenCalledWith(42, 9);
  });

  it("rejects social writes for anonymous users", async () => {
    const caller = appRouter.createCaller(context(false));
    await expect(caller.business.comment({ postId: 9, body: "hello" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.business.like({ postId: 9 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.business.save({ postId: 9 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
