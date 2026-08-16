import { COUNTRY_MACRO, type CountryMacroSnap } from "./countryMacro";

/** 大屏可切换的宏观色阶因子（与 CRM 宏观五组对齐的可量化子集） */
export type MacroMapFactorId =
  | "hhDebt"
  | "fxVol"
  | "gdpPc"
  | "incomePc"
  | "inflation"
  | "policyRate"
  | "unemployment"
  | "gasoline"
  | "electricity"
  | "fuelToPower";

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
    id: "incomePc",
    label: "人均收入",
    unit: "USD PPP",
    sense: "high_capacity",
    field: "incomePerCapita",
    blurb: "GNI/人 PPP（库内多数世行·OWID；少数 TE PPP）· 非住户可支配收入 · 基本面组〔10〕〔15〕",
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
  {
    id: "gasoline",
    label: "零售汽油",
    unit: "USD/升",
    sense: "high_risk",
    field: "gasolineRetail",
    blurb: "泵价 USD/升 · 基本面/生活成本 · TE Gasoline Prices〔1〕",
  },
  {
    id: "electricity",
    label: "居民电价",
    unit: "USD/kWh",
    sense: "high_risk",
    field: "electricityResidential",
    blurb: "居民用电含税 USD/kWh · 基本面/生活成本 · GlobalPetrolPrices〔22〕",
  },
  {
    id: "fuelToPower",
    label: "油电比",
    unit: "×",
    sense: "high_risk",
    field: "fuelToPowerRatio",
    blurb: "零售汽油÷居民电价 · 1升汽油约可购居民电kWh数 · 越高燃油相对电费越贵 · TE÷GPP〔1〕〔22〕",
  },
];

/** 从宏观快照文案中抽出第一个可比较数值 */
export function parseMacroNumber(raw?: string): number | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t || t === "—" || t.startsWith("—")) return null;
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
  if (id === "incomePc") return `USD ${Math.round(n).toLocaleString()} PPP`;
  if (id === "fxVol") return `±${n}%`;
  if (id === "gasoline") return n.toFixed(2);
  if (id === "electricity") return n.toFixed(3);
  if (id === "fuelToPower") return n.toFixed(1);
  const pct = id === "hhDebt" || id === "inflation" || id === "policyRate" || id === "unemployment";
  if (Number.isInteger(n)) return `${n}${pct ? "%" : ""}`;
  return `${n.toFixed(n >= 10 ? 1 : 2)}${pct ? "%" : ""}`;
}
