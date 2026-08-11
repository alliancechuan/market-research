import { COUNTRY_MACRO, type CountryMacroSnap } from "./countryMacro";

/** 大屏可切换的宏观色阶因子（与 CRM 宏观五组对齐的可量化子集） */
export type MacroMapFactorId =
  | "hhDebt"
  | "fxVol"
  | "gdpPc"
  | "inflation"
  | "policyRate"
  | "unemployment";

export const MACRO_MAP_FACTORS: {
  id: MacroMapFactorId;
  label: string;
  unit: string;
  /** 色阶方向：high_risk=越高越深（风险向）；high_capacity=越高越深（容量向） */
  sense: "high_risk" | "high_capacity";
  field: keyof CountryMacroSnap;
  blurb: string;
}[] = [
  {
    id: "hhDebt",
    label: "居民杠杆",
    unit: "% GDP",
    sense: "high_risk",
    field: "householdDebtToGdp",
    blurb: "家庭债务/GDP · 信贷过热组 · 信源侧重 IMF FAS / BIS",
  },
  {
    id: "fxVol",
    label: "年内汇率波幅",
    unit: "",
    sense: "high_risk",
    field: "fxVolInYear",
    blurb: "约一年内高低相对均价（波幅，非累计贬值）· 外汇跨境组 · Frankfurter 等市价序列",
  },
  {
    id: "gdpPc",
    label: "人均GDP",
    unit: "USD",
    sense: "high_capacity",
    field: "gdpPerCapitaUsd",
    blurb: "现价人均GDP · 基本面组 · 信源侧重世行 / IMF",
  },
  {
    id: "inflation",
    label: "通胀",
    unit: "%",
    sense: "high_risk",
    field: "inflation",
    blurb: "最新通胀读数 · 基本面组 · TE / 统计局对照",
  },
  {
    id: "policyRate",
    label: "政策利率",
    unit: "%",
    sense: "high_risk",
    field: "policyRate",
    blurb: "政策利率 · 外汇/定价组 · 央行 / TE",
  },
  {
    id: "unemployment",
    label: "失业率",
    unit: "%",
    sense: "high_risk",
    field: "unemployment",
    blurb: "官方失业率（取首个%）· 人口就业组 · 信源侧重世行 / ILO",
  },
];

/** 从宏观快照文案中抽出第一个可比较数值 */
export function parseMacroNumber(raw?: string): number | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t || t === "—") return null;
  // ±8% / ±2.5%
  const pm = t.match(/±\s*(\d+(?:\.\d+)?)\s*%?/);
  if (pm) return Number(pm[1]);
  // 约13793美元 / 约58% / 4.3%（2026-06）/ 3%（2026-07）
  const m = t.match(/(-?\d+(?:\.\d+)?)\s*%?/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export type MacroMetricSeries = {
  id: MacroMapFactorId;
  label: string;
  unit: string;
  sense: "high_risk" | "high_capacity";
  blurb: string;
  byCode: Record<string, number>;
  rawByCode: Record<string, string>;
  min: number;
  max: number;
  count: number;
};

export function buildMacroMetric(id: MacroMapFactorId): MacroMetricSeries {
  const meta = MACRO_MAP_FACTORS.find((f) => f.id === id)!;
  const byCode: Record<string, number> = {};
  const rawByCode: Record<string, string> = {};
  for (const [code, snap] of Object.entries(COUNTRY_MACRO)) {
    const raw = snap[meta.field];
    if (typeof raw !== "string" || !raw.trim()) continue;
    const n = parseMacroNumber(raw);
    if (n == null) continue;
    byCode[code] = n;
    rawByCode[code] = raw;
  }
  const vals = Object.values(byCode);
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;
  return {
    id,
    label: meta.label,
    unit: meta.unit,
    sense: meta.sense,
    blurb: meta.blurb,
    byCode,
    rawByCode,
    min,
    max,
    count: vals.length,
  };
}

export function formatMacroValue(id: MacroMapFactorId, n: number): string {
  if (id === "gdpPc") return `USD ${Math.round(n).toLocaleString()}`;
  if (id === "fxVol") return `±${n}%`;
  if (Number.isInteger(n)) return `${n}${id === "hhDebt" || id === "inflation" || id === "policyRate" || id === "unemployment" ? "%" : ""}`;
  return `${n.toFixed(n >= 10 ? 1 : 2)}${id === "gdpPc" ? "" : "%"}`;
}
