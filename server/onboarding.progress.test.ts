import { describe, expect, it } from "vitest";
import { getOnboardingProgress } from "../client/src/lib/onboarding";

describe("onboarding profile progress", () => {
  it("calculates bounded rounded progress", () => {
    expect(getOnboardingProgress(1, 4)).toBe(25);
    expect(getOnboardingProgress(3, 4)).toBe(75);
    expect(getOnboardingProgress(8, 4)).toBe(100);
    expect(getOnboardingProgress(-1, 4)).toBe(0);
  });

  it("returns zero for an empty checklist", () => {
    expect(getOnboardingProgress(0, 0)).toBe(0);
  });
});
