import raw from "./ca-history.json";

export type CaPoint = { d: string; v: number };

export type CaSeries = {
  unit: string;
  source?: string;
  freq?: string;
  note?: string;
  points: CaPoint[];
};

export type CaHistoryDataset = {
  meta: {
    asOf: string;
    range: string;
    sample: string;
    note: string;
    sources?: Record<string, string>;
  };
  countries: Record<string, CaSeries>;
};

export const CA_HISTORY = raw as CaHistoryDataset;

export function getCaHistory(code: string): CaSeries | undefined {
  const row = CA_HISTORY.countries[code];
  if (!row || !row.points || row.points.length < 2) return undefined;
  return row;
}

export function caChgPctPts(points: CaPoint[]): number {
  if (points.length < 2) return 0;
  return points[points.length - 1]!.v - points[0]!.v;
}

export function sliceCaByYears(points: CaPoint[], years: number | null): CaPoint[] {
  if (!points.length) return [];
  if (years == null || years <= 0) return points;
  const lastY = Number(points[points.length - 1]!.d.slice(0, 4));
  if (!Number.isFinite(lastY)) return points;
  const minY = lastY - years + 1;
  const sliced = points.filter((p) => Number(p.d.slice(0, 4)) >= minY);
  return sliced.length >= 2 ? sliced : points.slice(-2);
}
