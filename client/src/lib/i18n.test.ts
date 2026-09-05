import { describe, expect, it } from "vitest";
import { getMissingTranslationKeys, getStoredLocale, getTranslationKeys, normalizeLocale, translateForLocale, LOCALES } from "./i18n";

describe("BusinessNotes i18n contract", () => {
  it("exposes exactly the three supported product locales", () => {
    expect(LOCALES.map(locale => locale.code)).toEqual(["en", "id", "zh-CN"]);
  });

  it("reads a persisted locale without requiring a browser environment", () => {
    expect(getStoredLocale({ getItem: () => "zh-CN" })).toBe("zh-CN");
    expect(getStoredLocale({ getItem: () => "en" })).toBe("en");
    expect(getStoredLocale({ getItem: () => null })).toBeNull();
  });

  it("normalizes browser and stored locale variants", () => {
    expect(normalizeLocale("id-ID")).toBe("id");
    expect(normalizeLocale("zh-Hans-CN")).toBe("zh-CN");
    expect(normalizeLocale("fr-FR")).toBe("en");
    expect(normalizeLocale(null)).toBe("en");
  });

  it("translates known product copy and falls back to the source key", () => {
    expect(translateForLocale("id", "Opportunity")).toBe("Peluang");
    expect(translateForLocale("zh-CN", "Profile")).toBe("个人资料");
    expect(translateForLocale("en", "Unknown product key")).toBe("Unknown product key");
  });

  it("supports interpolation without changing the source contract", () => {
    expect(translateForLocale("en", "Hello {{name}}", { name: "Ayu" })).toBe("Hello Ayu");
  });

  it("keeps the resource catalog introspectable and complete for required product keys", () => {
    expect(getTranslationKeys()).toContain("Opportunity");
    expect(getTranslationKeys()).toContain("Welcome to BusinessNotes");
    expect(getMissingTranslationKeys("id")).toEqual([]);
    expect(getMissingTranslationKeys("zh-CN")).toEqual([]);
  });
});
