import raw from "./country-license-credit-priority.json";
import { PLAYER_COMPETITIVE_INTEL } from "./playerCompetitiveIntel";

export type LicenseCreditTrack = "digibank" | "payment" | "online_credit" | string;

export type LicenseCreditEntry = {
  id: string;
  market: string;
  track: LicenseCreditTrack;
  nameZh: string;
  groupKey?: string;
  licenseNote?: string;
  onlineCredit?: string;
  intelId?: string;
  priority?: number;
};

export type LicenseCreditPriorityFile = {
  asOf: string;
  note: string;
  focusMarkets: string[];
  adjacentMarkets?: string[];
  tracks: Record<string, string>;
  entries: LicenseCreditEntry[];
};

export const LICENSE_CREDIT_PRIORITY = raw as LicenseCreditPriorityFile;

export const LICENSE_CREDIT_TRACK_LABEL: Record<string, string> = {
  digibank: "数字银行",
  payment: "支付牌照",
  online_credit: "线上信贷",
  ...LICENSE_CREDIT_PRIORITY.tracks,
};

export type LicenseCreditCoverage = "covered" | "queued" | "gap";

export function licenseCreditCoverage(entry: LicenseCreditEntry): LicenseCreditCoverage {
  const intelId = (entry.intelId || "").trim();
  if (!intelId) return "gap";
  const done = new Set(PLAYER_COMPETITIVE_INTEL.queue.done);
  if (done.has(intelId) || PLAYER_COMPETITIVE_INTEL.subjects.some((s) => s.id === intelId)) {
    return "covered";
  }
  if (PLAYER_COMPETITIVE_INTEL.queue.pending.includes(intelId)) return "queued";
  return "gap";
}

export function licenseCreditPriorityStats(opts?: { focusOnly?: boolean }) {
  const focus = new Set(LICENSE_CREDIT_PRIORITY.focusMarkets);
  const entries = opts?.focusOnly
    ? LICENSE_CREDIT_PRIORITY.entries.filter((e) => focus.has(e.market))
    : LICENSE_CREDIT_PRIORITY.entries;
  const byTrack: Record<string, { total: number; covered: number; queued: number; gap: number }> = {};
  let covered = 0;
  let queued = 0;
  let gap = 0;
  for (const e of entries) {
    const c = licenseCreditCoverage(e);
    if (c === "covered") covered += 1;
    else if (c === "queued") queued += 1;
    else gap += 1;
    const t = e.track || "other";
    if (!byTrack[t]) byTrack[t] = { total: 0, covered: 0, queued: 0, gap: 0 };
    byTrack[t].total += 1;
    byTrack[t][c] += 1;
  }
  return {
    total: entries.length,
    covered,
    queued,
    gap,
    byTrack,
    focusMarkets: LICENSE_CREDIT_PRIORITY.focusMarkets,
  };
}

/** 优先入竞争情报队列的 intelId（缺口/待扩，按 priority 再按展业六国） */
export function licenseCreditQueueIds(): string[] {
  const focus = new Set(LICENSE_CREDIT_PRIORITY.focusMarkets);
  const done = new Set(PLAYER_COMPETITIVE_INTEL.queue.done);
  const rows = LICENSE_CREDIT_PRIORITY.entries
    .filter((e) => e.intelId && !done.has(e.intelId) && !PLAYER_COMPETITIVE_INTEL.subjects.some((s) => s.id === e.intelId))
    .sort((a, b) => {
      const pa = a.priority ?? 9;
      const pb = b.priority ?? 9;
      if (pa !== pb) return pa - pb;
      const fa = focus.has(a.market) ? 0 : 1;
      const fb = focus.has(b.market) ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return (a.intelId || "").localeCompare(b.intelId || "");
    });
  const out: string[] = [];
  const seen = new Set<string>();
  for (const e of rows) {
    const id = e.intelId!;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}
