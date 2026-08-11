import raw from "./equity-investor-roster.json";

/** 股权投资人细分（CSV investor_type 映射） */
export type EquityInvestorKind =
  | "PE"
  | "VC"
  | "战略"
  | "银行财务投资人"
  | "信贷基金"
  | "其他";

export type EquityInvestorRosterRow = {
  name: string;
  geography: string;
  investorTypeRaw: string;
  equityKind: EquityInvestorKind;
  comment: string;
  region: string;
  countries: string;
  locCode: string;
};

export const EQUITY_INVESTOR_ROSTER = raw as {
  meta: { source: string; asOf: string; count: number; note: string };
  rows: EquityInvestorRosterRow[];
};

export const EQUITY_KIND_ORDER: EquityInvestorKind[] = [
  "PE",
  "VC",
  "战略",
  "银行财务投资人",
  "信贷基金",
  "其他",
];

export const EQUITY_KIND_LABEL: Record<EquityInvestorKind, string> = {
  PE: "PE",
  VC: "VC",
  战略: "战略",
  银行财务投资人: "银行财务投资人",
  信贷基金: "信贷基金",
  其他: "其他",
};

export const EQUITY_KIND_BLURB: Record<EquityInvestorKind, string> = {
  PE: "私募股权（偏成长期/控制权或大额支票）。",
  VC: "风险投资（偏早期/成长）。",
  战略: "产业/平台战略投资人（含金融科技战略方）。",
  银行财务投资人: "银行体系财务投资/战略入股（非本地联合贷资金方主档）。",
  信贷基金: "信贷/特种机会类基金作为股权或准股权参与方。",
  其他: "未归入上列的投资人类型。",
};

/**
 * CSV 名 → 已有 CRM group 键（只打「股权投资人」标签，不建重档）。
 * 仅高置信别名；子串易误伤的不写。
 */
export const EQUITY_MATCH_TO_GROUP: Record<string, string> = {
  Affirm: "Affirm（Affirm·US）",
  "Amazon Lending": "Amazon/Amazon（亚马逊·US）",
  Amazon: "Amazon/Amazon（亚马逊·US）",
  Flipkart: "Flipkart/Flipkart（Flipkart·IN）",
  Klarna: "Klarna（Klarna·EU）",
  LendingTree: "LendingTree｜LendingTree｜LendingTree（流量服务商·贷超·US）",
  "Mercado Libre": "Mercado Libre/Mercado Libre（美卡多·LATAM）",
  NuBank: "Nubank（Nubank·BR）",
  Nubank: "Nubank（Nubank·BR）",
  "Upstart Holdings": "Upstart（Upstart·US）",
  Upstart: "Upstart（Upstart·US）",
  Finvolution: "FinVolution/信也（信也·CN）",
  FinVolution: "FinVolution/信也（信也·CN）",
  "Lexin Fintech": "乐信/分期乐/Lexin（乐信·CN）",
  Lexin: "乐信/分期乐/Lexin（乐信·CN）",
  "GoTo Group": "GoTo/Gojek（GoTo·ID）",
  GoTo: "GoTo/Gojek（GoTo·ID）",
  "Google / CapitalG": "Google｜Google Ads｜Alphabet（流量服务商·流量平台·US）",
  CapitalG: "Google｜Google Ads｜Alphabet（流量服务商·流量平台·US）",
  Grab: "Grab Holdings/Grab（Grab·SEA）",
  Shopee: "Sea Limited/Shopee（Sea·SEA）",
  "Sea Limited": "Sea Limited/Shopee（Sea·SEA）",
  Ant: "蚂蚁集团/支付宝（蚂蚁·CN）",
  "Ant Group": "蚂蚁集团/支付宝（蚂蚁·CN）",
  Tencent: "腾讯控股/微信（腾讯·CN）",
  Baidu: "度小满｜有钱花｜百度（度小满·CN）",
  // Adyen / PayPal：CRM 尚无独立信贷主体档，走新建股权投资人种子
};

export function equityMatchGroup(csvName: string): string | undefined {
  const direct = EQUITY_MATCH_TO_GROUP[csvName];
  if (direct) return direct;
  const lower = csvName.trim().toLowerCase();
  for (const [k, g] of Object.entries(EQUITY_MATCH_TO_GROUP)) {
    if (k.toLowerCase() === lower) return g;
  }
  return undefined;
}
