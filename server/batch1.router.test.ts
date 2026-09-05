import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  createBusinessPost: vi.fn(),
  createCompany: vi.fn(),
  upsertProfile: vi.fn(),
  getProfile: vi.fn(),
  listCompaniesByOwner: vi.fn(),
  listBusinessData: vi.fn(() => ({ posts: [], opportunities: [], companies: [] })),
  createOpportunity: vi.fn(),
  markOpportunityInterest: vi.fn(),
}));
vi.mock("./db", () => mocks);

const context = (): TrpcContext => ({
  user: { id: 42, openId: "batch1-user", name: "Batch One", email: "batch1@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("Batch 1 mutation ownership contracts", () => {
  it("updates only the authenticated user's profile", async () => {
    const saved = { id: 1, userId: 42, headline: "Operator", bio: "Builder", location: "Jakarta", industry: "Food" };
    mocks.upsertProfile.mockResolvedValueOnce(saved);
    const result = await appRouter.createCaller(context()).business.updateProfile({ headline: "Operator", bio: "Builder", location: "Jakarta", industry: "Food" });
    expect(result).toEqual(saved);
    expect(mocks.upsertProfile).toHaveBeenCalledWith(42, { headline: "Operator", bio: "Builder", location: "Jakarta", industry: "Food" });
  });

  it("creates a company with ownerId from the authenticated user", async () => {
    const saved = { id: 3, ownerId: 42, name: "Northstar", description: "A company", industry: "Food", location: "Jakarta", website: undefined };
    mocks.createCompany.mockResolvedValueOnce(saved);
    const result = await appRouter.createCaller(context()).business.createCompany({ name: "Northstar", description: "A company", industry: "Food", location: "Jakarta", website: "" });
    expect(result).toEqual(saved);
    expect(mocks.createCompany).toHaveBeenCalledWith({ name: "Northstar", description: "A company", industry: "Food", location: "Jakarta", website: undefined, ownerId: 42 });
  });

  it("creates a normal post with authorId from the authenticated user", async () => {
    const saved = { id: 9, authorId: 42, type: "post", body: "A useful signal" };
    mocks.createBusinessPost.mockResolvedValueOnce(saved);
    const result = await appRouter.createCaller(context()).business.createPost({ body: "A useful signal" });
    expect(result).toEqual(saved);
    expect(mocks.createBusinessPost).toHaveBeenCalledWith({ body: "A useful signal", type: "post", authorId: 42 });
  });
});
