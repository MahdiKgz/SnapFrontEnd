export const MAP_TOOLS = [
  { id: "topology", label: "رفع خطاهای توپولوژی" },
  { id: "smart-analysis", label: "تحلیل هوشمند" },
  { id: "spatial-images", label: "تصاویر مکانی" },
] as const;

export type MapToolId = (typeof MAP_TOOLS)[number]["id"];
