import raw from "./listed-player-disclosure.json";

export type ListedDisclosureKpi = {
  id: string;
  label: string;
  value: string;
  yoy?: string;
};

/** credit-native | payment | ecommerce | ride-food | digibank | bnpl */
export type ListedOrigin =
  | "credit-native"
  | "payment"
  | "ecommerce"
  | "ride-food"
  | "digibank"
  | "bnpl"
  | string;

export type ListedPlayerDisclosure = {
  id: string;
  groupKeys: string[];
  nameZh: string;
  ticker: string;
  exchange?: string;
  region?: string;
  countries?: string[];
  langZones?: string[];
  origin?: ListedOrigin;
  relevance?: string;
  irUrl?: string;
  period?: string;
  periodEnd?: string;
  reportedAt?: string;
  confidence?: string;
  sourceNote?: string;
  kpis: ListedDisclosureKpi[];
  cashLoanHint?: string;
  status: "filled" | "pending" | string;
};

export type ListedPlayerDisclosureFile = {
  asOf: string;
  note: string;
  origins?: Record<string, string>;
  stats?: {
    filled: number;
    pending: number;
    total: number;
    byRegion?: Record<string, number>;
    byOrigin?: Record<string, number>;
    byLine?: Record<string, number>;
  };
  players: ListedPlayerDisclosure[];
};

export const LISTED_PLAYER_DISCLOSURE = raw as ListedPlayerDisclosureFile;

export const LISTED_ORIGIN_LABEL: Record<string, string> = {
  "credit-native": "信贷原生",
  payment: "支付跨界",
  ecommerce: "电商跨界",
  "ride-food": "出行/外卖",
  digibank: "数字银行",
  bnpl: "BNPL/分期",
  ...(LISTED_PLAYER_DISCLOSURE.origins || {}),
};

export const LISTED_REGION_LABEL: Record<string, string> = {
  "east-asia": "东亚",
  "se-asia": "东南亚",
  "south-asia": "南亚",
  "central-asia": "中亚",
  latam: "拉美",
  mena: "中东北非",
  africa: "非洲",
  west: "欧美",
};

export function listedDisclosureStats() {
  const players = LISTED_PLAYER_DISCLOSURE.players;
  const filled = players.filter((p) => p.status === "filled" && p.kpis.length).length;
  const pending = players.length - filled;
  return { filled, pending, total: players.length };
}

export function listedCoverageByRegion() {
  const map = new Map<string, { filled: number; total: number }>();
  for (const p of LISTED_PLAYER_DISCLOSURE.players) {
    const r = p.region || "other";
    const cur = map.get(r) || { filled: 0, total: 0 };
    cur.total += 1;
    if (p.status === "filled" && p.kpis.length) cur.filled += 1;
    map.set(r, cur);
  }
  return map;
}

const byGroup = new Map<string, ListedPlayerDisclosure>();
const byTicker = new Map<string, ListedPlayerDisclosure>();

for (const p of LISTED_PLAYER_DISCLOSURE.players) {
  for (const g of p.groupKeys) byGroup.set(g, p);
  const t = (p.ticker || "").split("/")[0].trim().toUpperCase();
  if (t && !t.includes("未上市") && !t.includes("私募")) byTicker.set(t, p);
}

export function resolveListedDisclosure(
  group: string,
  ticker?: string,
): ListedPlayerDisclosure | undefined {
  if (byGroup.has(group)) return byGroup.get(group);
  if (ticker) {
    const t = ticker.split("/")[0].trim().toUpperCase();
    if (byTicker.has(t)) return byTicker.get(t);
  }
  // 子品牌/属地实体：AdaKami/FinVolution（信也·ID）→ 命中含相同 ticker 或 nameZh 的已填覆盖
  const filled = LISTED_PLAYER_DISCLOSURE.players.filter(
    (p) => p.status === "filled" && p.kpis.length > 0,
  );
  for (const p of filled) {
    const nz = (p.nameZh || "").split(/\s+/)[0];
    if (nz && nz.length >= 2 && group.includes(nz)) return p;
    for (const k of p.groupKeys) {
      const brand = k.match(/（([^·]+)·/)?.[1];
      if (brand && brand.length >= 2 && group.includes(brand)) return p;
    }
  }
  return undefined;
}
