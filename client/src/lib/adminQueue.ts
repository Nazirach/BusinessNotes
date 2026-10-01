export type QueueStatus = "pending" | "approved" | "rejected";
export type QueueSort = "newest" | "oldest";

export function filterAndSortQueue<T extends { status: QueueStatus; createdAt: Date | string }>(
  items: T[],
  options: { status: QueueStatus | "all"; search?: string; sort?: QueueSort; searchText: (item: T) => string }
): T[] {
  const query = options.search?.trim().toLowerCase() ?? "";
  return [...items]
    .filter(item => options.status === "all" || item.status === options.status)
    .filter(item => !query || options.searchText(item).toLowerCase().includes(query))
    .sort((a, b) =>
      options.sort === "oldest"
        ? +new Date(a.createdAt) - +new Date(b.createdAt)
        : +new Date(b.createdAt) - +new Date(a.createdAt)
    );
}

export function sortByLabel<T>(items: T[], label: (item: T) => string): T[] {
  return [...items].sort((a, b) => label(a).localeCompare(label(b)));
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; page: number; pageCount: number; total: number } {
  const safePageSize = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 1;
  const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));
  const safePage = Number.isFinite(page) ? Math.min(Math.max(1, Math.floor(page)), pageCount) : 1;
  const start = (safePage - 1) * safePageSize;
  return { items: items.slice(start, start + safePageSize), page: safePage, pageCount, total: items.length };
}

export function toggleSelection(selected: number[], id: number, checked: boolean): number[] {
  const next = new Set(selected);
  if (checked) next.add(id);
  else next.delete(id);
  return [...next];
}
