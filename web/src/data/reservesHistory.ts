import raw from "./reserves-history.json";

export type ReservesPoint = { d: string; v: number };

export type ReservesSeries = {
  unit: string;
  source?: string;
  freq?: string;
  note?: string;
  points: ReservesPoint[];
};

export type ReservesHistoryDataset = {
  meta: {
    asOf: string;
    range: string;
    sample: string;
    note: string;
    sources?: Record<string, string>;
  };
  countries: Record<string, ReservesSeries>;
};

export const RESERVES_HISTORY = raw as ReservesHistoryDataset;

export function getReservesHistory(code: string): ReservesSeries | undefined {
  const row = RESERVES_HISTORY.countries[code];
  if (!row || !row.points || row.points.length < 2) return undefined;
  return row;
}

/** 区间首末变动%（外储增减） */
export function reservesChgPct(points: ReservesPoint[]): number {
  if (points.length < 2) return 0;
  const a = points[0]!.v;
  const b = points[points.length - 1]!.v;
  if (!a) return 0;
  return ((b - a) / Math.abs(a)) * 100;
}

export function sliceReservesByYears(points: ReservesPoint[], years: number | null): ReservesPoint[] {
  if (!points.length) return [];
  if (years == null || years <= 0) return points;
  const lastY = Number(points[points.length - 1]!.d.slice(0, 4));
  if (!Number.isFinite(lastY)) return points;
  const minY = lastY - years + 1;
  const sliced = points.filter((p) => Number(p.d.slice(0, 4)) >= minY);
  return sliced.length >= 2 ? sliced : points.slice(-2);
}

export function formatReservesYi(v: number): string {
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (v >= 100) return v.toFixed(0);
  if (v >= 10) return v.toFixed(1);
  return v.toFixed(2);
}
