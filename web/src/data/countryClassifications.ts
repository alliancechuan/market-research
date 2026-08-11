import raw from "./country-classifications.json";
import { NBFC_STATS } from "./nbfcCountryStats";

function aggregateLendingUsdBn(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of NBFC_STATS.rows) {
    const bn = r.loan_book_usd_bn;
    if (bn == null || !(bn > 0)) continue;
    out[r.country_code] = (out[r.country_code] ?? 0) + bn;
  }
  return out;
}

export type CountryClassificationRow = {
  country_code: string;
  country_name_zh: string;
  imf_dev_label: string;
  imf_weo_group: string;
  wb_income_group: string;
  wb_income_code: string;
  wb_region: string;
  oecd_member: string;
};

export type CountryClassificationsDataset = {
  meta: {
    title: string;
    updated: string;
    source: string;
    note: string;
  };
  rows: CountryClassificationRow[];
};

export const COUNTRY_CLASSIFICATIONS = raw as CountryClassificationsDataset;

export const CLASSIFICATION_BY_CODE: Record<string, CountryClassificationRow> = Object.fromEntries(
  COUNTRY_CLASSIFICATIONS.rows.map((r) => [r.country_code, r]),
);

/** IMF 发展标签（短标签，便于筛选） */
export const IMF_DEV_OPTIONS = [
  { value: "", label: "全部（IMF）" },
  { value: "发达", label: "发达" },
  { value: "发展中/新兴", label: "发展中/新兴" },
] as const;

/** 世行收入分组 */
export const WB_INCOME_OPTIONS = [
  { value: "", label: "全部（世行收入）" },
  { value: "高收入", label: "高收入" },
  { value: "中高收入", label: "中高收入" },
  { value: "中低收入", label: "中低收入" },
  { value: "低收入", label: "低收入" },
] as const;

export type MarketClassFilter = {
  imfDev: string;
  wbIncome: string;
  /** 额外限制到这些国家（如区域缩放）；null/undefined=不限制 */
  restrictCodes?: readonly string[] | null;
  /** 区域标签，用于合计文案（如「东南亚」） */
  restrictLabel?: string;
};

export function filterCountryCodes(filter: MarketClassFilter): string[] | null {
  const hasImf = Boolean(filter.imfDev);
  const hasWb = Boolean(filter.wbIncome);
  const hasRestrict = Boolean(filter.restrictCodes?.length);
  if (!hasImf && !hasWb && !hasRestrict) return null; // 全市场
  let codes: string[];
  if (hasImf || hasWb) {
    codes = COUNTRY_CLASSIFICATIONS.rows
      .filter((r) => {
        if (hasImf && r.imf_dev_label !== filter.imfDev) return false;
        if (hasWb && r.wb_income_group !== filter.wbIncome) return false;
        return true;
      })
      .map((r) => r.country_code);
  } else {
    codes = [...(filter.restrictCodes as readonly string[])];
  }
  if (hasRestrict && (hasImf || hasWb)) {
    const set = new Set(filter.restrictCodes);
    codes = codes.filter((c) => set.has(c));
  }
  return codes;
}

export function marketFilterLabel(filter: MarketClassFilter): string {
  const parts: string[] = [];
  if (filter.restrictLabel) parts.push(filter.restrictLabel);
  if (filter.imfDev) parts.push(`IMF·${filter.imfDev}`);
  if (filter.wbIncome) parts.push(`世行·${filter.wbIncome}`);
  return parts.length ? parts.join(" × ") : "全市场";
}

export type MarketLendingSummary = {
  label: string;
  countryCount: number;
  withDataCount: number;
  totalUsdBn: number;
  codes: string[] | null;
};

export function summarizeMarketLending(filter: MarketClassFilter): MarketLendingSummary {
  const codes = filterCountryCodes(filter);
  const lending = aggregateLendingUsdBn();
  const label = marketFilterLabel(filter);
  if (codes == null) {
    const entries = Object.entries(lending).filter(([, bn]) => bn > 0);
    return {
      label,
      countryCount: COUNTRY_CLASSIFICATIONS.rows.length,
      withDataCount: entries.length,
      totalUsdBn: entries.reduce((s, [, bn]) => s + bn, 0),
      codes: null,
    };
  }
  let total = 0;
  let withData = 0;
  for (const code of codes) {
    const bn = lending[code];
    if (bn != null && bn > 0) {
      total += bn;
      withData += 1;
    }
  }
  return {
    label,
    countryCount: codes.length,
    withDataCount: withData,
    totalUsdBn: total,
    codes,
  };
}

export function formatUsdBnTotal(bn: number): string {
  if (!(bn > 0)) return "—";
  if (bn >= 1000) return `USD ${(bn / 1000).toFixed(2)} tn`;
  if (bn >= 100) return `USD ${bn.toFixed(1)} bn`;
  return `USD ${bn.toFixed(2)} bn`;
}
