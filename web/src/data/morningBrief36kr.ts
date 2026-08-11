import raw from "./morning-brief-36kr.json";

export type MorningBriefSignal = {
  label: string;
  value: string;
};

export type MorningBriefSource = {
  title: string;
  url: string;
  time?: string;
};

/** 对齐宏观因子组：读数摘要 + 综合评论 + 06:00 窗内全部快讯（无外链） */
export type MorningBriefTheme = {
  id: string;
  title: string;
  count: number;
  summary: string;
  commentary: string;
  signals?: MorningBriefSignal[];
  /** 该主题下 [D-1 06:00, D 06:00) 全部快讯标题 */
  sources: MorningBriefSource[];
};

export type MorningBrief36kr = {
  source: string;
  sourceUrl: string;
  displayDate: string;
  coverageDate: string;
  /** 覆盖窗起点 CST：D-1 06:00 */
  windowStart?: string;
  /** 覆盖窗终点 CST：D 06:00（不含） */
  windowEnd?: string;
  /** 定点发布时间，如 2026-08-07 06:00 */
  publishAt?: string;
  generatedAt: string;
  stats: {
    coverageTotal: number;
    /** 与 coverageTotal 同为全量入报条数 */
    relevant: number;
    focusHit?: number;
    themeCount?: number;
    windowHours?: number;
    cutoffHourCst?: number;
  };
  headline: string;
  lede: string;
  /** 总览简评（对齐宏观 cashLoanVerdict） */
  overallVerdict: string;
  themes: MorningBriefTheme[];
  moreUrl: string;
};

export const MORNING_BRIEF_36KR = raw as MorningBrief36kr;
