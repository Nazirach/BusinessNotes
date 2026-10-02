import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getPrivacySettings: vi.fn(), updatePrivacySettings: vi.fn(), listPeople: vi.fn(),
  toggleUserBlock: vi.fn(), toggleUserMute: vi.fn(), listBlockedUsers: vi.fn(), listMutedUsers: vi.fn(),
  getDirectConversation: vi.fn(), sendMessage: vi.fn(),
  recommendBusinessOpportunities: vi.fn(), matchBusinessPartners: vi.fn(),
}));
vi.mock("./db", async () => { const actual = await vi.importActual<typeof import("./db")>("./db"); return { ...actual, ...mocks }; });
vi.mock("./ai", async () => { const actual = await vi.importActual<typeof import("./ai")>("./ai"); return { ...actual, ...mocks }; });

const user = { id: 42, openId: "privacy-user", name: "Privacy User", email: "privacy@example.com", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const context = (authenticated = true): TrpcContext => ({ user: authenticated ? user : undefined, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });

describe("privacy and access router wiring", () => {
  it("wires privacy, block and mute endpoints to persistence", async () => {
    mocks.getPrivacySettings.mockResolvedValueOnce({ userId: 42, discoverability: "everyone", allowMessages: "everyone", personalizedRecommendations: 1 });
    mocks.updatePrivacySettings.mockResolvedValueOnce({ userId: 42, allowMessages: "connections" });
    mocks.toggleUserBlock.mockResolvedValueOnce({ blocked: true });
    mocks.toggleUserMute.mockResolvedValueOnce({ muted: true });
    mocks.listBlockedUsers.mockResolvedValueOnce([{ id: 8, name: "Blocked" }]);
    mocks.listMutedUsers.mockResolvedValueOnce([{ id: 9, name: "Muted" }]);
    const caller = appRouter.createCaller(context());
    await caller.business.privacySettings();
    await caller.business.updatePrivacySettings({ allowMessages: "connections" });
    await caller.business.blockUser({ userId: 8 });
    await caller.business.muteUser({ userId: 9 });
    await caller.business.blockedUsers();
    await caller.business.mutedUsers();
    expect(mocks.updatePrivacySettings).toHaveBeenCalledWith(42, { allowMessages: "connections" });
    expect(mocks.toggleUserBlock).toHaveBeenCalledWith(42, 8);
    expect(mocks.toggleUserMute).toHaveBeenCalledWith(42, 9);
  });

  it("wires AI recommendation and matching endpoints", async () => {
    mocks.recommendBusinessOpportunities.mockResolvedValueOnce({ recommendations: [], explanation: "ok" });
    mocks.matchBusinessPartners.mockResolvedValueOnce({ matches: [], note: "ok" });
    const caller = appRouter.createCaller(context());
    await caller.business.aiRecommend({ limit: 5 });
    await caller.business.aiMatch({ query: "manufacturing", limit: 5 });
    expect(mocks.recommendBusinessOpportunities).toHaveBeenCalledWith(42, 5);
    expect(mocks.matchBusinessPartners).toHaveBeenCalledWith(42, { query: "manufacturing", limit: 5 });
  });

  it("keeps access controls protected for anonymous users", async () => {
    const caller = appRouter.createCaller(context(false));
    await expect(caller.business.privacySettings()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.business.blockUser({ userId: 8 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.business.muteUser({ userId: 9 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.business.aiRecommend({ limit: 5 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
