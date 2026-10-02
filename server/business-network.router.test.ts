import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  updateCompany: vi.fn(),
  listOpportunitiesByOwner: vi.fn(),
  updateOpportunity: vi.fn(),
  listOpportunityLeads: vi.fn(),
  updateLeadStatus: vi.fn(),
  getOpportunityMatches: vi.fn(),
  requestVerification: vi.fn(),
  listVerificationRequests: vi.fn(),
  reviewVerification: vi.fn(),
  addPostSource: vi.fn(),
  verifyPostSource: vi.fn(),
  listReporterRequests: vi.fn(),
  listEditorialAppeals: vi.fn(),
  reviewEditorialAppeal: vi.fn(),
}));
vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, ...mocks };
});

const user = { id: 42, openId: "business-user", name: "Business User", email: "business@example.com", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const admin = { ...user, id: 99, role: "admin" as const };
const context = (current = user): TrpcContext => ({ user: current, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });

it("supports company and opportunity management", async () => {
  const company = { id: 3, ownerId: 42, name: "Acme", description: "A business", industry: "Food", location: "Jakarta", website: null, verified: 0, createdAt: new Date(), updatedAt: new Date() };
  const opportunity = { id: 4, ownerId: 42, title: "Partner", description: "A real opportunity", sector: "Food", location: "Jakarta", value: "Rp1B", type: "Partnership", stage: "Seed", deadline: null, verificationStatus: "unverified" as const, interestedCount: 0, createdAt: new Date(), updatedAt: new Date() };
  mocks.updateCompany.mockResolvedValueOnce(company);
  mocks.updateOpportunity.mockResolvedValueOnce(opportunity);
  await expect(appRouter.createCaller(context()).business.updateCompany({ companyId: 3, name: "Acme", description: "A business", industry: "Food", location: "Jakarta", website: "" })).resolves.toEqual(company);
  await expect(appRouter.createCaller(context()).business.updateOpportunity({ opportunityId: 4, title: "Partner", description: "A real opportunity", sector: "Food", location: "Jakarta", value: "Rp1B", type: "Partnership", stage: "Seed" })).resolves.toEqual(opportunity);
});

it("supports matching, leads, and verification workflows", async () => {
  mocks.getOpportunityMatches.mockResolvedValueOnce([]);
  mocks.listOpportunityLeads.mockResolvedValueOnce([]);
  mocks.listVerificationRequests.mockResolvedValueOnce([]);
  mocks.updateLeadStatus.mockResolvedValueOnce({ id: 8, status: "qualified" });
  mocks.requestVerification.mockResolvedValueOnce({ id: 10, status: "pending" });
  mocks.reviewVerification.mockResolvedValueOnce({ id: 10, status: "approved" });
  const caller = appRouter.createCaller(context());
  await expect(caller.business.matches()).resolves.toEqual([]);
  await expect(caller.business.leads()).resolves.toEqual([]);
  await expect(caller.business.verificationRequests()).resolves.toEqual([]);
  await expect(caller.business.updateLead({ leadId: 8, status: "qualified" })).resolves.toEqual({ id: 8, status: "qualified" });
  await expect(caller.business.requestVerification({ entityType: "company", entityId: 3, note: "Please verify" })).resolves.toEqual({ id: 10, status: "pending" });
  await expect(caller.business.reviewVerification({ requestId: 10, decision: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  await expect(appRouter.createCaller(context(admin)).business.reviewVerification({ requestId: 10, decision: "approved" })).resolves.toEqual({ id: 10, status: "approved" });
});

describe("business network authorization", () => {
  it("rejects anonymous business writes and admin-only verification review", async () => {
    const anonymous = appRouter.createCaller({ ...context(user), user: undefined });
    await expect(anonymous.business.updateCompany({ companyId: 1, name: "Acme", description: "Business", industry: "Food", location: "Jakarta", website: "" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anonymous.business.updateOpportunity({ opportunityId: 1, title: "Partner", description: "A real opportunity", sector: "Food", type: "Partnership" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anonymous.business.reviewVerification({ requestId: 1, decision: "approved" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("editorial integrity actions", () => {
  it("allows correction for an author and keeps admin-only takedown protected", async () => {
    const anonymous = appRouter.createCaller({ ...context(user), user: undefined });
    await expect(anonymous.business.correctEditorial({ postId: 1, body: "Corrected", reason: "Factual correction" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(callerFor(user).business.takedownEditorial({ postId: 1, reason: "False information" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("requires authenticated authors for appeals", async () => {
    const anonymous = appRouter.createCaller({ ...context(user), user: undefined });
    await expect(anonymous.business.appealEditorial({ postId: 1, reason: "I disagree with the decision" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

function callerFor(current: typeof user) {
  return appRouter.createCaller(context(current));
}


describe("editorial sources", () => {
  it("protects source verification as admin-only and source creation as author-only", async () => {
    mocks.addPostSource.mockResolvedValueOnce({ id: 1, postId: 1, url: "https://example.com/source", verificationStatus: "unverified" });
    mocks.verifyPostSource.mockResolvedValueOnce({ id: 1, postId: 1, url: "https://example.com/source", verificationStatus: "verified" });
    await expect(callerFor(user).business.addSource({ postId: 1, url: "https://example.com/source" })).resolves.toMatchObject({ id: 1 });
    await expect(callerFor(user).business.verifySource({ sourceId: 1, decision: "verified" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor(admin).business.verifySource({ sourceId: 1, decision: "verified" })).resolves.toMatchObject({ verificationStatus: "verified" });
  });
});


describe("editorial governance", () => {
  it("protects reporter applications and appeal review as admin-only", async () => {
    mocks.listReporterRequests.mockResolvedValueOnce([]);
    mocks.listEditorialAppeals.mockResolvedValueOnce([]);
    mocks.reviewEditorialAppeal.mockResolvedValueOnce({ id: 7, status: "approved" });
    await expect(callerFor(user).business.reporterRequests({ status: "pending" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor(user).business.editorialAppeals({ status: "pending" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor(user).business.reviewAppeal({ appealId: 7, decision: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor(admin).business.reporterRequests({ status: "pending" })).resolves.toEqual([]);
    await expect(callerFor(admin).business.editorialAppeals({ status: "pending" })).resolves.toEqual([]);
    await expect(callerFor(admin).business.reviewAppeal({ appealId: 7, decision: "approved" })).resolves.toEqual({ id: 7, status: "approved" });
  });
});
