import { citeMark, parseCiteNos } from "./sourceCitations";

/** 宏观字段 → 默认信源编号（正文无〔n〕时补；多源并存时再追加扫描） */
const FIELD_DEFAULT_CITES: Record<string, number[]> = {
  gdpYoY: [1],
  gdpUsdBn: [1],
  gdpPerCapitaUsd: [1],
  inflation: [1],
  policyRate: [1],
  unemployment: [1],
  population: [1],
  consumerConfidence: [1],
  fxTrend: [1],
  fxHint: [1],
  debtToGdp: [1],
  currentAccount: [1],
  fxReserves: [1],
  privCreditOrConsumer: [1],
  sectorMix: [1],
  incomePerCapita: [10, 15],
  householdDebtToGdp: [14],
  fxVolInYear: [13],
  employedToPop: [10],
  employmentNote: [1],
  ageStructure: [8],
  creditNote: [],
};

/** 从读数文案抽时点/时段 */
export function extractMacroAsOf(text?: string): string | undefined {
  if (!text) return undefined;
  const t = text.trim();
  // （2026-06）/（2025-Q4）/（2025）
  const paren = t.match(/（((?:19|20)\d{2}(?:[-–/.](?:Q[1-4]|\d{1,2})?)?)）/);
  if (paren) return paren[1];
  // 2024–2025 / 2025-07..2026-08
  const range = t.match(/((?:19|20)\d{2})\s*[–\-/.]{1,2}\s*((?:19|20)\d{2}(?:[-–/.]\d{1,2})?)/);
  if (range) return `${range[1]}–${range[2]}`;
  // ·2026-08· / TE货币·2026-08
  const dot = t.match(/(?:^|[·・\s])((?:19|20)\d{2}(?:[-–/.](?:Q[1-4]|\d{1,2})?))(?=[·・\s）)]|$)/);
  if (dot) return dot[1];
  // 裸年
  const year = t.match(/\b((?:19|20)\d{2})\b/);
  if (year) return year[1];
  return undefined;
}

/** 文案关键词 → 信源编号 */
export function scanMacroCiteHints(text?: string): number[] {
  if (!text) return [];
  const out: number[] = [];
  const add = (n: number) => {
    if (!out.includes(n)) out.push(n);
  };
  const s = text;
  if (/Trading\s*Economics|\bTE\b|TE货币|TE印尼|TE中国|TE菲律宾/i.test(s)) add(1);
  if (/点点/.test(s)) add(2);
  if (/墨腾|Momentum\s*Works/i.test(s)) add(3);
  if (/\bOJK\b|POJK|LPBBTI/i.test(s)) add(4);
  if (/\bBSP\b/i.test(s)) add(5);
  if (/\bSEC\b.*Phil|SEC Philippines/i.test(s)) add(6);
  if (/Research\s*and\s*Markets|\bR&M\b/i.test(s)) add(7);
  if (/\bIMF\b|\bWEO\b|联合国/i.test(s)) add(8);
  if (/中国货币网|chinamoney/i.test(s)) add(9);
  if (/世界银行|世行|World\s*Bank|\bWB\b/i.test(s)) add(10);
  if (/Bisnis\.com|bisnis/i.test(s)) add(11);
  if (/Detik/i.test(s)) add(12);
  if (/Frankfurter/i.test(s)) add(13);
  if (/\bBIS\b|WS_TC/i.test(s) && !/无BIS/.test(s)) add(14);
  if (/\bOWID\b|Our\s*World\s*in\s*Data/i.test(s)) add(15);
  if (/ILO/i.test(s)) add(10);
  return out;
}

export function inferMacroCiteNos(field: string, text?: string): number[] {
  const fromMarks = parseCiteNos(text || "");
  const fromHints = scanMacroCiteHints(text);
  let defaults = FIELD_DEFAULT_CITES[field] || [1];
  // 文案明确无 BIS 标准序列时，勿默认挂 〔14〕
  if (field === "householdDebtToGdp" && /无BIS/.test(text || "")) {
    defaults = [1];
  }
  const merged: number[] = [];
  const add = (n: number) => {
    if (Number.isFinite(n) && !merged.includes(n)) merged.push(n);
  };
  for (const n of fromMarks) add(n);
  for (const n of fromHints) add(n);
  // 已有显式出处时仍并上字段默认主源（如收入默认世行+OWID）
  if (fromMarks.length === 0) {
    for (const n of defaults) add(n);
  }
  return merged.sort((a, b) => a - b);
}

export function appendCiteMarks(text: string, nos: number[]): string {
  let s = (text || "").trim();
  if (!s || !nos.length) return s;
  const have = new Set(parseCiteNos(s));
  const missing = nos.filter((n) => !have.has(n));
  if (!missing.length) return s;
  return `${s}${missing.map(citeMark).join("")}`;
}

export type MacroProvenance = {
  /** 展示用读数（已补 〔n〕） */
  value: string;
  /** 时点或时段 */
  asOf?: string;
  citeNos: number[];
  /** 时点是否从国别对照包兜底 */
  asOfFromSnap?: boolean;
};

/** 单字段：抽出时点 + 补信源编号 */
export function enrichMacroField(
  field: string,
  raw: string | undefined,
  snapAsOf?: string,
): MacroProvenance | null {
  const v0 = (raw || "").trim();
  if (!v0) return null;
  const citeNos = inferMacroCiteNos(field, v0);
  const value = appendCiteMarks(v0, citeNos);
  let asOf = extractMacroAsOf(v0);
  let asOfFromSnap = false;
  if (!asOf && snapAsOf) {
    const pack = snapAsOf.match(/((?:19|20)\d{2}(?:[-–/.]\d{1,2})?)/);
    asOf = pack ? `${pack[1]}对照包` : snapAsOf.replace(/对照·.*/, "对照包").trim();
    asOfFromSnap = true;
  }
  return { value, asOf, citeNos, asOfFromSnap };
}

/** 国别快照内全部编号（供底部信源区） */
export function collectMacroCiteNos(
  fields: Array<{ value?: string; citeNos?: number[] }>,
  extraTexts: Array<string | undefined> = [],
): number[] {
  const out: number[] = [];
  const add = (n: number) => {
    if (Number.isFinite(n) && !out.includes(n)) out.push(n);
  };
  for (const f of fields) {
    for (const n of f.citeNos || parseCiteNos(f.value || "")) add(n);
  }
  for (const t of extraTexts) {
    for (const n of parseCiteNos(t || "")) add(n);
    for (const n of scanMacroCiteHints(t)) add(n);
  }
  return out.sort((a, b) => a - b);
}

/** 对照包 asOf 文案里的信源提示 → 编号 */
export function citeNosFromSnapAsOf(asOf?: string): number[] {
  return scanMacroCiteHints(asOf);
}
