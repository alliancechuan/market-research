import raw from "./player-competitive-intel.json";

export type CompetitiveLayerId = "incumbent" | "peer" | "scene" | "funding_alt" | string;

export type CompetitiveItem = {
  nameZh: string;
  groupKey?: string;
  ticker?: string;
  why: string;
  sourceType: string;
  sourceUrl?: string;
  confidence?: string;
  /** linked=已挂 CRM；pending=待建档；rail=支付轨道/基建（非玩家） */
  crmStatus?: "linked" | "pending" | "rail" | "infra";
};

export type CompetitiveLayer = {
  id: CompetitiveLayerId;
  items: CompetitiveItem[];
};

export type CompetitiveSubject = {
  id: string;
  groupKeys: string[];
  nameZh: string;
  ticker?: string;
  confidence?: string;
  cashLoanHint?: string;
  /** institution=玩家；rail=支付轨道/清算基建 */
  entityKind?: "institution" | "rail" | string;
  marketThesis?: {
    summary: string;
    thirdParty?: string;
    asOf?: string;
    feeNote?: string;
    crmStatus?: string;
    pricing?: {
      asOf?: string;
      verification?: string;
      aprOrFeeBand?: string;
      sourceUrl?: string;
    };
    [k: string]: unknown;
  };
  sources?: { type: string; title: string; url?: string; asOf?: string }[];
  layers: CompetitiveLayer[];
  chain?: {
    from?: string;
    namedByProspectus?: boolean;
    nextExpand?: string[];
  };
};

export type CompetitiveIntelFile = {
  asOf: string;
  note: string;
  layerLabels: Record<string, string>;
  queue: { pending: string[]; done: string[] };
  subjects: CompetitiveSubject[];
};

export const PLAYER_COMPETITIVE_INTEL = raw as CompetitiveIntelFile;

export const COMPETITIVE_LAYER_LABEL: Record<string, string> = {
  ...PLAYER_COMPETITIVE_INTEL.layerLabels,
};

const byGroup = new Map<string, CompetitiveSubject>();
const byTicker = new Map<string, CompetitiveSubject>();

for (const s of PLAYER_COMPETITIVE_INTEL.subjects) {
  for (const g of s.groupKeys) byGroup.set(g, s);
  const t = (s.ticker || "").split("/")[0].trim().toUpperCase();
  if (t && !t.includes("未上市") && !t.includes("私募")) byTicker.set(t, s);
}

export function resolveCompetitiveIntel(
  group: string,
  ticker?: string,
): CompetitiveSubject | undefined {
  if (byGroup.has(group)) return byGroup.get(group);
  if (ticker) {
    const t = ticker.split("/")[0].trim().toUpperCase();
    if (byTicker.has(t)) return byTicker.get(t);
  }
  // 属地子品牌：AdaKami/FinVolution（信也·ID）
  for (const s of PLAYER_COMPETITIVE_INTEL.subjects) {
    const nz = (s.nameZh || "").split(/[\s/]/)[0];
    if (nz && nz.length >= 2 && group.includes(nz)) return s;
    for (const k of s.groupKeys) {
      const brand = k.match(/（([^·]+)·/)?.[1];
      if (brand && brand.length >= 2 && group.includes(brand)) return s;
    }
  }
  return undefined;
}

export function competitiveQueueStats() {
  const q = PLAYER_COMPETITIVE_INTEL.queue;
  return {
    pending: q.pending.length,
    done: q.done.length,
    subjects: PLAYER_COMPETITIVE_INTEL.subjects.length,
  };
}
