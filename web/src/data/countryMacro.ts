import raw from "./country-macro.json";
import {
  collectMacroCiteNos,
  citeNosFromSnapAsOf,
  enrichMacroField,
} from "./macroFieldProvenance";

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
  /** 零售汽油（泵价，优先 USD/升） */
  gasolineRetail?: string;
  /** 居民电价（含税，优先 USD/kWh） */
  electricityResidential?: string;
  /**
   * 油电比 = 零售汽油(USD/升) ÷ 居民电价(USD/kWh)
   * 含义：买 1 升汽油约等于可购多少 kWh 居民电；越高燃油相对电费越贵
   */
  fuelToPowerRatio?: string;
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

  const gas = firstNumber(snap.gasolineRetail);
  if (gas != null && gas >= 2) bits.push(`零售汽油约${fmtNum(gas, 2)}美元/升（偏高）`);

  const elec = firstNumber(snap.electricityResidential);
  if (elec != null && elec >= 0.25) bits.push(`居民电价约${fmtNum(elec, 3)}美元/kWh（偏高）`);

  const ftp = firstNumber(snap.fuelToPowerRatio);
  if (ftp != null && ftp >= 20) bits.push(`油电比约${fmtNum(ftp, 1)}×（燃油相对电费偏贵）`);

  if (!bits.length) {
    const stored = snap.cashLoanVerdict?.trim();
    if (stored && !/准入先过牌照\/利率上限与锁汇评估/.test(stored)) return stored;
    return "宏观关键读数不足，仍按总表决策序：监管基建→外汇→人口收入→信贷过热→投后压测。";
  }

  return `${bits.slice(0, 5).join("；")}。准入仍先验牌照/利率上限与锁汇（总表决策序）。`;
}

export type CashLoanMacroMetric = {
  label: string;
  value: string;
  /** 时点或时段（读数内抽取，缺则对照包兜底） */
  asOf?: string;
  /** 统一信源编号 〔n〕 */
  citeNos?: number[];
  /** 时点是否来自国别对照包而非字段自身 */
  asOfFromSnap?: boolean;
  /** watch=留意 hot=高压 ok=偏稳 */
  flag?: "watch" | "hot" | "ok";
};

/** 按现金贷决策序排列的国别宏观组（①监管在监管页，此处从②起） */
export type CashLoanMacroGroup = {
  id: string;
  step: string;
  title: string;
  /** 指标对消费信贷/现金贷的直接用途 */
  soWhat: string;
  metrics: CashLoanMacroMetric[];
};

function metric(
  label: string,
  field: keyof CountryMacroSnap,
  raw: string | undefined,
  snapAsOf: string | undefined,
  flag?: CashLoanMacroMetric["flag"],
): CashLoanMacroMetric | null {
  const enriched = enrichMacroField(field, raw, snapAsOf);
  if (!enriched) return null;
  return {
    label,
    value: enriched.value,
    asOf: enriched.asOf,
    citeNos: enriched.citeNos,
    asOfFromSnap: enriched.asOfFromSnap,
    flag,
  };
}

/**
 * 把国别快照按「消费信贷怎么用」分组，便于卡片上直接读业务含义。
 * 决策序：①监管基建（本函数不含）→②汇兑→③客群偿还→④信贷过热→⑤景气定价压测。
 * 每条读数带时点/时段与 〔n〕，底部可汇总进统一信源目录。
 */
export function buildCashLoanMacroGroups(snap: CountryMacroSnap): CashLoanMacroGroup[] {
  const pack = snap.asOf;
  const gdpPc = firstNumber(snap.gdpPerCapitaUsd);
  const infl = firstNumber(snap.inflation);
  const rate = firstNumber(snap.policyRate);
  const hh = firstNumber(snap.householdDebtToGdp);
  const unemp = firstNumber(snap.unemployment);
  const gdpYoY = firstNumber(snap.gdpYoY);
  const gas = firstNumber(snap.gasolineRetail);
  const elec = firstNumber(snap.electricityResidential);
  const ftp = firstNumber(snap.fuelToPowerRatio);
  const fxVol = firstNumber(snap.fxVolInYear?.replace("±", ""));
  const caM = (snap.currentAccount || "").match(/CA\/GDP约?\s*(-?\d+(?:\.\d+)?)\s*%/i);
  const ca = caM ? Number(caM[1]) : null;

  const fxFlag: CashLoanMacroMetric["flag"] =
    fxVol != null && fxVol >= 12 ? "hot" : fxVol != null && fxVol >= 6 ? "watch" : fxVol != null ? "ok" : undefined;
  const inflFlag: CashLoanMacroMetric["flag"] =
    infl != null && infl >= 12 ? "hot" : infl != null && infl >= 6 ? "watch" : infl != null ? "ok" : undefined;
  const hhFlag: CashLoanMacroMetric["flag"] =
    hh != null && hh >= 55 ? "hot" : hh != null && hh >= 45 ? "watch" : hh != null ? "ok" : undefined;
  const gdpPcFlag: CashLoanMacroMetric["flag"] =
    gdpPc != null && gdpPc < 2000 ? "hot" : gdpPc != null && gdpPc >= 12000 ? "watch" : gdpPc != null ? "ok" : undefined;
  const gasFlag: CashLoanMacroMetric["flag"] =
    gas != null && gas >= 3 ? "hot" : gas != null && gas >= 2 ? "watch" : gas != null ? "ok" : undefined;
  const elecFlag: CashLoanMacroMetric["flag"] =
    elec != null && elec >= 0.3 ? "hot" : elec != null && elec >= 0.2 ? "watch" : elec != null ? "ok" : undefined;
  const ftpFlag: CashLoanMacroMetric["flag"] =
    ftp != null && ftp >= 25 ? "hot" : ftp != null && ftp >= 15 ? "watch" : ftp != null ? "ok" : undefined;

  const groups: CashLoanMacroGroup[] = [
    {
      id: "fx_cross",
      step: "②",
      title: "汇兑与跨境",
      soWhat: "能不能锁汇、资金进出是否顺；波幅大则定价与拨备要留汇兑缓冲。",
      metrics: [
        metric("外汇储备", "fxReserves", snap.fxReserves, pack),
        metric(
          "经常账户",
          "currentAccount",
          snap.currentAccount,
          pack,
          ca != null && ca <= -5 ? "hot" : ca != null && ca < 0 ? "watch" : ca != null ? "ok" : undefined,
        ),
        metric("年内汇率波动", "fxVolInYear", snap.fxVolInYear, pack, fxFlag),
        metric("汇率水平", snap.fxTrend ? "fxTrend" : "fxHint", snap.fxTrend || snap.fxHint, pack),
        metric("政策利率", "policyRate", snap.policyRate, pack, rate != null && rate >= 10 ? "watch" : undefined),
      ].filter(Boolean) as CashLoanMacroMetric[],
    },
    {
      id: "borrower",
      step: "③",
      title: "客群与偿还",
      soWhat: "谁在借、收入稳不稳；就业弱/一产高则逾期季节性与收入波动更大。",
      metrics: [
        metric("总人口", "population", snap.population, pack),
        metric("年龄结构", "ageStructure", snap.ageStructure, pack),
        metric("失业率", "unemployment", snap.unemployment, pack, unemp != null && unemp >= 8 ? "hot" : undefined),
        metric("就业/人口", "employedToPop", snap.employedToPop, pack),
        metric("人均收入", "incomePerCapita", snap.incomePerCapita, pack),
        metric("人均GDP", "gdpPerCapitaUsd", snap.gdpPerCapitaUsd, pack, gdpPcFlag),
        metric("三产结构", "sectorMix", snap.sectorMix, pack),
        metric("消费者信心", "consumerConfidence", snap.consumerConfidence, pack),
        metric("就业备注", "employmentNote", snap.employmentNote, pack),
      ].filter(Boolean) as CashLoanMacroMetric[],
    },
    {
      id: "credit_heat",
      step: "④",
      title: "信贷过热",
      soWhat: "市场还能不能加杠杆；居民杠杆近过热带则新客与额度应更紧。",
      metrics: [
        metric("居民杠杆率", "householdDebtToGdp", snap.householdDebtToGdp, pack, hhFlag),
        metric("消费/私营信贷", "privCreditOrConsumer", snap.privCreditOrConsumer, pack),
        metric("政府债务/GDP", "debtToGdp", snap.debtToGdp, pack),
      ].filter(Boolean) as CashLoanMacroMetric[],
    },
    {
      id: "stress",
      step: "⑤",
      title: "景气与定价压测",
      soWhat: "定价锚与贷后压测：高息高通胀抬资金成本，能源生活成本抬升伤还款现金流，GDP偏弱则vintage更易恶化。",
      metrics: [
        metric("GDP同比", "gdpYoY", snap.gdpYoY, pack, gdpYoY != null && gdpYoY < 1 ? "watch" : undefined),
        metric("通胀", "inflation", snap.inflation, pack, inflFlag),
        metric("零售汽油", "gasolineRetail", snap.gasolineRetail, pack, gasFlag),
        metric("居民电价", "electricityResidential", snap.electricityResidential, pack, elecFlag),
        metric("油电比", "fuelToPowerRatio", snap.fuelToPowerRatio, pack, ftpFlag),
        metric("政策利率", "policyRate", snap.policyRate, pack, rate != null && rate >= 10 ? "hot" : undefined),
      ].filter(Boolean) as CashLoanMacroMetric[],
    },
  ];

  return groups.filter((g) => g.metrics.length > 0);
}

/** 国别宏观卡用到的全部信源编号（指标 + 补充 + 对照包提示） */
export function collectCountryMacroCiteNos(snap: CountryMacroSnap): number[] {
  const groups = buildCashLoanMacroGroups(snap);
  const metrics = groups.flatMap((g) => g.metrics);
  const note = displayCreditNote(snap);
  const packCites = citeNosFromSnapAsOf(snap.asOf).map((n) => ({ citeNos: [n] }));
  return collectMacroCiteNos([...metrics, ...packCites], [note, snap.creditNote, snap.asOf, snap.cashLoanVerdict]);
}
