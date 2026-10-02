import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  toggleFollow: vi.fn(),
  listPeople: vi.fn(),
  getDirectConversation: vi.fn(),
  listConversations: vi.fn(),
  listConversationMessages: vi.fn(),
  sendMessage: vi.fn(),
  listNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
}));
vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, ...mocks };
});

const user = { id: 42, openId: "network-user", name: "Network User", email: "network@example.com", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const context = (authenticated = true): TrpcContext => ({
  user: authenticated ? user : undefined,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("social network router", () => {
  it("toggles follow for an authenticated user", async () => {
    mocks.toggleFollow.mockResolvedValueOnce({ following: true });
    await expect(appRouter.createCaller(context()).business.follow({ userId: 7 })).resolves.toEqual({ following: true });
    expect(mocks.toggleFollow).toHaveBeenCalledWith(42, 7);
  });

  it("creates and sends a direct message", async () => {
    const conversation = { id: 11, directKey: "7:42", createdAt: new Date(), updatedAt: new Date() };
    mocks.getDirectConversation.mockResolvedValueOnce(conversation);
    mocks.sendMessage.mockResolvedValueOnce({ id: 1, conversationId: 11, senderId: 42, senderName: "Network User", body: "Hello", readAt: null, createdAt: new Date() });
    const caller = appRouter.createCaller(context());
    await expect(caller.business.startConversation({ userId: 7 })).resolves.toEqual(conversation);
    await expect(caller.business.sendMessage({ conversationId: 11, body: "Hello" })).resolves.toMatchObject({ conversationId: 11, senderId: 42, body: "Hello" });
  });

  it("reads and marks notifications for the authenticated user", async () => {
    const notification = { id: 3, userId: 42, type: "message", title: "New message", body: "Hello", readAt: null, createdAt: new Date() };
    mocks.listNotifications.mockResolvedValueOnce([notification]);
    mocks.markNotificationRead.mockResolvedValueOnce({ success: true, updated: true });
    const caller = appRouter.createCaller(context());
    await expect(caller.business.notifications()).resolves.toEqual([notification]);
    await expect(caller.business.markNotificationRead({ notificationId: 3 })).resolves.toEqual({ success: true, updated: true });
    expect(mocks.markNotificationRead).toHaveBeenCalledWith(42, 3);
  });

  it("rejects network writes for anonymous users", async () => {
    const caller = appRouter.createCaller(context(false));
    await expect(caller.business.follow({ userId: 7 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.business.sendMessage({ conversationId: 11, body: "Hello" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.business.markNotificationRead({ notificationId: 3 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
