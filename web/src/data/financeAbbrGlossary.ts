/**
 * 消费信贷 / 展业国监管与支付常见英文缩写、固定称谓 → 中文释义（悬停 title 用）
 * 键按「长词优先」匹配；大小写敏感词单独列出。
 */
export const FINANCE_ABBR_GLOSSARY: Record<string, string> = {
  // —— 监管 / 牌照 ——
  NBFC: "非银行金融公司（Non-Banking Financial Company，印度等）",
  LPBBTI: "印尼信息技术基础点对点借贷服务（P2P 牌照类别）",
  POJK: "印尼金融服务管理局条例（Peraturan OJK）",
  OJK: "印尼金融服务管理局（Otoritas Jasa Keuangan）",
  RBI: "印度储备银行（Reserve Bank of India，央行）",
  BOT: "泰国银行（Bank of Thailand，央行）",
  BSP: "菲律宾中央银行（Bangko Sentral ng Pilipinas）",
  SEC: "证券交易委员会（多国同名；菲律宾常指菲律宾证监会）",
  CNBV: "墨西哥国家银行及证券委员会",
  Condusef: "墨西哥国家金融用户保护委员会",
  HKMA: "香港金融管理局",
  MAS: "新加坡金融管理局（Monetary Authority of Singapore）",
  BNM: "马来西亚国家银行（Bank Negara Malaysia）",
  CBK: "肯尼亚中央银行（Central Bank of Kenya）",
  FCCPC: "尼日利亚联邦竞争与消费者保护委员会",
  SECP: "巴基斯坦证券交易委员会",
  CAMEX: "巴西外贸委员会（商贸与关税相关）",
  PMK: "印尼财政部条例（Peraturan Menteri Keuangan）",
  EVIDA: "菲律宾《电动车产业发展法》",
  DOF: "财政部（Department of Finance，多国）",
  NEDA: "菲律宾国家经济发展署",
  SAT: "墨西哥税务总局",
  LIVA: "墨西哥增值税法（Ley del IVA）",
  LIGIE: "墨西哥进口关税总法",

  // —— 机构形态 / 产品 ——
  SOFOM: "墨西哥多重用途金融公司（非吸储放贷主体）",
  CAT: "墨西哥贷款总成本年化披露口径（Costo Anual Total）",
  BNPL: "先买后付（Buy Now Pay Later）",
  P2P: "点对点网络借贷",
  OLP: "线上借贷平台（Online Lending Platform）",
  EMI: "电子货币机构（Electronic Money Institution）；印度语境亦指分期月供",
  PPI: "预付支付工具（Prepaid Payment Instrument，印度）",
  SVF: "储值支付工具（Stored Value Facility，香港）",
  PJP: "支付系统参与者（Payment System Participant 等，视属地）",
  DCP: "数字信贷提供商（Digital Credit Provider，肯尼亚等）",
  FDC: "金融数据中心 / 持牌主体（视当地语境）",
  SIPRES: "墨西哥金融实体信息报送系统",
  PASTI: "印尼非法网贷清剿行动代号（常与 OJK 联合）",
  Pix: "巴西即时支付系统（央行主导）",
  PIX: "巴西即时支付系统（央行主导）",
  CBU: "整车进口（Completely Built-Up）",
  CKD: "全散件组装（Completely Knocked Down）",
  SKD: "半散件组装（Semi Knocked Down）",
  BEV: "纯电动汽车（Battery Electric Vehicle）",
  PHEV: "插电式混合动力汽车",
  HEV: "混合动力汽车",
  NEV: "新能源汽车",
  GST: "商品及服务税（Goods and Services Tax）",
  VAT: "增值税（Value Added Tax）",
  IVA: "增值税（西班牙语/葡语等地区称谓）",
  PPN: "印尼增值税（Pajak Pertambahan Nilai）",
  SST: "销售与服务税（马来西亚等）",
  FRT: "香港车辆首次登记税（First Registration Tax）",
  ARF: "新加坡额外注册费（Additional Registration Fee）",
  COE: "新加坡拥车证（Certificate of Entitlement）",
  ICMS: "巴西州级商品流通税",
  IPI: "巴西工业产品税",
  "PIS/COFINS": "巴西联邦社会贡献税（常见叠加）",
  NPL: "不良贷款率（Non-Performing Loan）",
  DTI: "债务收入比（Debt-to-Income）",
  APR: "年化百分利率（Annual Percentage Rate）",
  CAGR: "复合年均增长率",
  GMV: "成交总额（Gross Merchandise Value）",
  KPI: "关键绩效指标",
  IR: "投资者关系（Investor Relations）",
  ABS: "资产支持证券",
  ABN: "资产支持票据",
  FTA: "自由贸易协定",
  USMCA: "美墨加协定",
  MFN: "最惠国税率（Most-Favoured-Nation）",
  CVD: "反补贴税（Countervailing Duty）",
  TTM: "过去十二个月（Trailing Twelve Months）",

  // —— 宏观口径（常与人均收入/GDP 同屏） ——
  PPP: "购买力平价（Purchasing Power Parity）：按各国物价水平折算的「国际可比美元」，不是市场汇率现价",
  GNI: "国民总收入（Gross National Income）：本国居民应得收入合计，含海外净要素收入；人均 GNI≠住户可支配收入",
  GDP: "国内生产总值（Gross Domestic Product）：境内一年增加值合计；人均 GDP 多为现价美元÷人口",
  CPI: "消费者物价指数（Consumer Price Index）：衡量一篮子消费品价格变动，常用作通胀指标",
  CA: "经常账户（Current Account）：贸易、初次收入与二次收入净额；顺差/逆差看外部收支",
  "CA/GDP": "经常账户占 GDP 比重（Current Account / GDP）：外部失衡的结构尺子，时点常滞后于近季流量",
  IMF: "国际货币基金组织（International Monetary Fund）",
  WEO: "世界经济展望（World Economic Outlook，IMF 半年度预测）",
  TE: "Trading Economics：宏观数据聚合站，Atlas 国别读数常用对照源",
  "Trading Economics": "宏观数据聚合站（常简写 TE），Atlas 国别读数常用对照源",
  OWID: "Our World in Data：开源数据可视化站点，常转载世行等人均收入序列",
  WB: "世界银行（World Bank）",
  ILO: "国际劳工组织（International Labour Organization）",
  BIS: "国际清算银行（Bank for International Settlements）；家庭债务等常用其统计",
  FAS: "金融可及性调查（Financial Access Survey，IMF）",
  USD: "美元（United States Dollar）",
  FX: "外汇 / 汇率（Foreign Exchange）",

  // —— 固定英文监管用语（展示可保留，悬停给释义） ——
  "Responsible Lending": "负责任借贷（对适当性评估、利率与催收等的监管要求）",
  "digital bank": "数字银行 / 虚拟银行",
  "Digital Bank": "数字银行 / 虚拟银行",
  "virtual bank": "虚拟银行",
  "open banking": "开放银行",
  "Open Banking": "开放银行",
  fintech: "金融科技",
  Fintech: "金融科技",
  FinTech: "金融科技",
};

/** 英文标题 → 中文时的短语替换（先长后短） */
export const FLASH_EN_PHRASE_ZH: [string, string][] = [
  [/Responsible Lending/gi, "负责任借贷"],
  [/digital lending/gi, "数字借贷"],
  [/consumer (?:credit|finance|loan)s?/gi, "消费信贷"],
  [/personal loans?/gi, "个人贷"],
  [/money lenders?/gi, "放债人"],
  [/virtual banks?/gi, "虚拟银行"],
  [/digital banks?/gi, "数字银行"],
  [/open banking/gi, "开放银行"],
  [/interest rates?/gi, "利率"],
  [/non-performing loans?/gi, "不良贷款"],
  [/buy now,? pay later|BNPL/gi, "先买后付"],
  [/peer[- ]to[- ]peer|P2P lending/gi, "点对点借贷"],
  [/central bank/gi, "央行"],
  [/securities (?:and )?exchange commission/gi, "证监会"],
  [/electric vehicles?/gi, "电动车"],
  [/battery electric/gi, "纯电"],
  [/import (?:duty|tariff|tax)/gi, "进口关税"],
  [/value[- ]added tax|\bVAT\b/gi, "增值税"],
  [/regulation|circular|guidelines?/gi, "监管规则"],
  [/lending|loan book|credit growth/gi, "信贷"],
  [/fintech/gi, "金融科技"],
  [/sustainable growth/gi, "可持续增长"],
  [/energy security/gi, "能源安全"],
  [/won'?t come cheap|will not come cheap|won[’']t come cheap/gi, "成本不低"],
  [/it won'?t|it won[’']t/gi, "并不会"],
  [/come cheap/gi, "成本低廉"],
  [/blueprint for/gi, "发展蓝图："],
  [/double bottom line/gi, "双重底线"],
  [/\bMVP\b/g, "首席执行官观点"],
];

export function isMostlyChinese(text: string): boolean {
  const t = text || "";
  const cjk = (t.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = (t.match(/[A-Za-z]/g) || []).length;
  if (cjk >= 8) return true;
  if (cjk === 0 && latin > 6) return false;
  return cjk >= latin;
}

/** 叠加上的「外媒」导读壳（含历史 · / ， / , 变体） */
const FLASH_MEDIA_SHELL_RE =
  /^(?:【\s*外媒\s*[·•・，,、|/｜]?\s*[^】]{0,24}\s*】\s*)+/;

function flashTopicLabel(original: string): string {
  return flashConcreteTitle(original);
}

/** 外文标题钩子 → 一句说清的中文标题（与抓取脚本故事库对齐） */
export function flashConcreteTitle(original: string, source?: string): string {
  const bare = (original || "")
    .replace(FLASH_MEDIA_SHELL_RE, "")
    .replace(/^(?:外媒速览[：:]\s*)+/u, "")
    .trim();
  const hooks: [RegExp, string][] = [
    [/Federal Reserve.*(?:requests? comment|proposed rule).*insider/i, "美联储征求意见：拟现代化银行向内部人放贷规则"],
    [/Federal Reserve.*(?:requests? comment|proposed rule)/i, "美联储征求规则意见"],
    [/Federal Reserve.*enforcement.*lending|chief lending/i, "美联储对一家社区银行前信贷官采取执法行动"],
    [/Federal Reserve.*enforcement/i, "美联储执法行动"],
    [/Federal Reserve.*task forces?.*monetary|leadership and objectives/i, "美联储公布货币政策工作组领导与目标"],
    [/Federal Reserve.*leadership|objectives/i, "美联储人事与目标"],
    [/Federal Reserve|\bFed\b/i, "美联储动态"],
    [/CBN.*(?:FX|securities)|removes FX/i, "尼日利亚央行取消贴现窗口相关外汇与国债限制"],
    [/Recoveries?.*ARC|ARC.*Recover|Security Receipt/i, "印度ARC回收加快，一季度证券收据兑付明显超过新发行"],
    [/GST.*(?:auto|demand)|auto demand/i, "马恒达高管称GST下调与利率平稳支撑汽车需求"],
    [/NIM Perbankan.*turun|NIM .+OJK|OJK.+NIM/i, "印尼银行业NIM回落，OJK说明原因"],
    [/(?:5|lima)\s+Strategi.+(?:Literasi|Inklusi)|Ungkap.+(?:Strategi|strategi).+(?:Literasi|Inklusi)/i, "OJK公布提升金融素养与普惠的5项策略"],
    [/Literasi|Inklusi Keuangan/i, "OJK谈金融素养与普惠"],
    [/Demutualisasi|\bBEI\b/i, "OJK称BEI demutualisasi有望增强印尼资本市场竞争力"],
    [/Permintaan Pinjaman.+(?:[Tt]ransparansi|[Ff]intech)|[Tt]ransparansi.+(?:[Ff]intech.?[Ll]ending|pinjaman)/i, "印尼贷款需求走强，网贷信息披露同时成焦点"],
    [/Permintaan Pinjaman|Pinjaman Tumbuh/i, "印尼贷款需求走强"],
    [/Emiten Bank.+HSC|kategori HSC/i, "印尼银行股进入HSC分类，OJK作出回应"],
    [/Emiten Bank/i, "印尼银行股监管分类"],
    [/Peso.+(?:rebota|tipo de cambio)|tipo de cambio.+Peso/i, "墨西哥比索反弹，汇率回到约17比索兑1美元附近"],
    [/Peso|比索/i, "墨西哥比索汇率波动"],
    [/Golpistas.+(?:empr[eé]stimos|marcas)|falsas ofertas.+empr[eé]st/i, "巴西出现冒用大牌名义推销假贷款的诈骗"],
    [/Golpistas|fraudes?|\bscam\b/i, "金融诈骗警示"],
    [/Condusef|CONDUSEF/i, "墨西哥Condusef持续更新消费金融主体与费用披露核验"],
    [/CNBV|SOFOM/i, "墨西哥CNBV/SOFOM监管与CAT披露要求趋严"],
    [/Banxico|tasa de inter[eé]s/i, "墨西哥央行利率"],
    [/pinjaman|pinjol|LPBBTI|\bP2P\b/i, "网贷/P2P 动态"],
    [/BNPL|buy now/i, "先买后付动态"],
    [/NBFC|digital lending|\bRBI\b/i, "RBI/NBFC 数字借贷"],
    [/\bOJK\b/i, "OJK 监管动态"],
    [/\bBOT\b|Bank of Thailand|\bNano\b/i, "泰国央行个人贷/Nano"],
    [/HKMA|money lender|virtual bank/i, "金管局/放债人/虚拟银行"],
    [/\bBSP\b|SEC.+lend|online lending/i, "菲央行/证监借贷监管"],
    [/interest rate|\bNPL\b|credit growth|loan book/i, "利率/信贷/不良动态"],
    [/fintech|\bbank\b|crédito|credito|lending|\bloan\b/i, "银行与信贷动态"],
  ];
  for (const [re, zh] of hooks) {
    if (re.test(bare)) return zh;
  }
  const src = (source || "").trim();
  if (src && !/点点|经律师|媒体/.test(src)) return `${src}：财经相关`;
  return "外媒：财经相关报道";
}

/** 去掉重复外媒壳与夹杂外文，保证列表默认可读中文 */
export function ensureFlashChinese(raw: string): string {
  let s = (raw || "").trim();
  if (!s) return s;

  // 已是干净中文导读 → 直接返回（保持幂等）
  if (/^外媒速览：[\u4e00-\u9fff、/]+$/u.test(s)) {
    return flashConcreteTitle(s);
  }
  // 已是具体中文钩子
  if (
    isMostlyChinese(s) &&
    !FLASH_MEDIA_SHELL_RE.test(s) &&
    !s.startsWith("外媒速览：") &&
    (s.match(/[A-Za-z]/g) || []).length <= 10
  ) {
    return s;
  }

  // 幂等：先剥掉已叠的【外媒…】，避免 soften / 入库 / 渲染多次叠加
  s = s.replace(FLASH_MEDIA_SHELL_RE, "").trim();
  s = s.replace(/^(?:外媒速览[：:]\s*)+/u, "").trim();

  const original = s;
  for (const [re, zh] of FLASH_EN_PHRASE_ZH) s = s.replace(re, zh);

  const latinAfterPhrase = (s.match(/[A-Za-z]/g) || []).length;
  if (isMostlyChinese(s) && latinAfterPhrase <= 8) {
    return s.replace(/\s{2,}/g, " ").trim();
  }

  // 残留英文词粗译（仅作辅助；译不全则整行改中文导读，不保留外文乱码）
  const wordMap: Record<string, string> = {
    may: "或将",
    bring: "带来",
    but: "但",
    and: "与",
    for: "面向",
    the: "",
    a: "",
    an: "",
    of: "的",
    to: "至",
    in: "在",
    on: "就",
    with: "与",
    from: "来自",
    new: "新",
    ban: "禁止",
    bans: "禁止",
    proposes: "拟",
    proposed: "拟议",
    expands: "扩大",
    expansion: "扩容",
    license: "牌照",
    licences: "牌照",
    licensed: "持牌",
    registration: "登记",
    disclosure: "披露",
    tighter: "收紧",
    tightens: "收紧",
    nuclear: "核能",
    growth: "增长",
    blueprint: "蓝图",
    sustainable: "可持续",
    recoveries: "回收",
    pace: "加快",
    quarter: "季度",
  };
  s = s.replace(/[A-Za-z]+(?:['’][A-Za-z]+)?/g, (w) => {
    const low = w.toLowerCase().replace(/’/g, "'");
    if (FINANCE_ABBR_GLOSSARY[w]) return w;
    if (wordMap[low] !== undefined) return wordMap[low];
    return w;
  });

  s = s
    .replace(/['’]s\b/g, "的")
    .replace(/[:：]\s*/g, "：")
    .replace(/(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, "")
    .replace(/\s*([，。；：、])\s*/g, "$1")
    .replace(/(?<=[\u4e00-\u9fff])\s*,\s*(?=[\u4e00-\u9fffA-Za-z])/g, "，")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([，。；：])/g, "$1")
    .trim();

  const latinLeft = (s.match(/[A-Za-z]/g) || []).length;
  const cjk = (s.match(/[\u4e00-\u9fff]/g) || []).length;
  // 已是成段中文叙述（含少量专名 Pix/Valor）→ 绝不压成「外媒速览」壳
  if (cjk >= 12 && cjk >= latinLeft) {
    return s.replace(/\s{2,}/g, " ").trim();
  }
  const knownAbbr =
    /^(RBI|OJK|NBFC|NBFCs|BSP|BOT|SEC|HKMA|CNBV|BNPL|NPL|POJK|ARC|ESG|IMF|BIS|GDP|CPI|VAT|DTI|Nano|IPO|CEO|App|IR|KPI|Pix|Valor)$/i;
  const leftover = (s.match(/[A-Za-z]{2,}/g) || []).filter((w) => !knownAbbr.test(w));

  // 仍以外文为主 → 具体中文钩子（仅用于标题，不成段叙述）
  if (
    cjk < 8 ||
    !isMostlyChinese(s) ||
    (leftover.length > 0 && (cjk < 10 || latinLeft >= cjk)) ||
    (latinLeft > 12 && latinLeft > cjk)
  ) {
    return flashConcreteTitle(original);
  }
  return s;
}

/** 按长度降序的匹配表，避免短码吞掉长码 */
let _sortedTerms: string[] | null = null;
function sortedGlossaryTerms(): string[] {
  if (!_sortedTerms) {
    _sortedTerms = Object.keys(FINANCE_ABBR_GLOSSARY).sort((a, b) => b.length - a.length);
  }
  return _sortedTerms;
}

export type GlossPart = { text: string; gloss?: string; /** 画面展示用（可比原文更易懂） */ display?: string };

/** 生僻缩写在画面上展开全称，悬停仍给释义 */
export const FINANCE_ABBR_DISPLAY: Record<string, string> = {
  TE: "Trading Economics",
};

/** 把正文拆成「普通字 / 可悬停缩写」片段 */
export function splitGlossParts(raw: string): GlossPart[] {
  const s = raw || "";
  if (!s) return [];
  const terms = sortedGlossaryTerms();
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  const parts: GlossPart[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push({ text: s.slice(last, m.index) });
    const term = m[1];
    const display = FINANCE_ABBR_DISPLAY[term];
    parts.push({ text: term, gloss: FINANCE_ABBR_GLOSSARY[term], display });
    last = m.index + term.length;
  }
  if (last < s.length) parts.push({ text: s.slice(last) });
  return parts.length ? parts : [{ text: s }];
}
