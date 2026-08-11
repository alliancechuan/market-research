import raw from "./cc-watch-digest.json";

export type CcWatchItem = {
  title: string;
  url: string;
  published?: string;
  source?: string;
  query?: string;
  /** 叙事五问：首页展开优先展示 */
  who?: string;
  when?: string;
  what?: string;
  how?: string;
  result?: string;
};

export type CcWatchPortal = {
  title: string;
  url: string;
};

/** 点点 H1 国别流量分盘（与 industry-research-library.quadBuckets 对齐） */
export type CcWatchDiandian = {
  downloadRank?: number;
  downloadWan?: string;
  mom?: string;
  /** star=明星盘 pressure=压力盘 potential=潜力盘 longTail=长尾 */
  bucket?: "star" | "pressure" | "potential" | "longTail";
  asOf?: string;
};

export type CcWatchMarket = {
  code: string;
  nameZh: string;
  regulator?: string;
  portals: CcWatchPortal[];
  count: number;
  items: CcWatchItem[];
  cashLoanHint?: string;
  /** invested=展业国；diandian_hot=点点热门且非展业主位 */
  tier?: "invested" | "diandian_hot";
  diandian?: CcWatchDiandian;
};

export type CcWatchDigest = {
  source: string;
  generatedAt: string;
  displayDate: string;
  note?: string;
  stats: {
    marketCount: number;
    itemTotal: number;
    rssHits?: number;
    diandianHotCount?: number;
  };
  markets: CcWatchMarket[];
  overallVerdict: string;
};

export const CC_WATCH_DIGEST = raw as CcWatchDigest;

export function diandianBucketLabel(bucket?: CcWatchDiandian["bucket"]): string {
  if (bucket === "star") return "明星盘";
  if (bucket === "pressure") return "压力盘";
  if (bucket === "potential") return "潜力盘";
  if (bucket === "longTail") return "长尾盘";
  return "";
}
