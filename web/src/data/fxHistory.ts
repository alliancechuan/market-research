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
};

export type FxHistoryDataset = {
  meta: {
    asOf: string;
    range: string;
    sample: string;
    note: string;
  };
  countries: Record<string, FxHistoryCountry>;
};

export const FX_HISTORY = raw as FxHistoryDataset;

export function getFxHistory(code: string): FxHistoryCountry | undefined {
  return FX_HISTORY.countries[code];
}
