import raw from "./morning-brief-36kr.json";

export type MorningBriefSignal = {
  label: string;
  value: string;
};

export type MorningBriefSource = {
  title: string;
  url: string;
  time?: string;
  /** strong | weak | noise */
  relevance?: string;
  cashLoanHint?: string;
  /** 叙事五问：展开优先展示 */
  who?: string;
  when?: string;
  what?: string;
  how?: string;
  result?: string;
};

/** 对齐消费信贷三板块 + 弱相关 */
export type MorningBriefTheme = {
  id: string;
  title: string;
  count: number;
  summary: string;
  commentary: string;
  signals?: MorningBriefSignal[];
  /** 主板块 true；弱相关 false */
  primary?: boolean;
  sources: MorningBriefSource[];
};

export type MorningBrief36kr = {
  source: string;
  sourceUrl: string;
  displayDate: string;
  coverageDate: string;
  windowStart?: string;
  windowEnd?: string;
  publishAt?: string;
  generatedAt: string;
  stats: {
    coverageTotal: number;
    relevant: number;
    strong?: number;
    weak?: number;
    noise?: number;
    focusHit?: number;
    regOpsCount?: number;
    themeCount?: number;
    windowHours?: number;
    cutoffHourCst?: number;
  };
  headline: string;
  lede: string;
  overallVerdict: string;
  themes: MorningBriefTheme[];
  moreUrl: string;
};

export const MORNING_BRIEF_36KR = raw as MorningBrief36kr;

export const BRIEF_PRIMARY_IDS = ["reg_license", "asset_price", "fx_macro"] as const;
