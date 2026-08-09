import raw from "./nbfc-country-stats.json";
import nbfcXlsxUrl from "../assets/nbfc-country-stats.xlsx?url";

export type NbfcDataQuality = "official" | "semi-official" | "secondary" | "not_found";

export type NbfcCountryStatRow = {
  country_code: string;
  country_name_zh: string;
  nbfc_equivalent_name: string;
  regulator: string;
  source_url: string;
  source_title: string;
  as_of: string;
  nbfc_count: string;
  loan_book_total: string;
  /** 放贷总量粗算美元（见 meta.fx_note） */
  loan_book_usd: string;
  /** 放贷总量美元数值（十亿美元）；供热力图汇总 */
  loan_book_usd_bn: number | null;
  borrowers_covered: string;
  avg_loan_size: string;
  default_rate: string;
  other_info: string;
  data_quality: NbfcDataQuality;
  notes: string;
};

export type NbfcCountryStatsDataset = {
  meta: {
    title: string;
    updated: string;
    note: string;
    fx_note?: string;
  };
  rows: NbfcCountryStatRow[];
};

export const NBFC_STATS: NbfcCountryStatsDataset = raw as NbfcCountryStatsDataset;

/** 底图/名单缺省名；港澳台统一「中国×」口径 */
const COUNTRY_LABEL_OVERRIDES: Record<string, string> = {
  HK: "中国香港",
  MO: "中国澳门",
  TW: "中国台湾",
};

/** 国家代码 → 中文名（来自统计表 + 口径覆盖） */
export const COUNTRY_LABEL_ZH: Record<string, string> = {
  ...Object.fromEntries(NBFC_STATS.rows.map((r) => [r.country_code, r.country_name_zh])),
  ...COUNTRY_LABEL_OVERRIDES,
};

/** 后台脚本生成的 Excel（scripts/generate-nbfc-xlsx.py），经 Vite 打包可下载 */
export const NBFC_XLSX_HREF = nbfcXlsxUrl;

export const DATA_QUALITY_LABEL: Record<NbfcDataQuality, string> = {
  official: "官方",
  "semi-official": "半官方",
  secondary: "二级",
  not_found: "待补",
};

export function downloadNbfcXlsx() {
  const a = document.createElement("a");
  a.href = NBFC_XLSX_HREF;
  a.download = "nbfc-country-stats.xlsx";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
