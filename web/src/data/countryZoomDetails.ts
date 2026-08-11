import raw from "./country-zoom-details.json";
import { COUNTRY_LABEL_ZH, NBFC_STATS } from "./nbfcCountryStats";

export type PlayFinanceApp = {
  rank: number;
  name: string;
  developer: string;
  url?: string;
};

export type CountryZoomDetail = {
  country_code: string;
  as_of: string;
  source_url: string | null;
  available: boolean;
  note: string;
  population_millions: number;
  demographic_note: string;
  population_source: string;
  top_free_finance: PlayFinanceApp[];
};

export const COUNTRY_ZOOM_DETAILS: CountryZoomDetail[] = raw as CountryZoomDetail[];

export const COUNTRY_ZOOM_BY_CODE: Record<string, CountryZoomDetail> = Object.fromEntries(
  COUNTRY_ZOOM_DETAILS.map((d) => [d.country_code, d]),
);

export type NbfcCountrySummary = {
  country_code: string;
  country_name_zh: string;
  lendingUsdBn: number;
  rows: {
    category: string;
    nbfc_count: string;
    loan_book_total: string;
    loan_book_usd: string;
    default_rate: string;
    as_of: string;
    regulator: string;
    source_url: string;
  }[];
  nbfcCountDisplay: string;
};

export function summarizeNbfcForCountry(code: string): NbfcCountrySummary | null {
  const rows = NBFC_STATS.rows.filter((r) => r.country_code === code);
  if (!rows.length) return null;
  let lendingUsdBn = 0;
  for (const r of rows) {
    if (r.loan_book_usd_bn != null && r.loan_book_usd_bn > 0) lendingUsdBn += r.loan_book_usd_bn;
  }
  const counts = rows.map((r) => r.nbfc_count).filter((c) => c.trim());
  return {
    country_code: code,
    country_name_zh: COUNTRY_LABEL_ZH[code] ?? code,
    lendingUsdBn,
    rows: rows.map((r) => ({
      category: r.nbfc_equivalent_name,
      nbfc_count: r.nbfc_count,
      loan_book_total: r.loan_book_total,
      loan_book_usd: r.loan_book_usd,
      default_rate: r.default_rate,
      as_of: r.as_of,
      regulator: r.regulator,
      source_url: r.source_url,
    })),
    nbfcCountDisplay: counts.length ? counts.join(" · ") : "—",
  };
}

export function playFinanceChartUrl(code: string): string {
  return `https://play.google.com/store/apps/category/FINANCE?hl=en&gl=${code}`;
}
