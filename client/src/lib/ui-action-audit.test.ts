import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getPostRenderKey } from "./postKeys";

const homeSource = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");

describe("UI action audit guard", () => {
  it("does not reintroduce known mock success claims", () => {
    expect(homeSource).not.toContain("toast.success(\"Post liked\")");
    expect(homeSource).not.toContain("toast.success(\"Comment added for review\")");
    expect(homeSource).not.toContain("toast.info(\"Profile builder opened\")");
    expect(homeSource).not.toContain("setAssistantResult([t(\"Web article:");
  });

  it("keeps real server-backed actions wired", () => {
    expect(homeSource).toContain("trpc.business.interest.useMutation");
    expect(homeSource).toContain("trpc.business.blockUser.useMutation");
    expect(homeSource).toContain("trpc.business.muteUser.useMutation");
    expect(homeSource).toContain("trpc.business.aiGrounded.useMutation");
    expect(homeSource).not.toContain("not available yet");
  });

  it("generates stable identity keys across persisted and editorial posts", () => {
    expect(getPostRenderKey({ source: "persisted", id: 1 })).toBe("persisted:1");
    expect(getPostRenderKey({ source: "editorial", id: 1 })).toBe("editorial:1");
    expect(getPostRenderKey({ source: "persisted", id: 1 })).not.toBe(getPostRenderKey({ source: "editorial", id: 1 }));
  });
});
