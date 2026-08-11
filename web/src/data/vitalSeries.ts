import raw from "./births-deaths-by-country.json";

export type VitalYearRow = {
  y: number;
  b?: number;
  d?: number;
  cbr?: number;
  cdr?: number;
};

export type VitalCountry = {
  iso3: string;
  latest: VitalYearRow;
  series: VitalYearRow[];
};

type VitalFile = {
  meta: {
    unit: string;
    source: string;
    note: string;
    year_min: number;
    year_max: number;
    asOf: string;
  };
  by_code: Record<string, VitalCountry>;
};

export const VITAL_FILE = raw as VitalFile;

/** 默认入职/退休年龄（队列推算；非官方参保退休人数） */
export const LABOR_FLOW_AGES = { entry: 18, retire: 65 } as const;

/**
 * 国别入职年龄覆盖（劳动法最低劳动年龄示意）。
 * MX：联邦劳动法允许 15 岁起在限制条件下劳动。
 */
export const COUNTRY_ENTRY_AGE: Partial<Record<string, number>> = {
  MX: 15,
};

export function entryAgeForCountry(code: string): number {
  return COUNTRY_ENTRY_AGE[code] ?? LABOR_FLOW_AGES.entry;
}

export function getVitalCountry(code: string): VitalCountry | null {
  return VITAL_FILE.by_code[code] ?? null;
}

function birthsInYear(byYear: Map<number, number>, y: number): number | null {
  return byYear.has(y) ? (byYear.get(y) as number) : null;
}

export function birthIndex(series: VitalYearRow[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const r of series) {
    if (r.b != null) m.set(r.y, r.b);
  }
  return m;
}

/**
 * 劳动进出流量（由出生队列推算，暂不使用死亡）：
 * - entrants(Y) = births(Y − entryAge)
 * - retirees(Y) = births(Y − retireAge)
 * - net(Y) = entrants − retirees
 */
export type LaborFlowRow = {
  y: number;
  entrants: number | null;
  retirees: number | null;
  net: number | null;
};

export function buildLaborFlowSeries(
  series: VitalYearRow[],
  opts?: { entryAge?: number; retireAge?: number; fromYear?: number; toYear?: number },
): LaborFlowRow[] {
  const entryAge = opts?.entryAge ?? LABOR_FLOW_AGES.entry;
  const retireAge = opts?.retireAge ?? LABOR_FLOW_AGES.retire;
  const idx = birthIndex(series);
  const years = [...idx.keys()].sort((a, b) => a - b);
  if (years.length === 0) return [];
  const lastBirth = years[years.length - 1]!;
  const yMin = opts?.fromYear ?? years[0]! + retireAge;
  // 默认可推到「最末出生年 + entryAge」，以便用已落库出生队列看未来入职
  const yMax = opts?.toYear ?? lastBirth + entryAge;
  const out: LaborFlowRow[] = [];
  for (let y = yMin; y <= yMax; y++) {
    const entrants = birthsInYear(idx, y - entryAge);
    const retirees = birthsInYear(idx, y - retireAge);
    if (entrants == null && retirees == null) continue;
    out.push({
      y,
      entrants,
      retirees,
      net: entrants != null && retirees != null ? entrants - retirees : null,
    });
  }
  return out;
}

/** 自 asOfYear 翌年起，预测未来 n 年劳动净增（入职−退休） */
export function forecastLaborNet(
  series: VitalYearRow[],
  opts: { entryAge?: number; retireAge?: number; asOfYear: number; years?: number },
): LaborFlowRow[] {
  const n = opts.years ?? 10;
  const fromYear = opts.asOfYear + 1;
  return buildLaborFlowSeries(series, {
    entryAge: opts.entryAge,
    retireAge: opts.retireAge,
    fromYear,
    toYear: fromYear + n - 1,
  });
}

/**
 * 国别实际就业存量锚点（人）。用于校准「队列净增 → 就业变动」系数。
 * 多数国：世行就业人口比(15+)×15+人口推算，与宏观卡 employedToPop 分子对齐；TW 为台主计处粗算。
 */
export const COUNTRY_EMPLOYED_STOCK: Partial<
  Record<string, { employed: number; asOfYear: number; note: string }>
> = {
  AE: {
    employed: 7077169,
    asOfYear: 2024,
    note: "约0.071亿·世行就业人口比推算(2024)",
  },
  AO: {
    employed: 13573939,
    asOfYear: 2024,
    note: "约0.136亿·世行就业人口比推算(2024)",
  },
  AR: {
    employed: 20576940,
    asOfYear: 2024,
    note: "约0.206亿·世行就业人口比推算(2024)",
  },
  BD: {
    employed: 70943483,
    asOfYear: 2024,
    note: "约0.709亿·世行就业人口比推算(2024)",
  },
  BF: {
    employed: 9271510,
    asOfYear: 2024,
    note: "约0.093亿·世行就业人口比推算(2024)",
  },
  BH: {
    employed: 901395,
    asOfYear: 2024,
    note: "约0.009亿·世行就业人口比推算(2024)",
  },
  BJ: {
    employed: 6341686,
    asOfYear: 2024,
    note: "约0.063亿·世行就业人口比推算(2024)",
  },
  BR: {
    employed: 100534963,
    asOfYear: 2024,
    note: "约1.005亿·世行就业人口比推算(2024)",
  },
  BW: {
    employed: 893933,
    asOfYear: 2024,
    note: "约0.009亿·世行就业人口比推算(2024)",
  },
  CA: {
    employed: 21235847,
    asOfYear: 2024,
    note: "约0.212亿·世行就业人口比推算(2024)",
  },
  CD: {
    employed: 36306232,
    asOfYear: 2024,
    note: "约0.363亿·世行就业人口比推算(2024)",
  },
  CI: {
    employed: 12383563,
    asOfYear: 2024,
    note: "约0.124亿·世行就业人口比推算(2024)",
  },
  CL: {
    employed: 9332206,
    asOfYear: 2024,
    note: "约0.093亿·世行就业人口比推算(2024)",
  },
  CM: {
    employed: 10772807,
    asOfYear: 2024,
    note: "约0.108亿·世行就业人口比推算(2024)",
  },
  CN: {
    employed: 732909368,
    asOfYear: 2024,
    note: "约7.329亿·世行就业人口比推算(2024)",
  },
  CO: {
    employed: 24210403,
    asOfYear: 2024,
    note: "约0.242亿·世行就业人口比推算(2024)",
  },
  DE: {
    employed: 42312020,
    asOfYear: 2024,
    note: "约0.423亿·世行就业人口比推算(2024)",
  },
  DZ: {
    employed: 11860154,
    asOfYear: 2024,
    note: "约0.119亿·世行就业人口比推算(2024)",
  },
  EG: {
    employed: 32934063,
    asOfYear: 2024,
    note: "约0.329亿·世行就业人口比推算(2024)",
  },
  ES: {
    employed: 21799642,
    asOfYear: 2024,
    note: "约0.218亿·世行就业人口比推算(2024)",
  },
  ET: {
    employed: 53250242,
    asOfYear: 2024,
    note: "约0.533亿·世行就业人口比推算(2024)",
  },
  FR: {
    employed: 29502301,
    asOfYear: 2024,
    note: "约0.295亿·世行就业人口比推算(2024)",
  },
  GA: {
    employed: 661258,
    asOfYear: 2024,
    note: "约0.007亿·世行就业人口比推算(2024)",
  },
  GB: {
    employed: 33777253,
    asOfYear: 2024,
    note: "约0.338亿·世行就业人口比推算(2024)",
  },
  GH: {
    employed: 12681206,
    asOfYear: 2024,
    note: "约0.127亿·世行就业人口比推算(2024)",
  },
  ID: {
    employed: 140405724,
    asOfYear: 2024,
    note: "约1.404亿·世行就业人口比推算(2024)",
  },
  IE: {
    employed: 2517864,
    asOfYear: 2024,
    note: "约0.025亿·世行就业人口比推算(2024)",
  },
  IL: {
    employed: 4584388,
    asOfYear: 2024,
    note: "约0.046亿·世行就业人口比推算(2024)",
  },
  IN: {
    employed: 583106048,
    asOfYear: 2024,
    note: "约5.831亿·世行就业人口比推算(2024)",
  },
  IQ: {
    employed: 10278419,
    asOfYear: 2024,
    note: "约0.103亿·世行就业人口比推算(2024)",
  },
  IR: {
    employed: 26919909,
    asOfYear: 2024,
    note: "约0.269亿·世行就业人口比推算(2024)",
  },
  IT: {
    employed: 24082848,
    asOfYear: 2024,
    note: "约0.241亿·世行就业人口比推算(2024)",
  },
  JO: {
    employed: 2669503,
    asOfYear: 2024,
    note: "约0.027亿·世行就业人口比推算(2024)",
  },
  JP: {
    employed: 67763675,
    asOfYear: 2024,
    note: "约0.678亿·世行就业人口比推算(2024)",
  },
  KE: {
    employed: 22712811,
    asOfYear: 2024,
    note: "约0.227亿·世行就业人口比推算(2024)",
  },
  KG: {
    employed: 2710279,
    asOfYear: 2024,
    note: "约0.027亿·世行就业人口比推算(2024)",
  },
  KR: {
    employed: 29004896,
    asOfYear: 2024,
    note: "约0.290亿·世行就业人口比推算(2024)",
  },
  KW: {
    employed: 2882708,
    asOfYear: 2024,
    note: "约0.029亿·世行就业人口比推算(2024)",
  },
  KZ: {
    employed: 9769982,
    asOfYear: 2024,
    note: "约0.098亿·世行就业人口比推算(2024)",
  },
  LB: {
    employed: 1656551,
    asOfYear: 2023,
    note: "约0.017亿·世行就业人口比推算(2023)",
  },
  LK: {
    employed: 7952682,
    asOfYear: 2024,
    note: "约0.080亿·世行就业人口比推算(2024)",
  },
  LY: {
    employed: 2092398,
    asOfYear: 2024,
    note: "约0.021亿·世行就业人口比推算(2024)",
  },
  MA: {
    employed: 11359379,
    asOfYear: 2024,
    note: "约0.114亿·世行就业人口比推算(2024)",
  },
  MG: {
    employed: 16089693,
    asOfYear: 2024,
    note: "约0.161亿·世行就业人口比推算(2024)",
  },
  ML: {
    employed: 8596902,
    asOfYear: 2024,
    note: "约0.086亿·世行就业人口比推算(2024)",
  },
  MN: {
    employed: 1367128,
    asOfYear: 2024,
    note: "约0.014亿·世行就业人口比推算(2024)",
  },
  MU: {
    employed: 588049,
    asOfYear: 2024,
    note: "约0.006亿·世行就业人口比推算(2024)",
  },
  MX: {
    employed: 59257765,
    asOfYear: 2024,
    note: "约0.593亿·世行就业人口比推算(2024)",
  },
  MY: {
    employed: 17678023,
    asOfYear: 2024,
    note: "约0.177亿·世行就业人口比推算(2024)",
  },
  MZ: {
    employed: 14138062,
    asOfYear: 2024,
    note: "约0.141亿·世行就业人口比推算(2024)",
  },
  NA: {
    employed: 908834,
    asOfYear: 2024,
    note: "约0.009亿·世行就业人口比推算(2024)",
  },
  NG: {
    employed: 109871683,
    asOfYear: 2024,
    note: "约1.099亿·世行就业人口比推算(2024)",
  },
  NL: {
    employed: 9933203,
    asOfYear: 2024,
    note: "约0.099亿·世行就业人口比推算(2024)",
  },
  OM: {
    employed: 2628358,
    asOfYear: 2024,
    note: "约0.026亿·世行就业人口比推算(2024)",
  },
  PE: {
    employed: 17956811,
    asOfYear: 2024,
    note: "约0.180亿·世行就业人口比推算(2024)",
  },
  PH: {
    employed: 50177947,
    asOfYear: 2024,
    note: "约0.502亿·世行就业人口比推算(2024)",
  },
  PK: {
    employed: 78646758,
    asOfYear: 2024,
    note: "约0.786亿·世行就业人口比推算(2024)",
  },
  PL: {
    employed: 15631540,
    asOfYear: 2024,
    note: "约0.156亿·世行就业人口比推算(2024)",
  },
  PS: {
    employed: 1114237,
    asOfYear: 2022,
    note: "约0.011亿·世行就业人口比推算(2022)",
  },
  PT: {
    employed: 5095886,
    asOfYear: 2024,
    note: "约0.051亿·世行就业人口比推算(2024)",
  },
  QA: {
    employed: 2114173,
    asOfYear: 2024,
    note: "约0.021亿·世行就业人口比推算(2024)",
  },
  RW: {
    employed: 5029756,
    asOfYear: 2024,
    note: "约0.050亿·世行就业人口比推算(2024)",
  },
  SA: {
    employed: 16917110,
    asOfYear: 2024,
    note: "约0.169亿·世行就业人口比推算(2024)",
  },
  SD: {
    employed: 10420360,
    asOfYear: 2022,
    note: "约0.104亿·世行就业人口比推算(2022)",
  },
  SE: {
    employed: 4700720,
    asOfYear: 2024,
    note: "约0.047亿·世行就业人口比推算(2024)",
  },
  SN: {
    employed: 5764952,
    asOfYear: 2024,
    note: "约0.058亿·世行就业人口比推算(2024)",
  },
  TH: {
    employed: 40693279,
    asOfYear: 2024,
    note: "约0.407亿·世行就业人口比推算(2024)",
  },
  TJ: {
    employed: 2406354,
    asOfYear: 2024,
    note: "约0.024亿·世行就业人口比推算(2024)",
  },
  TM: {
    employed: 2077567,
    asOfYear: 2024,
    note: "约0.021亿·世行就业人口比推算(2024)",
  },
  TN: {
    employed: 3591187,
    asOfYear: 2024,
    note: "约0.036亿·世行就业人口比推算(2024)",
  },
  TR: {
    employed: 33205019,
    asOfYear: 2024,
    note: "约0.332亿·世行就业人口比推算(2024)",
  },
  TW: {
    employed: 11500000,
    asOfYear: 2024,
    note: "约0.115亿·台主计处量级粗算",
  },
  TZ: {
    employed: 32481132,
    asOfYear: 2024,
    note: "约0.325亿·世行就业人口比推算(2024)",
  },
  UG: {
    employed: 21963030,
    asOfYear: 2024,
    note: "约0.220亿·世行就业人口比推算(2024)",
  },
  US: {
    employed: 167161486,
    asOfYear: 2024,
    note: "约1.672亿·世行就业人口比推算(2024)",
  },
  UZ: {
    employed: 13813714,
    asOfYear: 2024,
    note: "约0.138亿·世行就业人口比推算(2024)",
  },
  VN: {
    employed: 55796009,
    asOfYear: 2024,
    note: "约0.558亿·世行就业人口比推算(2024)",
  },
  YE: {
    employed: 6583187,
    asOfYear: 2024,
    note: "约0.066亿·世行就业人口比推算(2024)",
  },
  ZA: {
    employed: 17852516,
    asOfYear: 2024,
    note: "约0.179亿·世行就业人口比推算(2024)",
  },
  ZM: {
    employed: 7268759,
    asOfYear: 2024,
    note: "约0.073亿·世行就业人口比推算(2024)",
  },
  ZW: {
    employed: 6032468,
    asOfYear: 2024,
    note: "约0.060亿·世行就业人口比推算(2024)",
  },
};

/** 适龄出生队列示意存量：出生年 ∈ [asOf−(retireAge−1), asOf−entryAge] 合计（未扣残存） */
export function cohortWorkingAgeStock(
  series: VitalYearRow[],
  asOfYear: number,
  entryAge: number,
  retireAge: number,
): number {
  const from = asOfYear - (retireAge - 1);
  const to = asOfYear - entryAge;
  const idx = birthIndex(series);
  let s = 0;
  for (let y = from; y <= to; y++) {
    const b = birthsInYear(idx, y);
    if (b != null) s += b;
  }
  return s;
}

/**
 * 就业折算系数 k = 实际就业 / 适龄出生队列示意存量
 * → Δ就业 ≈ k × (入职队列 − 退休队列)
 */
export function employmentConversionCoeff(
  series: VitalYearRow[],
  opts: { employed: number; asOfYear: number; entryAge: number; retireAge: number },
): { k: number; cohortStock: number; employed: number } {
  const cohortStock = cohortWorkingAgeStock(
    series,
    opts.asOfYear,
    opts.entryAge,
    opts.retireAge,
  );
  const k = cohortStock > 0 ? opts.employed / cohortStock : 0;
  return { k, cohortStock, employed: opts.employed };
}

export type EmploymentForecastRow = {
  y: number;
  netCohort: number | null;
  dEmployed: number | null;
  employed: number;
};

/** 自锚点就业存量起，按 k×队列净增滚动未来 n 年实际就业 */
export function forecastEmploymentStock(
  series: VitalYearRow[],
  opts: {
    employed0: number;
    asOfYear: number;
    entryAge?: number;
    retireAge?: number;
    years?: number;
  },
): { k: number; cohortStock: number; rows: EmploymentForecastRow[] } {
  const entryAge = opts.entryAge ?? LABOR_FLOW_AGES.entry;
  const retireAge = opts.retireAge ?? LABOR_FLOW_AGES.retire;
  const { k, cohortStock } = employmentConversionCoeff(series, {
    employed: opts.employed0,
    asOfYear: opts.asOfYear,
    entryAge,
    retireAge,
  });
  const flows = forecastLaborNet(series, {
    entryAge,
    retireAge,
    asOfYear: opts.asOfYear,
    years: opts.years ?? 10,
  });
  let e = opts.employed0;
  const rows: EmploymentForecastRow[] = [
    {
      y: opts.asOfYear,
      netCohort: null,
      dEmployed: null,
      employed: e,
    },
  ];
  for (const f of flows) {
    const dEmp = f.net != null ? f.net * k : null;
    if (dEmp != null) e += dEmp;
    rows.push({
      y: f.y,
      netCohort: f.net,
      dEmployed: dEmp,
      employed: e,
    });
  }
  return { k, cohortStock, rows };
}

/** 存量序列峰值拐点（局部最大；优先取转折后开始下滑的点） */
export function findEmploymentPeak(rows: EmploymentForecastRow[]): {
  y: number;
  employed: number;
  idx: number;
} | null {
  if (rows.length < 3) return null;
  let bestIdx = 0;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i]!.employed >= rows[bestIdx]!.employed) bestIdx = i;
  }
  // 峰值须不在序列两端才算「拐点」，或至少后面有下行
  if (bestIdx <= 0) return null;
  const hasDeclineAfter = rows.slice(bestIdx + 1).some((r) => r.employed < rows[bestIdx]!.employed - 1);
  if (!hasDeclineAfter && bestIdx === rows.length - 1) return null;
  return { y: rows[bestIdx]!.y, employed: rows[bestIdx]!.employed, idx: bestIdx };
}

/**
 * 峰值后走势：走平（年变动|Δ|<阈值连续≥2年）/ 持续下行 / 回升
 */
export function analyzePostPeakTrend(
  rows: EmploymentForecastRow[],
  peakIdx: number,
  flatAbsYi = 0.002e8, // 约 2 万人视作走平
): {
  trajectory: "still_falling" | "flattens" | "recovers" | "insufficient";
  flatFromYear?: number;
  lastYear: number;
  lastEmployed: number;
  note: string;
} {
  const after = rows.slice(peakIdx);
  if (after.length < 2) {
    return {
      trajectory: "insufficient",
      lastYear: rows[peakIdx]!.y,
      lastEmployed: rows[peakIdx]!.employed,
      note: "峰值后样本不足，无法判断走平或持续下行",
    };
  }
  const last = after[after.length - 1]!;
  // 找连续走平起点
  let flatFrom: number | undefined;
  for (let i = 1; i < after.length - 1; i++) {
    const d1 = Math.abs(after[i]!.employed - after[i - 1]!.employed);
    const d2 = Math.abs(after[i + 1]!.employed - after[i]!.employed);
    if (d1 < flatAbsYi && d2 < flatAbsYi) {
      flatFrom = after[i]!.y;
      break;
    }
  }
  const endSlope = last.employed - after[Math.max(0, after.length - 3)]!.employed;
  if (flatFrom != null) {
    return {
      trajectory: "flattens",
      flatFromYear: flatFrom,
      lastYear: last.y,
      lastEmployed: last.employed,
      note: `峰值后约自 ${flatFrom} 年起年变动很小，接近走平；截至 ${last.y} 存量约 ${formatYi(last.employed)}`,
    };
  }
  if (endSlope > flatAbsYi) {
    return {
      trajectory: "recovers",
      lastYear: last.y,
      lastEmployed: last.employed,
      note: `峰值后一度下行，但截至 ${last.y} 末段已回升至约 ${formatYi(last.employed)}`,
    };
  }
  return {
    trajectory: "still_falling",
    lastYear: last.y,
    lastEmployed: last.employed,
    note: `峰值后持续下行（未见走平）；截至可推算末年 ${last.y} 约 ${formatYi(last.employed)}，其后若出生队列不再回升则趋势仍向下`,
  };
}

export function formatPersonsWan(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e8) return `${sign}${(abs / 1e8).toFixed(2)}亿`;
  if (abs >= 1e4) return `${sign}${(abs / 1e4).toFixed(0)}万`;
  return `${sign}${Math.round(abs)}`;
}

export function formatYi(n: number): string {
  return `${(n / 1e8).toFixed(2)}亿`;
}
