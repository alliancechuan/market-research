import raw from "./producer-holdings.json";

export type HoldingFacility = {
  code: string;
  producer_short: string;
  entity: string;
  product_type: string;
  country_zh: string;
  investment_usd: number | null;
  priority_yield: number | null;
  benchmark_coverage: number | null;
  current_coverage: number | null;
  start_date: string | null;
  weight: number | null;
};

export type HoldingProducer = {
  id: string;
  name: string;
  entity: string;
  countries: string[];
  countries_zh: string;
  product_type: string;
  facility_count: number | null;
  investment_usd: number | null;
  portfolio_weight: number | null;
  ranking_note: string | null;
  outstanding_usd: number | null;
  outstanding_note: string | null;
  customers: number | null;
  customers_note: string | null;
  cumulative_disbursement_note: string | null;
  monthly_disbursement_note: string | null;
  yield_note: string | null;
  benchmark_coverage_note: string | null;
  facility_limit_usd: number | null;
  license_note: string | null;
  sources: string | null;
  completeness: string | null;
  remarks: string | null;
};

export type CountryProducerCard = {
  id: string;
  name: string;
  product_type: string;
  investment_usd: number;
  outstanding_usd: number | null;
  outstanding_display: string;
  outstanding_note: string | null;
  customers: number | null;
  customers_display: string;
  customers_note: string | null;
  ranking_note: string | null;
  yield_note: string | null;
  monthly_disbursement_note: string | null;
  cumulative_disbursement_note: string | null;
  license_note: string | null;
  heat_value_usd: number;
};

export type InvestedCountry = {
  country_code: string;
  country_zh: string;
  investment_usd: number;
  outstanding_usd_for_heat: number;
  outstanding_known: boolean;
  producers: CountryProducerCard[];
};

export type ProducerHoldingsData = {
  as_of: string;
  note: string;
  total_investment_usd: number;
  facilities: HoldingFacility[];
  producers: HoldingProducer[];
  countries: InvestedCountry[];
};

export const PRODUCER_HOLDINGS = raw as ProducerHoldingsData;

export const INVESTED_BY_CODE: Record<string, InvestedCountry> = Object.fromEntries(
  PRODUCER_HOLDINGS.countries.map((c) => [c.country_code, c]),
);

/** 各国热力在贷之和（生产商账面在贷；缺数国用基金投资额近似） */
export const TOTAL_OUTSTANDING_HEAT_USD = PRODUCER_HOLDINGS.countries.reduce(
  (s, c) => s + (c.outstanding_usd_for_heat || 0),
  0,
);

export function formatUsdCompact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1_000_000_000) return `USD ${(n / 1_000_000_000).toFixed(2)} bn`;
  if (n >= 1_000_000) return `USD ${(n / 1_000_000).toFixed(2)} M`;
  if (n >= 1_000) return `USD ${(n / 1_000).toFixed(1)} K`;
  return `USD ${n.toFixed(0)}`;
}
