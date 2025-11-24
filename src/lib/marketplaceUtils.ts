export type ItemCategory = "rank" | "utility";

export function classifyItem(item: any): {
  category?: ItemCategory;
  order?: number;
} {
  if (item?.category) return { category: item.category, order: item.order };
  const sku: string = String(item?.sku || "");
  const name: string = String(item?.name || "");

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
