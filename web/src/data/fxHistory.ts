import raw from "./fx-history.json";

export type FxHistoryPoint = { d: string; v: number };

export type FxHistoryCountry = {
  ccy: string;
  pair: string;
  unit: string;
  quote: string;
  source?: string;
  note?: string;
  points: FxHistoryPoint[];
  /** true = 由宏观卡波动率/水平文案示意合成，非行情源 */
  synthetic?: boolean;
};

export type FxHistoryDataset = {
  meta: {
    asOf: string;
    range: string;
    sample: string;
    note: string;
    years?: number;
  };
  countries: Record<string, FxHistoryCountry>;
};

export const FX_HISTORY = raw as FxHistoryDataset;

export function getFxHistory(code: string): FxHistoryCountry | undefined {
  const row = FX_HISTORY.countries[code];
  if (!row || !row.points?.length) return undefined;
  return row;
}

/** 本币强弱涨跌计算窗口（相对序列末端） */
export type FxChgPeriodId = "3m" | "6m" | "1y" | "3y" | "5y" | "all";

export const FX_CHG_PERIODS: readonly { id: FxChgPeriodId; label: string; months: number | null }[] = [
  { id: "3m", label: "3个月", months: 3 },
  { id: "6m", label: "6个月", months: 6 },
  { id: "1y", label: "1年", months: 12 },
  { id: "3y", label: "3年", months: 36 },
  { id: "5y", label: "5年", months: 60 },
  { id: "all", label: "全区间", months: null },
] as const;

/** 截取末端 N 个月（含起止）；months=null 返回全序列 */
export function sliceFxPointsByMonths(
  points: FxHistoryPoint[],
  months: number | null,
): FxHistoryPoint[] {
  if (!points.length) return [];
  if (months == null || months <= 0) return points;
  const last = points[points.length - 1]!;
  const end = Date.parse(last.d);
  if (!Number.isFinite(end)) return points;
  const startMs = end - months * 30.4375 * 24 * 3600 * 1000;
  let i = 0;
  while (i < points.length - 1) {
    const t = Date.parse(points[i]!.d);
    if (Number.isFinite(t) && t >= startMs) break;
    i += 1;
  }
  const sliced = points.slice(i);
  return sliced.length >= 2 ? sliced : points.slice(-2);
}

/** 本币对美元强弱变动%（报价升≠本币涨） */
export function fxLocalStrengthChgPct(
  series: Pick<FxHistoryCountry, "quote">,
  points: FxHistoryPoint[],
): number {
  if (points.length < 2) return 0;
  const first = points[0]!.v;
  const last = points[points.length - 1]!.v;
  if (!first) return 0;
  const quoteChg = ((last - first) / first) * 100;
  return series.quote === "usd_per_eur" ? quoteChg : -quoteChg;
}

export function fxPointsSpanLabel(points: FxHistoryPoint[], synthetic?: boolean): string {
  if (synthetic && points.length >= 200) return "约 5 年";
  if (points.length < 2) return "区间";
  const a = Date.parse(points[0]!.d);
  const b = Date.parse(points[points.length - 1]!.d);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return "区间";
  const y = (b - a) / (365.25 * 24 * 3600 * 1000);
  if (y >= 1.5) return `约 ${y.toFixed(1)} 年`;
  const m = y * 12;
  if (m >= 1.2) return `约 ${m.toFixed(0)} 个月`;
  return `约 ${(m * 30).toFixed(0)} 天`;
}

function parseLevel(fxTrend?: string, fxHint?: string): number | null {
  const raw = fxTrend || fxHint || "";
  const m = raw.match(/约\s*([\d.]+)/);
  return m ? Number(m[1]) : null;
}

function parseVolPct(fxVolInYear?: string): number | null {
  if (!fxVolInYear) return null;
  const m = fxVolInYear.replace(/,/g, "").match(/([\d.]+)\s*%/);
  return m ? Number(m[1]) : null;
}

/** 稳定伪随机，同国同参数可复现 */
function hash01(seed: string, i: number): number {
  let h = 2166136261;
  const s = `${seed}:${i}`;
  for (let k = 0; k < s.length; k++) {
    h ^= s.charCodeAt(k);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * 有 Frankfurter 周序列则用真值；否则用水平 + 年内波动做「不规则」随机游走示意（避免正弦节拍器）。
 */
export function resolveFxSeries(
  code: string,
  opts?: { fxTrend?: string; fxHint?: string; fxVolInYear?: string },
): FxHistoryCountry | undefined {
  const real = getFxHistory(code);
  if (real) return real;

  const level = parseLevel(opts?.fxTrend, opts?.fxHint);
  const vol = parseVolPct(opts?.fxVolInYear);
  if (level == null || !(level > 0) || vol == null) return undefined;

  const n = 260; // ~5 年周抽样
  // 周波动：使近一年高低大致贴近 ±vol（粗）
  const weekSigma = (vol / 100) / Math.sqrt(52) * 1.15;
  const points: FxHistoryPoint[] = [];
  const end = new Date();

  // Box-Muller via hash
  const gauss = (i: number) => {
    const u1 = Math.max(1e-6, hash01(code, i * 2 + 1));
    const u2 = hash01(code, i * 2 + 2);
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  const path: number[] = [level];
  for (let i = 1; i < n; i++) {
    let shock = gauss(i) * weekSigma;
    // 偶发跳点（新兴市场更常见），打破规律感
    if (hash01(code, i + 900) > 0.965) {
      shock += (hash01(code, i + 901) - 0.5) * (vol / 100) * 0.55;
    }
    // 弱均值回归，末端不至于飘飞
    const meanPull = 0.012 * Math.log(level / Math.max(path[i - 1]!, level * 0.01));
    const next = path[i - 1]! * Math.exp(shock + meanPull);
    path.push(Math.max(level * 0.15, next));
  }

  // 末端贴当前宏观卡水平；缩放相对偏离使全程像「围绕终点的真实路径」
  const last = path[n - 1]!;
  const scale = last > 0 ? level / last : 1;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // 前段少缩放、后段全贴齐，避免整段被线性拉直
    const s = 1 + (scale - 1) * (0.15 + 0.85 * t);
    const d = new Date(end);
    d.setDate(d.getDate() - Math.round((n - 1 - i) * 7));
    const v = path[i]! * s;
    points.push({ d: d.toISOString().slice(0, 10), v: Number(v.toPrecision(6)) });
  }
  points[n - 1] = { d: points[n - 1]!.d, v: Number(level.toPrecision(6)) };

  return {
    ccy: "LCY",
    pair: "本币/USD",
    unit: "本币 / 1USD",
    quote: "lcy_per_usd",
    source: "示意合成",
    note: "缺公开周序列；随机游走示意约 5 年（非行情），仅供对照",
    points,
    synthetic: true,
  };
}
