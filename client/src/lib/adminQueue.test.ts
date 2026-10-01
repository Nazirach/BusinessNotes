import { describe, expect, it } from "vitest";
import { filterAndSortQueue, paginate, sortByLabel, toggleSelection } from "./adminQueue";

type Item = { status: "pending" | "approved" | "rejected"; createdAt: string; label: string; detail: string };
const items: Item[] = [
  { status: "pending", createdAt: "2026-01-03T00:00:00Z", label: "Beta", detail: "Outlet North" },
  { status: "approved", createdAt: "2026-01-01T00:00:00Z", label: "Alpha", detail: "Outlet South" },
  { status: "pending", createdAt: "2026-01-02T00:00:00Z", label: "Gamma", detail: "Outlet West" },
];

describe("admin queue helpers", () => {
  it("filters", () => expect(filterAndSortQueue(items, { status: "pending", search: "west", searchText: i => i.label + " " + i.detail })).toEqual([items[2]]));

  it("sorts", () => {
    expect(filterAndSortQueue(items, { status: "all", sort: "newest", searchText: i => i.label }).map(i => i.label)).toEqual(["Beta", "Gamma", "Alpha"]);
    expect(filterAndSortQueue(items, { status: "all", sort: "oldest", searchText: i => i.label }).map(i => i.label)).toEqual(["Alpha", "Gamma", "Beta"]);
  });

  it("does not mutate", () => {
    expect(sortByLabel(items, i => i.label).map(i => i.label)).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(items.map(i => i.label)).toEqual(["Beta", "Alpha", "Gamma"]);
  });

  it("paginates", () => {
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual({ items: [3, 4], page: 2, pageCount: 3, total: 5 });
    expect(paginate([], 2, 10)).toEqual({ items: [], page: 1, pageCount: 1, total: 0 });
  });

  it("normalizes non-finite pagination inputs", () => {
    expect(paginate([1, 2, 3], Number.NaN, Number.POSITIVE_INFINITY)).toEqual({ items: [1], page: 1, pageCount: 3, total: 3 });
    expect(paginate([1, 2, 3], Number.POSITIVE_INFINITY, Number.NaN)).toEqual({ items: [1], page: 1, pageCount: 3, total: 3 });
  });

  it("sorts invalid dates deterministically", () => {
    const invalid: Item = { status: "pending", createdAt: "not-a-date", label: "Invalid", detail: "Outlet" };
    expect(filterAndSortQueue([invalid, items[0]], { status: "all", sort: "newest", searchText: i => i.label })).toEqual([items[0], invalid]);
  });

  it("toggles", () => {
    expect(toggleSelection([2], 3, true)).toEqual([2, 3]);
    expect(toggleSelection([2, 3], 2, false)).toEqual([3]);
  });
});
