import raw from "./income-companion-history.json";

export type IncomePoint = { d: string; v: number };

export type IncomeSeries = {
  unit: string;
  source?: string;
  freq?: string;
  note?: string;
  points: IncomePoint[];
};

export type IncomeCompanionCountry = {
  gdpPerCapita?: IncomeSeries;
  remittancesGdp?: IncomeSeries;
  agriShare?: IncomeSeries;
  servicesShare?: IncomeSeries;
};

export type IncomeCompanionDataset = {
  meta: {
    asOf: string;
    range: string;
    sample: string;
    note: string;
    sources?: Record<string, string>;
  };
  countries: Record<string, IncomeCompanionCountry>;
};

export const INCOME_COMPANION_HISTORY = raw as IncomeCompanionDataset;

export function getIncomeCompanion(code: string): IncomeCompanionCountry | undefined {
  const row = INCOME_COMPANION_HISTORY.countries[code];
  if (!row) return undefined;
  return row;
}

export function incomeSeriesReady(s?: IncomeSeries | null): s is IncomeSeries {
  return !!s && Array.isArray(s.points) && s.points.length >= 2;
}

export function incomeChgPct(points: IncomePoint[]): number {
  if (points.length < 2) return 0;
  const a = points[0]!.v;
  const b = points[points.length - 1]!.v;
  if (!a) return 0;
  return ((b - a) / Math.abs(a)) * 100;
}

export function incomeChgPts(points: IncomePoint[]): number {
  if (points.length < 2) return 0;
  return points[points.length - 1]!.v - points[0]!.v;
}

export function sliceIncomeByYears(points: IncomePoint[], years: number | null): IncomePoint[] {
  if (!points.length) return [];
  if (years == null || years <= 0) return points;
  const lastY = Number(points[points.length - 1]!.d.slice(0, 4));
  if (!Number.isFinite(lastY)) return points;
  const minY = lastY - years + 1;
  const sliced = points.filter((p) => Number(p.d.slice(0, 4)) >= minY);
  return sliced.length >= 2 ? sliced : points.slice(-2);
}
