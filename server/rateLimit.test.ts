import { beforeEach, describe, expect, it } from "vitest";
import { assertRateLimit, resetRateLimitState } from "./rateLimit";

describe("rate limit baseline", () => {
  beforeEach(() => resetRateLimitState());

  it("rejects requests after the configured limit", () => {
    assertRateLimit("user:1", 2, 1000, 100);
    assertRateLimit("user:1", 2, 1000, 100);
    expect(() => assertRateLimit("user:1", 2, 1000, 100)).toThrow("Rate limit exceeded");
  });

  it("opens a new window after expiry and isolates keys", () => {
    assertRateLimit("user:1", 1, 1000, 100);
    expect(() => assertRateLimit("user:1", 1, 1000, 500)).toThrow();
    assertRateLimit("user:1", 1, 1000, 1100);
    assertRateLimit("user:2", 1, 1000, 500);
  });

  it("rejects invalid configuration", () => {
    expect(() => assertRateLimit("user:1", 0, 1000, 100)).toThrow("Invalid rate limit configuration");
    expect(() => assertRateLimit("user:1", 1, 0, 100)).toThrow("Invalid rate limit configuration");
    expect(() => assertRateLimit("user:1", 1, 1000, Number.NaN)).toThrow("Invalid rate limit configuration");
  });

  it("normalizes fractional limits and rejects empty keys", () => {
    assertRateLimit("user:1", 1.9, 1000, 100);
    expect(() => assertRateLimit("user:1", 1.9, 1000, 100)).toThrow("Rate limit exceeded");
    expect(() => assertRateLimit("   ", 1, 1000, 100)).toThrow("Rate limit key is required");
  });
});
