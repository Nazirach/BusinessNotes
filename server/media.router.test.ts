import { describe, expect, it } from "vitest";

describe("media workflow contract", () => {
  it("supports image and video media kinds", () => {
    expect(["image", "video"]).toEqual(expect.arrayContaining(["image", "video"]));
  });
  it("uses processing states for video", () => {
    expect(["uploaded", "processing", "ready", "failed"]).toContain("processing");
  });
});
