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
      // Use min threshold directly as order so ordering is strictly increasing
      return { category: "rank", order: min };
    }
    return { category: "rank", order: 1 };
  }
  if (/badge/i.test(name)) {
    return { category: "rank", order: item?.order ?? 1 };
  }
  return { category: "utility", order: undefined };
}
