import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const { markOpportunityInterest } = vi.hoisted(() => ({ markOpportunityInterest: vi.fn() }));
vi.mock("./db", () => ({
  markOpportunityInterest,
  createBusinessPost: vi.fn(),
  createOpportunity: vi.fn(),
  getProfile: vi.fn(),
  listBusinessData: vi.fn(() => ({ posts: [], opportunities: [], companies: [] })),
}));

const user = { id: 11, openId: "interest-user", name: "Interest User", email: "interest@example.com", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const context = (authenticated = true): TrpcContext => ({
  user: authenticated ? user : undefined,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("business.interest end-to-end contract", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(context(false));
    await expect(caller.business.interest({ opportunityId: 21 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns success for a new interest and is idempotent for a duplicate", async () => {
    markOpportunityInterest
      .mockResolvedValueOnce({ success: true, alreadyInterested: false })
      .mockResolvedValueOnce({ success: true, alreadyInterested: true });
    const caller = appRouter.createCaller(context());
    await expect(caller.business.interest({ opportunityId: 21 })).resolves.toEqual({ success: true, alreadyInterested: false });
    await expect(caller.business.interest({ opportunityId: 21 })).resolves.toEqual({ success: true, alreadyInterested: true });
    expect(markOpportunityInterest).toHaveBeenCalledWith(11, 21);
  });

  it("maps a missing opportunity to NOT_FOUND", async () => {
    markOpportunityInterest.mockRejectedValueOnce(new Error("Opportunity not found"));
    const caller = appRouter.createCaller(context());
    await expect(caller.business.interest({ opportunityId: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
