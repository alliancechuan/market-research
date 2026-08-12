import raw from "./fintech-stock-source-links.json";

export type FintechStockSourceHub = {
  id: string;
  titleZh: string;
  url?: string | null;
  kind: string;
  citeNo?: number;
  note?: string;
};

export type FintechStockExchangePortal = {
  name: string;
  url: string;
};

export type FintechStockCompanyLink = {
  id: string;
  nameZh: string;
  symbol?: string;
  yahoo?: string;
  yahooUrl?: string;
  exchange?: string;
  exchangeUrl?: string;
  region?: string;
  origin?: string;
  irUrl?: string | null;
  period?: string;
  sourceNote?: string;
};

export type FintechStockSourceLinksFile = {
  asOf: string;
  note?: string;
  dataKeys?: string[];
  hubs: FintechStockSourceHub[];
  exchanges: FintechStockExchangePortal[];
  companies: FintechStockCompanyLink[];
  stats?: { companies: number; withIr: number; exchanges: number };
};

export const FINTECH_STOCK_SOURCE_LINKS = raw as FintechStockSourceLinksFile;

export function fintechStockCompanyLinksAll(): FintechStockCompanyLink[] {
  return FINTECH_STOCK_SOURCE_LINKS.companies || [];
}

export function fintechStockCompanyLinksWithIr(): FintechStockCompanyLink[] {
  return fintechStockCompanyLinksAll().filter((c) => !!c.irUrl);
}
