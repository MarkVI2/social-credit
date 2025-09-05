export type ItemCategory = "rank" | "utility";

export function classifyItem(item: any): {
  category?: ItemCategory;
  order?: number;
} {
  if (item?.category) return { category: item.category, order: item.order };
  const sku: string = String(item?.sku || "");
  const name: string = String(item?.name || "");
  // Known mappings for legacy seeded SKUs
  const knownRankOrder: Record<string, number> = {
    RANK_RECRUIT: 1,
    RANK_KOMRADE: 2,
    RANK_APPARATCHIK: 3,
    RANK_COMMISSAR: 4,
    RANK_POLITBURO: 5,
    RANK_GENERAL_SECRETARY: 6,
  };
  if (sku in knownRankOrder) {
    return { category: "rank", order: knownRankOrder[sku] };
  }
  if (sku.startsWith("rank:")) {
    const minStr = sku.split(":")[1];
    const min = Number(minStr);
    if (Number.isFinite(min)) {
      const order =
        min <= 20 ? 1 : min <= 40 ? 2 : min <= 70 ? 3 : min <= 100 ? 4 : 5;
      return { category: "rank", order };
    }
    return { category: "rank", order: 1 };
  }
  if (/badge/i.test(name)) {
    return { category: "rank", order: item?.order ?? 1 };
  }
  return { category: "utility", order: undefined };
}
