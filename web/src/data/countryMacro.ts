import raw from "./country-macro.json";

export type CountryMacroSnap = {
  asOf?: string;
  gdpYoY?: string;
  gdpUsdBn?: string;
  gdpPerCapitaUsd?: string;
  incomePerCapita?: string;
  inflation?: string;
  policyRate?: string;
  unemployment?: string;
  population?: string;
  ageStructure?: string;
  employmentNote?: string;
  employedToPop?: string;
  sectorMix?: string;
  currentAccount?: string;
  fxReserves?: string;
  fxTrend?: string;
  fxVolInYear?: string;
  privCreditOrConsumer?: string;
  fxHint?: string;
  debtToGdp?: string;
  householdDebtToGdp?: string;
  consumerConfidence?: string;
  creditNote?: string;
  cashLoanVerdict?: string;
};

export const COUNTRY_MACRO = raw as Record<string, CountryMacroSnap>;

export function getCountryMacro(code: string): CountryMacroSnap | undefined {
  return COUNTRY_MACRO[code];
}

/** 批量灌库时的套话；各国相同，展示时无国别信息量 */
export const GENERIC_CREDIT_NOTE =
  "信贷过热组：家庭债务/非银增速/NPL/多头以监管与征信续核；此处为TE可核验水位。";

export function isGenericCreditNote(note?: string | null): boolean {
  const n = (note || "").trim();
  return !n || n === GENERIC_CREDIT_NOTE;
}

/** 仅展示有国别增量的补充；套话不占版面 */
export function displayCreditNote(snap: Pick<CountryMacroSnap, "creditNote">): string | undefined {
  const n = snap.creditNote?.trim();
  if (!n || isGenericCreditNote(n)) return undefined;
  return n;
}

function firstNumber(s?: string | null): number | null {
  if (!s) return null;
  const m = s.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function fmtNum(n: number, digits = 1): string {
  if (Math.abs(n) >= 100) return String(Math.round(n));
  const t = n.toFixed(digits);
  return t.replace(/\.0$/, "");
}

/**
 * 按该国实际读数拼现金贷准入简评（避免「点哪国都一样」的模板句）。
 * 库内 cashLoanVerdict 多为灌库套话，展示优先用本函数。
 */
export function synthesizeCashLoanBrief(snap: CountryMacroSnap): string {
  const bits: string[] = [];

  const gdpPc = firstNumber(snap.gdpPerCapitaUsd);
  if (gdpPc != null) {
    if (gdpPc < 2000) bits.push(`人均GDP约${fmtNum(gdpPc, 0)}美元（＜2000慎入带）`);
    else if (gdpPc >= 12000) bits.push(`人均GDP约${fmtNum(gdpPc, 0)}美元（过成熟阈值）`);
    else bits.push(`人均GDP约${fmtNum(gdpPc, 0)}美元（中等收入带）`);
  }

  const infl = firstNumber(snap.inflation);
  if (infl != null) {
    if (infl >= 12) bits.push(`通胀约${fmtNum(infl)}%（破12%高压）`);
    else if (infl >= 6) bits.push(`通胀约${fmtNum(infl)}%（偏高）`);
    else bits.push(`通胀约${fmtNum(infl)}%`);
  }

  const rate = firstNumber(snap.policyRate);
  if (rate != null) {
    if (rate >= 10) bits.push(`政策利率约${fmtNum(rate)}%（高息）`);
    else bits.push(`政策利率约${fmtNum(rate)}%`);
  }

  const hh = firstNumber(snap.householdDebtToGdp);
  if (hh != null) {
    if (hh >= 60) bits.push(`家庭债务/GDP约${fmtNum(hh)}%（杠杆偏高）`);
    else if (hh >= 35) bits.push(`家庭债务/GDP约${fmtNum(hh)}%`);
  }

  const ca = snap.currentAccount || "";
  const caM = ca.match(/CA\/GDP约?\s*(-?\d+(?:\.\d+)?)\s*%/i);
  if (caM) {
    const v = Number(caM[1]);
    if (v <= -5) bits.push(`经常账户逆差约${fmtNum(v)}%GDP`);
    else if (v >= 5) bits.push(`经常账户顺差约${fmtNum(v)}%GDP`);
  }

  const gdpYoY = firstNumber(snap.gdpYoY);
  if (gdpYoY != null) {
    if (gdpYoY < 1) bits.push(`GDP同比约${fmtNum(gdpYoY)}%（偏弱）`);
    else if (gdpYoY >= 7) bits.push(`GDP同比约${fmtNum(gdpYoY)}%（偏强）`);
  }

  const unemp = firstNumber(snap.unemployment);
  if (unemp != null && unemp >= 8) bits.push(`失业率约${fmtNum(unemp)}%（破8%）`);

  if (!bits.length) {
    const stored = snap.cashLoanVerdict?.trim();
    if (stored && !/准入先过牌照\/利率上限与锁汇评估/.test(stored)) return stored;
    return "宏观关键读数不足，仍按总表决策序：监管基建→外汇→人口收入→信贷过热→投后压测。";
  }

  return `${bits.slice(0, 5).join("；")}。准入仍先验牌照/利率上限与锁汇（总表决策序）。`;
}
