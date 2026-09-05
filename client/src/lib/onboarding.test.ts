import { describe, expect, it } from "vitest";
import { getOnboardingProgress } from "./onboarding";

describe("getOnboardingProgress", () => {
  it("returns a rounded percentage within bounds", () => {
    expect(getOnboardingProgress(1, 4)).toBe(25);
    expect(getOnboardingProgress(3, 4)).toBe(75);
    expect(getOnboardingProgress(8, 4)).toBe(100);
    expect(getOnboardingProgress(-1, 4)).toBe(0);
  });

  it("handles an empty onboarding checklist", () => {
    expect(getOnboardingProgress(0, 0)).toBe(0);
  });
});
