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

  it("rejects interest mutation for anonymous callers", async () => {
    const caller = appRouter.createCaller(context(false));
    await expect(caller.business.interest({ opportunityId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
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
});
