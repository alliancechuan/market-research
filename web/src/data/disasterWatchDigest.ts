import raw from "./disaster-watch-digest.json";

export type DisasterKind =
  | "earthquake"
  | "flood"
  | "cyclone"
  | "wildfire"
  | "volcano"
  | "drought"
  | "conflict"
  | "other";

export type DisasterWatchItem = {
  id: string;
  topic: "disaster";
  kind: DisasterKind;
  kindZh: string;
  country: string;
  nameZh: string;
  title: string;
  titleEn?: string;
  what?: string;
  how?: string;
  result?: string;
  url?: string;
  published?: string;
  source?: string;
  query?: string;
  mag?: number | null;
  lat?: number | null;
  lon?: number | null;
  severity?: string | null;
  cashLoanHint?: string;
};

export type DisasterWatchDigest = {
  source: string;
  generatedAt: string;
  displayDate: string;
  note?: string;
  stats: {
    itemTotal: number;
    byCountry?: Record<string, number>;
    byKind?: Record<string, number>;
  };
  items: DisasterWatchItem[];
};

export const DISASTER_WATCH_DIGEST = raw as DisasterWatchDigest;

export function disasterKindLabel(kind?: string): string {
  const map: Record<string, string> = {
    earthquake: "地震",
    flood: "洪涝",
    cyclone: "台风/气旋",
    wildfire: "火灾",
    volcano: "火山",
    drought: "干旱",
    conflict: "冲突/动荡",
    other: "灾害",
  };
  return (kind && map[kind]) || "灾害";
}

/** 某国近期灾害条数（快讯 chip 角标用） */
export function disasterCountForCountry(code?: string): number {
  if (!code) return 0;
  return (DISASTER_WATCH_DIGEST.items || []).filter((it) => it.country === code).length;
}
