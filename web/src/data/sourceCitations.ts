import { INDUSTRY_RESEARCH_LIBRARY } from "./industryResearchLibrary";

export type SourceCiteKind =
  | "macro"
  | "regulator"
  | "research"
  | "traffic"
  | "news"
  | "bond"
  | "secondary"
  | string;

export type SourceCitation = {
  /** 展示编号（稳定） */
  no: number;
  id: string;
  title: string;
  kind: SourceCiteKind;
  url?: string;
  asOf?: string;
  /** 所属研报 id（若来自研报库 sources[]） */
  reportId?: string;
  note?: string;
};

/** 核心长期信源：固定编号，勿随意改号以免正文失效 */
export const CORE_SOURCE_CITATIONS: SourceCitation[] = [
  {
    no: 1,
    id: "te",
    title: "Trading Economics（宏观聚合）",
    kind: "macro",
    url: "https://zh.tradingeconomics.com/",
    note: "国别指标默认出处；二级读数亦常经此聚合",
  },
  {
    no: 2,
    id: "diandian",
    title: "点点数据（流量/商店监测）",
    kind: "traffic",
    note: "下载/MAU/上下架；见行业研报库点点专题",
  },
  {
    no: 3,
    id: "moteng",
    title: "墨腾创投（Momentum Works）",
    kind: "research",
    note: "东南亚平台与金融科技专题",
  },
  {
    no: 4,
    id: "ojk",
    title: "OJK（印尼金监）官方/RDKB",
    kind: "regulator",
    url: "https://www.ojk.go.id/",
    note: "P2P/BNPL 余额与 POJK；媒体转述须回指本号或子条目",
  },
  {
    no: 5,
    id: "bsp",
    title: "BSP（菲律宾央行）",
    kind: "regulator",
    url: "https://www.bsp.gov.ph/",
    note: "数字支付年报、Circular 1133 等",
  },
  {
    no: 6,
    id: "sec-ph",
    title: "SEC Philippines（线上放贷/OLP）",
    kind: "regulator",
    url: "https://www.sec.gov.ph/",
    note: "Lending/Financing/OLP 登记与执法",
  },
  {
    no: 7,
    id: "rm",
    title: "Research and Markets（媒体摘要）",
    kind: "research",
    url: "https://www.researchandmarkets.com/",
    note: "BNPL 美元规模等；与监管余额分轨，不作主尺",
  },
  {
    no: 8,
    id: "imf",
    title: "IMF / WEO",
    kind: "macro",
    url: "https://www.imf.org/",
  },
  {
    no: 9,
    id: "chinamoney",
    title: "中国货币网（银行间债/ABN）",
    kind: "bond",
    url: "https://www.chinamoney.com.cn/",
  },
  {
    no: 10,
    id: "wb-secondary",
    title: "世界银行/二级统计转述",
    kind: "secondary",
    url: "https://data.worldbank.org/",
    note: "外储、私营信贷/GDP 等二级口径",
  },
  {
    no: 11,
    id: "bisnis",
    title: "Bisnis.com（OJK 媒体转述）",
    kind: "news",
    url: "https://finansial.bisnis.com/",
  },
  {
    no: 12,
    id: "detik-finance",
    title: "Detik Finance（OJK 媒体转述）",
    kind: "news",
    url: "https://finance.detik.com/",
  },
  {
    no: 13,
    id: "frankfurter",
    title: "Frankfurter（ECB 参考汇率序列）",
    kind: "macro",
    url: "https://www.frankfurter.app/",
    note: "年内汇率波幅/多周走势；与 TE 即期水平分轨",
  },
  {
    no: 14,
    id: "bis",
    title: "BIS（家庭信贷/GDP 等）",
    kind: "macro",
    url: "https://data.bis.org/",
    note: "WS_TC 家庭债务/GDP 等；与 TE 杠杆读数交叉",
  },
  {
    no: 15,
    id: "owid",
    title: "Our World in Data（转载世行等）",
    kind: "secondary",
    url: "https://ourworldindata.org/",
    note: "GNI/人 PPP 等转载；非住户可支配收入一手",
  },
];

const KIND_LABEL: Record<string, string> = {
  macro: "宏观",
  regulator: "监管",
  research: "研报",
  traffic: "流量",
  news: "新闻",
  bond: "债券",
  secondary: "二级",
};

export function sourceCiteKindLabel(kind: string): string {
  return KIND_LABEL[kind] || kind;
}

/** 〔12〕 或兼容 [S12] */
export const SOURCE_CITE_RE = /〔(\d+)〕|\[S(\d+)\]/g;

export function citeMark(no: number): string {
  return `〔${no}〕`;
}

export function parseCiteNos(text: string): number[] {
  const out: number[] = [];
  const re = new RegExp(SOURCE_CITE_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text || ""))) {
    const n = Number(m[1] || m[2]);
    if (Number.isFinite(n) && !out.includes(n)) out.push(n);
  }
  return out;
}

/** 去掉「待双端」字样，改为出处编号（默认 TE=1；含「二级」时加 10） */
export function replacePendingDualWithCites(text: string): string {
  if (!text) return text;
  let s = text;
  s = s.replace(/·二级·待双端/g, `·二级${citeMark(10)}`);
  s = s.replace(/二级·待双端/g, `二级${citeMark(10)}`);
  s = s.replace(/·待双端/g, citeMark(1));
  s = s.replace(/待双端/g, citeMark(1));
  return s;
}

function researchLibraryCitations(): SourceCitation[] {
  const start = 21;
  const rows: SourceCitation[] = [];
  let n = start;
  for (const report of INDUSTRY_RESEARCH_LIBRARY.reports || []) {
    const pack = (report.docKind || report.sourceType || "").includes("regulator") ||
      (report.docKind || "") === "regulator_pack" ||
      (report.docKind || "") === "market_stats_relay";
    rows.push({
      no: n++,
      id: `report:${report.id}`,
      title: report.title,
      kind: pack ? "regulator" : "research",
      asOf: report.asOf,
      reportId: report.id,
      note: `${pack ? "监管/信源包" : "研报"} · ${report.publisher} · ${report.period}`,
    });
    for (const src of report.sources || []) {
      rows.push({
        no: n++,
        id: src.id,
        title: src.title,
        kind:
          src.type.includes("regulator")
            ? "regulator"
            : src.type.includes("news")
              ? "news"
              : src.type.includes("research") || src.type.includes("third_party")
                ? "research"
                : pack
                  ? "regulator"
                  : "research",
        url: src.url,
        asOf: src.asOf,
        reportId: report.id,
        note: (src.bullets || []).slice(0, 2).join("；"),
      });
    }
  }
  return rows;
}

let _catalog: SourceCitation[] | null = null;

export function getSourceCitationCatalog(): SourceCitation[] {
  if (_catalog) return _catalog;
  const byNo = new Map<number, SourceCitation>();
  for (const c of CORE_SOURCE_CITATIONS) byNo.set(c.no, c);
  for (const c of researchLibraryCitations()) {
    if (!byNo.has(c.no)) byNo.set(c.no, c);
  }
  _catalog = [...byNo.values()].sort((a, b) => a.no - b.no);
  return _catalog;
}

export function getSourceCitation(no: number): SourceCitation | undefined {
  return getSourceCitationCatalog().find((c) => c.no === no);
}

export function findSourceCitationById(id: string): SourceCitation | undefined {
  return getSourceCitationCatalog().find((c) => c.id === id);
}

/** 研报库 source.id → 编号（供正文手写对照） */
export function citeNoForSourceId(id: string): number | undefined {
  return findSourceCitationById(id)?.no;
}
