import raw from "./cc-watch-digest.json";

export type CcWatchItem = {
  title: string;
  url: string;
  published?: string;
  source?: string;
  query?: string;
};

export type CcWatchPortal = {
  title: string;
  url: string;
};

export type CcWatchMarket = {
  code: string;
  nameZh: string;
  regulator?: string;
  portals: CcWatchPortal[];
  count: number;
  items: CcWatchItem[];
  cashLoanHint?: string;
};

export type CcWatchDigest = {
  source: string;
  generatedAt: string;
  displayDate: string;
  note?: string;
  stats: { marketCount: number; itemTotal: number; rssHits?: number };
  markets: CcWatchMarket[];
  overallVerdict: string;
};

export const CC_WATCH_DIGEST = raw as CcWatchDigest;
