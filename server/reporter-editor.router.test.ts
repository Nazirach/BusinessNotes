import { describe, expect, it } from "vitest";

describe("reporter/editor contract", () => {
  it("defines the three editorial identity capabilities", async () => {
    const db = await import("./db");
    expect(typeof db.requestReporterStatus).toBe("function");
    expect(typeof db.reviewReporterStatus).toBe("function");
    expect(typeof db.setEditorRole).toBe("function");
    expect(typeof db.listReporterRequests).toBe("function");
    expect(typeof db.reviewEditorialAppeal).toBe("function");
  });
});
