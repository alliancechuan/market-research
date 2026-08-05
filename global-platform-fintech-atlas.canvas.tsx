import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  CollapsibleSection,
  Divider,
  Grid,
  H1,
  H2,
  IconButton,
  Link,
  Pill,
  Row,
  Select,
  Stack,
  Stat,
  Text,
  TextInput,
  UsageBar,
  mergeStyle,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";
import type { ReactNode } from "react";

/**
 * 分类（用户口径）
 * CRM 主档：机构（Institution）优先
 *    - 系统内先建机构并做 KYC；唯一识别=机构证件号码
 *    - 机构主体：以集团金融及金融生态服务为主业核心的控股主体
 *    - 机构类型：玩家（下场）| 流量服务商 | 数据服务方 | 监管 | 资金参与机构 | 风险参与机构
 *               | 风控服务方 | 支付服务机构 | 回收机构 | 权益服务商 | 触达服务机构
 *               | 公关服务机构 | 信托服务机构 | 会计师事务所 | 律师事务所 | 评级机构
 *    - 资金参与机构细分：本地银行 | 本地银行代理 | 结构化服务商 | 优先投资人 | 夹层投资人
 *    - 流量服务商细分：流量平台 | 代理商 | 贷超 | 代理运营
 *    - 流量平台：Google / Meta / TikTok / Apple，及 Snap、X、LinkedIn、Taboola、Outbrain 等
 *    - 代理商：授权代理/Partner 目录入口、蓝标等 Reseller/Agency；≠现金贷掮客
 *    - 贷超：LendingTree / Credit Karma / Cermati 等比价导流；部分市场需持牌
 *    - 代理运营：代运营、ASO/ASA、榜单与监测（点点、七麦、AppsFlyer/Adjust 等）
 *    - 标准可采信源：STANDARD_TRAFFIC_SOURCES（各平台广告政策页 + Partner 官方目录）
 * 经营性征（挂机构；可演变）：原生路径（场景原生|信贷原生，二分不重不漏）· 国家/地区 · 场景 · 金融产品 · 牌照
 * 信源（机构进出市场；系统定期检索引入；亦可人工创建；未来可扩信源）：
 *    - 流量源 · 监管源 · 经办认领（客户经理联系确认，对信息质量负责）
 *    - 研报源 · 墨腾创投（Momentum Works / 微信「墨腾创投」）：东南亚平台与金融科技长期学习源；见 MOTENG_LEARNED
 *    - 场景 taxonomy 源 · 线上数字经济场景（Web2/Web3/Agent；见 SCENE_WIDE_TABLE / WEB3_SCENE_WIDE_TABLE）
 *    - 广告平台 Partner 目录源 · Meta/Google/TikTok/Apple Search Ads 官方目录（见 STANDARD_TRAFFIC_SOURCES）
 *    - 信源核实不作前端筛选标签；展开详情展示；多源齐备可给完整验证角标，提示客户经理用更高质量信源跟进
 * 命名：当地公司名｜APP名｜集团名（中国业内俗称·国家地区简称）
 */

type Region =
  | "all"
  | "east-asia"
  | "se-asia"
  | "south-asia"
  | "central-asia"
  | "latam"
  | "mena"
  | "africa"
  | "west";

type Primary = "all" | "scene" | "credit";
/** 数据行产品线（库内粗类；筛选树见 CreditProd*） */
type CreditLine = "all" | "cash" | "bnpl" | "lease" | "agent";
/** @deprecated 已由 CreditProdL1/L2/L3 树替代；保留兼容旧调用 */
type ProductFilter = CreditLine | "card";

/** 涉足信贷产品 · 一级 */
type CreditProdL1 = "all" | "个人信贷" | "企业信贷" | "信贷超市" | "信贷其他";
/** 涉足信贷产品 · 二级（个人下分类 / 企业与信贷其他下叶子） */
type CreditProdL2 =
  | "all"
  | "消费信贷"
  | "住房信贷"
  | "汽车信贷"
  | "流贷"
  | "固贷"
  | "提前收款"
  | "订单融资"
  | "发票融资"
  | "学生贷"
  | "农户贷"
  | "公务员贷";
/** 涉足信贷产品 · 三级叶子（消费/住房/汽车） */
type CreditProdL3 =
  | "all"
  | "现金贷"
  | "消费分期/BNPL"
  | "信用卡"
  | "信用租赁"
  | "按揭贷"
  | "抵押贷"
  | "新车贷"
  | "二手车贷";

type SubsidyFlag = "all" | "yes" | "no";
type SubsidyRole = "商户" | "政府" | "平台" | "其他";
type GuaranteeFlag = "all" | "yes" | "no";
type GuaranteeRole = "商户" | "政府" | "平台" | "担保/保险公司" | "其他";
/** 涉足国家/地区（筛选；与洲际 region 正交） */
type CountryCode =
  | "all"
  | "CN"
  | "TW"
  | "JP"
  | "KR"
  | "MN"
  | "ID"
  | "VN"
  | "MY"
  | "TH"
  | "PH"
  | "IN"
  | "BD"
  | "PK"
  | "LK"
  | "KZ"
  | "UZ"
  | "KG"
  | "TJ"
  | "TM"
  | "MX"
  | "BR"
  | "CO"
  | "AR"
  | "PE"
  | "CL"
  // 中东与北非
  | "EG"
  | "MA"
  | "DZ"
  | "TN"
  | "LY"
  | "SD"
  | "SA"
  | "AE"
  | "BH"
  | "QA"
  | "KW"
  | "OM"
  | "JO"
  | "LB"
  | "IQ"
  | "IL"
  | "PS"
  | "TR"
  | "YE"
  | "IR"
  // 非洲（撒哈拉以南为主）
  | "NG"
  | "KE"
  | "GH"
  | "ZA"
  | "TZ"
  | "UG"
  | "RW"
  | "ET"
  | "CI"
  | "SN"
  | "CM"
  | "AO"
  | "MZ"
  | "ZM"
  | "ZW"
  | "BW"
  | "NA"
  | "MU"
  | "MG"
  | "BJ"
  | "BF"
  | "ML"
  | "CD"
  | "GA"
  // 欧美
  | "US"
  | "CA"
  | "GB"
  | "DE"
  | "FR"
  | "NL"
  | "ES"
  | "PT"
  | "IT"
  | "SE"
  | "PL"
  | "IE";
/** 信贷横切标签：与三产品线正交（现金贷/消费分期/信用租赁均可兼发） */
type CreditTag = "信用卡";
/** 涉及金融牌照（粗类；明细在 licenseReg）。「其他」= 证券/租赁/征信等明确非四类牌照 */
type LicenseKind = "银行" | "保险" | "支付" | "消金小贷" | "其他";
/**
 * 机构类型（CRM）：先有机构，再挂类型。玩家=下场；其余=非下场生态角色。
 * 玩家排在流量服务商之前。
 */
type InstitutionType =
  | "玩家"
  | "流量服务商"
  | "数据服务方"
  | "监管"
  | "资金参与机构"
  | "风险参与机构"
  | "风控服务方"
  | "支付服务机构"
  | "回收机构"
  | "权益服务商"
  | "触达服务机构"
  | "公关服务机构"
  | "信托服务机构"
  | "会计师事务所"
  | "律师事务所"
  | "评级机构";
/** 生态角色 ⊂ 机构类型（非玩家） */
type EcoRole = Exclude<InstitutionType, "玩家">;
/** 资金参与机构细分（挂在「资金参与机构」类型下） */
type FundParticipationKind =
  | "本地银行"
  | "本地银行代理"
  | "结构化服务商"
  | "优先投资人"
  | "夹层投资人";
/** 流量服务商细分（挂在「流量服务商」类型下） */
type TrafficServiceKind = "流量平台" | "代理商" | "贷超" | "代理运营";
/** 信源渠道（引入/核实机构；非经营性征标签） */
type SourceChannel = "流量源" | "监管源" | "经办认领";
/** 场景多标签（一玩家可多选）；「信用管理」横切亦可挂场景侧；大宽表+Web3 To C */
type SceneTag =
  | "电商"
  | "出行"
  | "外卖"
  | "社交"
  | "支付钱包"
  | "游戏"
  | "直播"
  | "信用管理"
  | "金融"
  | "艺术"
  | "内容资讯"
  | "企业服务"
  | "法律服务"
  | "本地生活"
  | "在线教育"
  | "在线医疗"
  | "Web3";
/** 场景二级（数字化经营大宽表 + Web3 To C；历史侨汇→跨境支付/汇款） */
type SceneSubTag =
  | "综合电商"
  | "垂直电商"
  | "社交电商"
  | "跨境电商"
  | "二手/闲置"
  | "网约车"
  | "顺风车/拼车"
  | "共享单车/电单车"
  | "地图/导航"
  | "代驾"
  | "餐饮外卖"
  | "即时零售/闪购"
  | "生鲜电商"
  | "药品配送"
  | "即时通讯"
  | "社区/论坛"
  | "陌生人社交"
  | "职场社交"
  | "婚恋/相亲"
  | "移动支付"
  | "跨境支付/汇款"
  | "数字银行/虚拟账户"
  | "预付卡/储值"
  | "聚合支付"
  | "手游"
  | "端游/页游"
  | "云游戏"
  | "游戏平台/分发"
  | "电竞/赛事"
  | "娱乐直播"
  | "游戏直播"
  | "电商直播/带货"
  | "教育直播"
  | "企业直播/会议"
  | "征信查询"
  | "信用评分/画像"
  | "反欺诈服务"
  | "债务管理/催收"
  | "短视频"
  | "中长视频/流媒体"
  | "新闻资讯/聚合"
  | "知识付费/专栏"
  | "播客/音频"
  | "企业通讯/协同"
  | "项目管理"
  | "云存储/云服务"
  | "在线文档/表格"
  | "电子签章"
  | "电子合同"
  | "在线公证/存证"
  | "法律咨询/智能法务"
  | "到店团购"
  | "酒店/民宿预订"
  | "票务/电影/演出"
  | "家政/保洁服务"
  | "美容/美发预约"
  | "K12学科辅导"
  | "语言学习"
  | "职业教育/考证"
  | "兴趣/素质教育"
  | "企业培训/SaaS化"
  | "在线问诊"
  | "药品电商/配送"
  | "健康管理/慢病"
  | "心理咨询"
  | "体检预约"
  | "中心化交易所（CEX）"
  | "去中心化交易所（DEX）"
  | "NFT交易市场"
  | "自托管钱包"
  | "托管钱包"
  | "硬件钱包"
  | "借贷协议"
  | "稳定币兑换/持有"
  | "质押生息"
  | "流动性挖矿"
  | "链游玩赚"
  | "游戏资产交易"
  | "游戏公会参与"
  | "去中心化社交"
  | "创作者代币"
  | "内容打赏"
  | "PFP头像/身份"
  | "音乐/艺术收藏"
  | "品牌会员/权益"
  | "票务/入场凭证"
  | "稳定币汇款"
  | "加密货币支付"
  | "抗通胀储蓄";
/** @deprecated 已取消租赁二级分类；保留类型仅兼容旧草稿字段 */
type LeaseSubTag = "游戏租赁";
/**
 * 信源核实结果（非玩家标签）：多信源交叉后的完备度摘要，仅展开详情展示。
 * 内部枚举值兼容历史数据；展示文案见 VERIFY_LABEL。
 */
type VerifyStatus = "双端通过" | "仅流量" | "仅监管" | "待双端" | "冲突观察";

type SceneRow = {
  region: Exclude<Region, "all">;
  group: string;
  /**
   * CRM 机构证件号码（唯一识别）。各国公司注册号/税号/统一社会信用代码等；KYC 必填目标。
   */
  orgDocNo: string;
  /** CRM 机构类型：含「玩家」及/或各类生态角色 */
  institutionTypes: InstitutionType[];
  /** 涉足场景 */
  tags: SceneTag[];
  /** 二级场景（挂在一级之下，如跨境支付/汇款⊂支付钱包） */
  subTags: SceneSubTag[];
  /** 由 tags+subTags 拼出的展示串（兼容旧口径） */
  sceneType: string;
  apps: string;
  countries: string;
  languages: string;
  mau: string;
  registered: string;
  share: string;
  creditAttach: string;
  /** 流量排名：GP/Apple/FB/点点/路飞/Sensor Tower等 */
  diandian: string;
  controller: string;
  equity: string;
  licenseReg: string;
  /** 涉及金融牌照粗类 */
  licenseKinds: LicenseKind[];
  trafficRank: string;
  /** 信源核实摘要（非标签） */
  verify: VerifyStatus;
};

type CreditRow = {
  region: Exclude<Region, "all">;
  line: "cash" | "bnpl" | "lease" | "agent";
  tier: "头腰" | "头部" | "腰部" | "新兴";
  group: string;
  /** CRM 机构证件号码（唯一识别） */
  orgDocNo: string;
  /** CRM 机构类型：玩家及/或生态角色 */
  institutionTypes: InstitutionType[];
  /** 资金参与机构细分；非资金参与机构则为空 */
  fundKinds: FundParticipationKind[];
  /** 流量服务商细分；非流量服务商则为空 */
  trafficKinds: TrafficServiceKind[];
  brands: string;
  countries: string;
  languages: string;
  licenses: string;
  /** 展业时点/运营节点（详情用；列表右侧优先用 founded） */
  timing: string;
  /** 成立时间（列表右侧展示） */
  founded: string;
  regulators: string;
  traffic: string;
  /** 年放款量（或最接近的年化放款/撮合口径） */
  volume: string;
  users: string;
  /** 员工人数 */
  employees: string;
  /** 流量排名摘要（兼容旧列；完整口径见 trafficRank） */
  diandian: string;
  note: string;
  /** 横切标签：可与三产品线并存（如发信用卡） */
  tags: CreditTag[];
  /** @deprecated 已取消租赁二级；finalize 恒为空 */
  leaseSubs: LeaseSubTag[];
  /**
   * @deprecated 请读 institutionTypes；line=agent 时含「流量」
   */
  ecoRoles: EcoRole[];
  controller: string;
  equity: string;
  licenseReg: string;
  licenseKinds: LicenseKind[];
  trafficRank: string;
  /** 信源核实摘要（非标签） */
  verify: VerifyStatus;
};

type SceneDraft = Omit<
  SceneRow,
  | "controller"
  | "equity"
  | "licenseReg"
  | "licenseKinds"
  | "trafficRank"
  | "verify"
  | "tags"
  | "subTags"
  | "sceneType"
  | "orgDocNo"
  | "institutionTypes"
> &
  Partial<
    Pick<
      SceneRow,
      | "controller"
      | "equity"
      | "licenseReg"
      | "licenseKinds"
      | "trafficRank"
      | "verify"
      | "tags"
      | "subTags"
      | "orgDocNo"
      | "institutionTypes"
    >
  > & {
    /** 草稿可写自由文案；finalize 时与 tags 合并归一 */
    sceneType?: string;
  };

type CreditDraft = Omit<
  CreditRow,
  | "controller"
  | "equity"
  | "licenseReg"
  | "licenseKinds"
  | "trafficRank"
  | "verify"
  | "tags"
  | "leaseSubs"
  | "ecoRoles"
  | "fundKinds"
  | "trafficKinds"
  | "founded"
  | "employees"
  | "orgDocNo"
  | "institutionTypes"
> &
  Partial<
    Pick<
      CreditRow,
      | "controller"
      | "equity"
      | "licenseReg"
      | "licenseKinds"
      | "trafficRank"
      | "verify"
      | "tags"
      | "leaseSubs"
      | "ecoRoles"
      | "fundKinds"
      | "trafficKinds"
      | "founded"
      | "employees"
      | "orgDocNo"
      | "institutionTypes"
    >
  >;

const VERIFY_LABEL: Record<VerifyStatus, string> = {
  双端通过: "多源齐备",
  仅流量: "仅流量源",
  仅监管: "仅监管源",
  待双端: "信源未齐",
  冲突观察: "冲突观察",
};

const REGION_LABEL: Record<Region, string> = {
  all: "全部洲际",
  "east-asia": "东亚",
  "se-asia": "东南亚",
  "south-asia": "南亚",
  "central-asia": "中亚",
  latam: "拉丁美洲",
  mena: "中东与北非",
  africa: "非洲",
  west: "欧美",
};

const COUNTRY_LABEL: Record<CountryCode, string> = {
  all: "全部",
  CN: "中国",
  TW: "中国台湾",
  JP: "日本",
  KR: "韩国",
  MN: "外蒙古",
  ID: "印度尼西亚",
  VN: "越南",
  MY: "马来西亚",
  TH: "泰国",
  PH: "菲律宾",
  IN: "印度",
  BD: "孟加拉",
  PK: "巴基斯坦",
  LK: "斯里兰卡",
  KZ: "哈萨克斯坦",
  UZ: "乌兹别克斯坦",
  KG: "吉尔吉斯斯坦",
  TJ: "塔吉克斯坦",
  TM: "土库曼斯坦",
  MX: "墨西哥",
  BR: "巴西",
  CO: "哥伦比亚",
  AR: "阿根廷",
  PE: "秘鲁",
  CL: "智利",
  EG: "埃及",
  MA: "摩洛哥",
  DZ: "阿尔及利亚",
  TN: "突尼斯",
  LY: "利比亚",
  SD: "苏丹",
  SA: "沙特",
  AE: "阿联酋",
  BH: "巴林",
  QA: "卡塔尔",
  KW: "科威特",
  OM: "阿曼",
  JO: "约旦",
  LB: "黎巴嫩",
  IQ: "伊拉克",
  IL: "以色列",
  PS: "巴勒斯坦",
  TR: "土耳其",
  YE: "也门",
  IR: "伊朗",
  NG: "尼日利亚",
  KE: "肯尼亚",
  GH: "加纳",
  ZA: "南非",
  TZ: "坦桑尼亚",
  UG: "乌干达",
  RW: "卢旺达",
  ET: "埃塞俄比亚",
  CI: "科特迪瓦",
  SN: "塞内加尔",
  CM: "喀麦隆",
  AO: "安哥拉",
  MZ: "莫桑比克",
  ZM: "赞比亚",
  ZW: "津巴布韦",
  BW: "博茨瓦纳",
  NA: "纳米比亚",
  MU: "毛里求斯",
  MG: "马达加斯加",
  BJ: "贝宁",
  BF: "布基纳法索",
  ML: "马里",
  CD: "刚果（金）",
  GA: "加蓬",
  US: "美国",
  CA: "加拿大",
  GB: "英国",
  DE: "德国",
  FR: "法国",
  NL: "荷兰",
  ES: "西班牙",
  PT: "葡萄牙",
  IT: "意大利",
  SE: "瑞典",
  PL: "波兰",
  IE: "爱尔兰",
};

/** 洲际 → 可选国家/地区（不含 all；选「全部洲际」时展示全部国家） */
const COUNTRIES_BY_REGION: Record<Exclude<Region, "all">, Exclude<CountryCode, "all">[]> = {
  "east-asia": ["CN", "TW", "JP", "KR", "MN"],
  "se-asia": ["ID", "VN", "MY", "TH", "PH"],
  "south-asia": ["IN", "BD", "PK", "LK"],
  "central-asia": ["KZ", "UZ", "KG", "TJ", "TM"],
  latam: ["MX", "BR", "CO", "AR", "PE", "CL"],
  mena: ["EG", "MA", "DZ", "TN", "LY", "SD", "SA", "AE", "BH", "QA", "KW", "OM", "JO", "LB", "IQ", "IL", "PS", "TR", "YE", "IR"],
  africa: ["NG", "KE", "GH", "ZA", "TZ", "UG", "RW", "ET", "CI", "SN", "CM", "AO", "MZ", "ZM", "ZW", "BW", "NA", "MU", "MG", "BJ", "BF", "ML", "CD", "GA"],
  west: ["US", "CA", "GB", "DE", "FR", "NL", "ES", "PT", "IT", "SE", "PL", "IE"],
};

function countriesForRegion(region: Region): CountryCode[] {
  if (region === "all") {
    return Object.keys(COUNTRY_LABEL) as CountryCode[];
  }
  return ["all", ...COUNTRIES_BY_REGION[region]];
}

function countryInRegion(country: CountryCode, region: Region): boolean {
  if (country === "all" || region === "all") return true;
  return COUNTRIES_BY_REGION[region].includes(country);
}

/** 监管页：地域对应的法定/常用牌照名（可点选过滤监管主体与持牌玩家） */
type RegLicenseDef = {
  id: string;
  country: Exclude<CountryCode, "all">;
  /** 列表展示名 */
  name: string;
  /** 命中监管机构 licenses/licenseReg/note/group */
  regulatorRe: RegExp;
  /** 命中玩家 licenseReg/licenses */
  holderRe: RegExp;
};

const REGULATORY_LICENSE_CATALOG: RegLicenseDef[] = [
  // —— 中国 ——
  {
    id: "CN-pay",
    country: "CN",
    name: "支付业务许可证",
    regulatorRe: /人民银行|PBOC|支付|央行/i,
    holderRe: /支付|非银行支付|支付业务/i,
  },
  {
    id: "CN-bank",
    country: "CN",
    name: "商业银行",
    regulatorRe: /金管总局|NFRA|银保监|银行/i,
    holderRe: /商业银行|银行牌照|吸储/i,
  },
  {
    id: "CN-consumer",
    country: "CN",
    name: "消费金融",
    regulatorRe: /金管总局|NFRA|银保监|消金|消费金融/i,
    holderRe: /消金|消费金融/i,
  },
  {
    id: "CN-micro",
    country: "CN",
    name: "小额贷款",
    regulatorRe: /地方金融|小贷|金管总局|互金协会|NIFA/i,
    holderRe: /小贷|小额贷款/i,
  },
  {
    id: "CN-ins-broker",
    country: "CN",
    name: "保险经纪",
    regulatorRe: /金管总局|NFRA|保险|银保监/i,
    holderRe: /保险经纪|保险代理/i,
  },
  {
    id: "CN-fund",
    country: "CN",
    name: "基金销售",
    regulatorRe: /证监会|CSRC|基金/i,
    holderRe: /基金代销|基金销售/i,
  },
  {
    id: "CN-credit",
    country: "CN",
    name: "征信业务",
    regulatorRe: /人民银行|PBOC|征信/i,
    holderRe: /征信/i,
  },
  {
    id: "CN-assist",
    country: "CN",
    name: "助贷（信息中介）",
    regulatorRe: /互金协会|NIFA|金管总局|助贷/i,
    holderRe: /助贷/i,
  },
  {
    id: "CN-autofinance",
    country: "CN",
    name: "汽车金融公司",
    regulatorRe: /金管总局|NFRA|银保监|汽车金融/i,
    holderRe: /汽车金融/i,
  },
  {
    id: "CN-finlease",
    country: "CN",
    name: "金融租赁公司",
    regulatorRe: /金管总局|NFRA|银保监|金融租赁|融资租赁/i,
    holderRe: /金融租赁|融资租赁/i,
  },
  // —— 印尼 ——
  {
    id: "ID-p2p",
    country: "ID",
    name: "LPBBTI（P2P）",
    regulatorRe: /OJK|AFPI|LPBBTI|P2P/i,
    holderRe: /LPBBTI|P2P/i,
  },
  {
    id: "ID-multi",
    country: "ID",
    name: "Multifinance（多金融）",
    regulatorRe: /OJK|Multifinance|多金融/i,
    holderRe: /Multifinance|多金融/i,
  },
  {
    id: "ID-bank",
    country: "ID",
    name: "商业银行",
    regulatorRe: /OJK|Bank Indonesia|BI｜|商业银行|银行/i,
    holderRe: /银行|商业银行|BNC|Bank\s*Neo/i,
  },
  {
    id: "ID-pay",
    country: "ID",
    name: "电子货币/支付",
    regulatorRe: /Bank Indonesia|BI｜|支付|电子货币|e-?money/i,
    holderRe: /支付|电子货币|e-?money|钱包/i,
  },
  // —— 菲律宾 ——
  {
    id: "PH-lending",
    country: "PH",
    name: "SEC Lending/Financing",
    regulatorRe: /SEC｜|Securities and Exchange|Lending|Financing/i,
    holderRe: /SEC|Lending|Financing|放贷|OLP/i,
  },
  {
    id: "PH-olp",
    country: "PH",
    name: "Online Lending Platform（OLP）",
    regulatorRe: /SEC｜|OLP|Online Lending/i,
    holderRe: /OLP|Online Lending/i,
  },
  {
    id: "PH-digibank",
    country: "PH",
    name: "数字银行",
    regulatorRe: /BSP|Bangko Sentral|PDIC|数字银行|Digital\s*Bank/i,
    holderRe: /数字银行|Digital\s*Bank|Maya\s*Bank|Tonik|GoTyme|UnionDigital|UNObank|UNO\s*Digital|OFBank|Overseas Filipino/i,
  },
  {
    id: "PH-emi",
    country: "PH",
    name: "电子货币发行人（EMI）",
    regulatorRe: /BSP|Bangko Sentral|EMI|电子货币|支付/i,
    holderRe: /EMI|电子货币|支付|GCash|钱包/i,
  },
  // —— 印度 ——
  {
    id: "IN-nbfc",
    country: "IN",
    name: "NBFC（RBI CoR）",
    regulatorRe: /RBI|NBFC|Reserve Bank/i,
    holderRe: /NBFC|CoR/i,
  },
  {
    id: "IN-paybank",
    country: "IN",
    name: "Payments Bank / 支付",
    regulatorRe: /RBI|Payments?\s*Bank|支付|UPI/i,
    holderRe: /Payments?\s*Bank|支付|UPI|PPINBI/i,
  },
  {
    id: "IN-bank",
    country: "IN",
    name: "商业银行",
    regulatorRe: /RBI|商业银行|银行/i,
    holderRe: /商业银行|银行牌照|SBI/i,
  },
  // —— 马来 ——
  {
    id: "MY-credit",
    country: "MY",
    name: "非银信贷（BNM）",
    regulatorRe: /BNM|Bank Negara|非银|信贷/i,
    holderRe: /BNM|非银|信贷|AEON/i,
  },
  // —— 泰国 ——
  {
    id: "TH-ploan",
    country: "TH",
    name: "P-Loan / Nano Finance",
    regulatorRe: /BOT|Bank of Thailand|P-Loan|Nano/i,
    holderRe: /P-Loan|Nano|BOT/i,
  },
  // —— 越南 ——
  {
    id: "VN-fc",
    country: "VN",
    name: "金融公司（SBV）",
    regulatorRe: /SBV|State Bank of Vietnam|金融公司/i,
    holderRe: /金融公司|SBV|FE Credit|Home Credit/i,
  },
  // —— 墨西哥 ——
  {
    id: "MX-sofom",
    country: "MX",
    name: "SOFOM / 金融公司",
    regulatorRe: /CNBV|Banxico|SOFOM|SIPRES|金融公司/i,
    holderRe: /SOFOM|SOFIPO|金融公司/i,
  },
  // —— 巴西 ——
  {
    id: "BR-digibank",
    country: "BR",
    name: "数字银行 / 信贷",
    regulatorRe: /BCB|Banco Central|数字银行|信贷/i,
    holderRe: /数字银行|银行|信贷|Nubank/i,
  },
  // —— 巴基斯坦 ——
  {
    id: "PK-nbfc",
    country: "PK",
    name: "Lending NBFC（SECP）",
    regulatorRe: /SECP|SBP|NBFC|Lending/i,
    holderRe: /NBFC|SECP|Lending/i,
  },
  // —— 孟加拉 ——
  {
    id: "BD-nbfi",
    country: "BD",
    name: "NBFI（Bangladesh Bank）",
    regulatorRe: /Bangladesh Bank|BB｜|NBFI/i,
    holderRe: /NBFI|Bangladesh Bank/i,
  },
  // —— 斯里兰卡 ——
  {
    id: "LK-lfc",
    country: "LK",
    name: "Licensed Finance Company",
    regulatorRe: /CBSL|Central Bank of Sri Lanka|LFC|Finance Company/i,
    holderRe: /LFC|Licensed Finance|Finance Company/i,
  },
  // —— 沙特 ——
  {
    id: "SA-bnpl",
    country: "SA",
    name: "BNPL / 金融公司（SAMA）",
    regulatorRe: /SAMA|Saudi Central|BNPL|金融公司/i,
    holderRe: /BNPL|SAMA|金融公司|Tabby|Tamara/i,
  },
  // —— 阿联酋 ——
  {
    id: "AE-finance",
    country: "AE",
    name: "金融公司 / 支付（CBUAE）",
    regulatorRe: /CBUAE|Central Bank of the UAE|金融公司|支付/i,
    holderRe: /CBUAE|金融公司|支付|BNPL/i,
  },
  // —— 埃及 ——
  {
    id: "EG-nbfi",
    country: "EG",
    name: "非银金融 / 消费金融（CBE）",
    regulatorRe: /CBE|Central Bank of Egypt|FRA|非银|消费金融/i,
    holderRe: /非银|消费金融|BNPL|ValU|Halan/i,
  },
  // —— 巴林 / 卡塔尔 / 科威特 / 阿曼 ——
  {
    id: "BH-finance",
    country: "BH",
    name: "银行 / 金融公司（CBB）",
    regulatorRe: /CBB|Central Bank of Bahrain|金融/i,
    holderRe: /银行|金融公司|支付/i,
  },
  {
    id: "QA-finance",
    country: "QA",
    name: "银行 / 金融（QCB）",
    regulatorRe: /QCB|Qatar Central|金融/i,
    holderRe: /银行|金融公司|支付/i,
  },
  {
    id: "KW-finance",
    country: "KW",
    name: "银行 / 金融（CBK）",
    regulatorRe: /Central Bank of Kuwait|科威特央行|金融/i,
    holderRe: /银行|金融公司|支付/i,
  },
  {
    id: "OM-finance",
    country: "OM",
    name: "银行 / 金融（CBO）",
    regulatorRe: /CBO|Central Bank of Oman|金融/i,
    holderRe: /银行|金融公司|支付/i,
  },
  // —— 摩洛哥 ——
  {
    id: "MA-credit",
    country: "MA",
    name: "信贷机构（Bank Al-Maghrib）",
    regulatorRe: /Bank Al-Maghrib|BAM|摩洛哥央行|信贷/i,
    holderRe: /信贷|微金融|支付|BNPL/i,
  },
  // —— 尼日利亚 ——
  {
    id: "NG-mfb",
    country: "NG",
    name: "微金融银行 / 支付（CBN）",
    regulatorRe: /CBN|Central Bank of Nigeria|微金融|MFB|支付/i,
    holderRe: /微金融|MFB|支付|数字银行|OPay|PalmPay/i,
  },
  // —— 肯尼亚 ——
  {
    id: "KE-dtm",
    country: "KE",
    name: "数字信贷 / 移动货币（CBK）",
    regulatorRe: /CBK|Central Bank of Kenya|DTM|移动货币|数字信贷/i,
    holderRe: /数字信贷|DTM|移动货币|M-Pesa|Fuliza/i,
  },
  // —— 南非 ——
  {
    id: "ZA-ncr",
    country: "ZA",
    name: "消费信贷（NCR/SARB）",
    regulatorRe: /NCR|SARB|National Credit|消费信贷/i,
    holderRe: /消费信贷|NCR|信贷提供者/i,
  },
  // —— 加纳 / 坦桑 / 乌干达 / 科特迪瓦 ——
  {
    id: "GH-credit",
    country: "GH",
    name: "非银信贷 / 支付（BoG）",
    regulatorRe: /BoG|Bank of Ghana|非银|支付/i,
    holderRe: /非银|微金融|支付|信贷/i,
  },
  {
    id: "TZ-credit",
    country: "TZ",
    name: "微金融 / 数字信贷（BoT）",
    regulatorRe: /Bank of Tanzania|BoT｜|微金融|数字信贷/i,
    holderRe: /微金融|数字信贷|移动货币/i,
  },
  {
    id: "UG-credit",
    country: "UG",
    name: "微金融 / 数字信贷（BoU）",
    regulatorRe: /Bank of Uganda|BoU｜|微金融|数字信贷/i,
    holderRe: /微金融|数字信贷|移动货币/i,
  },
  {
    id: "CI-credit",
    country: "CI",
    name: "BCEAO / 本地信贷",
    regulatorRe: /BCEAO|CREPMF|西非|信贷/i,
    holderRe: /信贷|微金融|支付|BNPL/i,
  },
  // —— 中国台湾 ——
  {
    id: "TW-bank",
    country: "TW",
    name: "银行 / 数位银行",
    regulatorRe: /金管会|FSC|银行局|数位银行/i,
    holderRe: /银行|数位银行|纯网银/i,
  },
  {
    id: "TW-elec",
    country: "TW",
    name: "电子支付机构",
    regulatorRe: /金管会|FSC|电子支付|电支/i,
    holderRe: /电子支付|电支/i,
  },
  // —— 新加坡 ——
  {
    id: "SG-major",
    country: "SG",
    name: "商业银行（MAS）",
    regulatorRe: /MAS|Monetary Authority|商业银行|银行/i,
    holderRe: /银行|商业银行|DBS|OCBC|UOB/i,
  },
  {
    id: "SG-digital",
    country: "SG",
    name: "数字银行（MAS）",
    regulatorRe: /MAS|digital\s*bank|数字银行/i,
    holderRe: /数字银行|digital\s*bank|GXS|Trust Bank/i,
  },
  {
    id: "SG-payment",
    country: "SG",
    name: "支付机构（MPI）",
    regulatorRe: /MAS|MPI|支付|Payment/i,
    holderRe: /MPI|支付|钱包/i,
  },
  // —— 日本 ——
  {
    id: "JP-moneylend",
    country: "JP",
    name: "贷金业登记",
    regulatorRe: /FSA|金融庁|贷金|貸金/i,
    holderRe: /贷金|貸金|消费者金融/i,
  },
  // —— 美国 ——
  {
    id: "US-bank",
    country: "US",
    name: "银行 / ILC",
    regulatorRe: /OCC|FDIC|Federal Reserve|州银行|银行/i,
    holderRe: /银行|Bank|ILC|FDIC/i,
  },
  {
    id: "US-msb",
    country: "US",
    name: "货币服务业务（MSB）",
    regulatorRe: /FinCEN|MSB|州放贷|MTL/i,
    holderRe: /MSB|MTL|货币服务|州放贷/i,
  },
  // —— 英国 ——
  {
    id: "GB-cca",
    country: "GB",
    name: "消费信贷（FCA）",
    regulatorRe: /FCA|PRA|消费信贷|Consumer Credit/i,
    holderRe: /消费信贷|Consumer Credit|FCA/i,
  },
];

/** 监管官方名录信源（对照时点写入 licenseReg；非实时爬取） */
const REGULATORY_DIRECTORY_SOURCES = {
  nfraBankCorp:
    "金管总局《银行业金融机构法人名单》截至2025-06-30（准入司2025-10披露）",
  pdicDigibank: "PDIC Directory of Insured Digital Banks（对照 BSP 数字银行牌照）",
  ojkLpbbti: "OJK LPBBTI 持牌名录（官网公开名单交叉）",
} as const;

type OfficialLicenseHolder = {
  group: string;
  region: Exclude<Region, "all">;
  line: "cash" | "bnpl" | "lease" | "agent";
  legalName: string;
  /** 机构编码；无编码时留空 */
  code: string;
  licenseKindLabel: string;
  source: keyof typeof REGULATORY_DIRECTORY_SOURCES;
  controller?: string;
};

/** 金管总局名录·消费金融公司 31 家（机构类型：消费金融公司） */
const NFRA_CONSUMER_FINANCE_HOLDERS: OfficialLicenseHolder[] = [
  {
    group: "北银消费金融｜北银消金｜北银（北银消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "北银消费金融有限公司",
    code: "X0001H211000001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "北京银行体系发起；法定主体北银消费金融有限公司",
  },
  {
    group: "四川锦程消费金融｜锦程消金｜锦程（锦程消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "四川锦程消费金融有限责任公司",
    code: "X0002H251010001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "中银消费金融｜中银消金｜中行（中银消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "中银消费金融有限公司",
    code: "X0003H231000001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "中国银行体系发起；法定主体中银消费金融有限公司",
  },
  {
    group: "天津京东消费金融｜京东消金｜京东（京东消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "天津京东消费金融有限公司",
    code: "X0004H212000001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "京东体系关联；法定主体天津京东消费金融有限公司",
  },
  {
    group: "兴业消费金融｜兴业消金｜兴业（兴业消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "兴业消费金融股份公司",
    code: "X0005H335050001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "兴业银行体系发起；法定主体兴业消费金融股份公司",
  },
  {
    group: "海尔消费金融｜海尔消金｜海尔（海尔消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "海尔消费金融有限公司",
    code: "X0006H237020001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "招商银行+中国联通｜招联｜招联（招联·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "招联消费金融股份有限公司",
    code: "X0007H244030001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "发起方：招商银行 + 中国联通；招联消费金融为持牌主体",
  },
  {
    group: "湖北消费金融｜湖北消金｜湖北消金（湖北消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "湖北消费金融股份有限公司",
    code: "X0008H242010001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "南银法巴消费金融｜南银法巴｜南银法巴（南银法巴·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "南银法巴消费金融有限公司",
    code: "X0009H232010001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "中关村科金｜马上｜中科金（中科金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "马上消费金融股份有限公司",
    code: "X0010H250000001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "北京中关村科金技术有限公司（中科金）；马上消费为境内持牌消金主体，不作玩家主名",
  },
  {
    group: "中国邮政｜中邮消费｜中国邮政（中邮·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "中邮消费金融有限公司",
    code: "X0011H244010001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "发起方：中国邮政体系；中邮消费金融为持牌主体",
  },
  {
    group: "杭银消费金融｜杭银消金｜杭银（杭银消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "杭银消费金融股份有限公司",
    code: "X0012H233010001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "浙江宁银消费金融｜宁银消金｜宁银（宁银消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "浙江宁银消费金融股份有限公司",
    code: "X0013H233020001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "晋商消费金融｜晋商消金｜晋商（晋商消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "晋商消费金融股份有限公司",
    code: "X0014H214010001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "盛银消费金融｜盛银消金｜盛京（盛银消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "盛银消费金融有限公司",
    code: "X0015H221010001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "陕西长银消费金融｜长银消金｜长银（长银消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "陕西长银消费金融有限公司",
    code: "X0016H261010001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "内蒙古蒙商消费金融｜蒙商消金｜蒙商（蒙商消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "内蒙古蒙商消费金融股份有限公司",
    code: "X0017H315020001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "中原银行｜中原消费｜中原银行（中原·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "河南中原消费金融股份有限公司",
    code: "X0018H241010001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "发起方：中原银行；中原消费金融为持牌主体",
  },
  {
    group: "湖南长银五八消费金融｜长银五八｜五八（长银五八·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "湖南长银五八消费金融股份有限公司",
    code: "X0019H243010001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "哈尔滨哈银消费金融｜哈银消金｜哈银（哈银消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "哈尔滨哈银消费金融有限责任公司",
    code: "X0020H223010001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "河北幸福消费金融｜幸福消金｜幸福（幸福消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "河北幸福消费金融股份有限公司",
    code: "X0021H213010001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "上海尚诚消费金融｜尚诚消金｜尚诚（尚诚消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "上海尚诚消费金融股份有限公司",
    code: "X0022H231000001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "厦门金美信消费金融｜金美信｜金美信（金美信·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "厦门金美信消费金融有限责任公司",
    code: "X0023H235020001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "中信消费金融｜中信消金｜中信（中信消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "中信消费金融有限公司",
    code: "X0024H211000001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "中信银行体系发起；法定主体中信消费金融有限公司",
  },
  {
    group: "平安消费金融｜平安消金｜平安（平安消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "平安消费金融有限公司",
    code: "X0025H231000001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "平安集团体系；法定主体平安消费金融有限公司",
  },
  {
    group: "重庆小米消费金融｜小米消金｜小米（小米消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "重庆小米消费金融有限公司",
    code: "X0026H250000001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "小米集团关联；法定主体重庆小米消费金融有限公司",
  },
  {
    group: "北京阳光消费金融｜阳光消金｜阳光（阳光消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "北京阳光消费金融股份有限公司",
    code: "X0027H211000001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "苏银凯基消费金融｜苏银凯基｜苏银凯基（苏银凯基·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "苏银凯基消费金融有限公司",
    code: "X0028H332050001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
  },
  {
    group: "重庆蚂蚁消费金融｜蚂蚁消金｜蚂蚁（蚂蚁消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "重庆蚂蚁消费金融有限公司",
    code: "X0029H250000001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "蚂蚁集团关联；法定主体重庆蚂蚁消费金融有限公司",
  },
  {
    group: "四川省唯品富邦消费金融｜唯品富邦｜唯品（唯品富邦·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "四川省唯品富邦消费金融有限公司",
    code: "X0030H251010001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "唯品会/富邦关联；法定主体四川省唯品富邦消费金融有限公司",
  },
  {
    group: "建信消费金融｜建信消金｜建行（建信消金·CN）",
    region: "east-asia",
    line: "cash",
    legalName: "建信消费金融有限责任公司",
    code: "X0031H211000001",
    licenseKindLabel: "消费金融",
    source: "nfraBankCorp",
    controller: "建设银行体系发起；法定主体建信消费金融有限责任公司",
  },
];

/** 金管总局名录·汽车金融公司 25 家（机构类型：汽车金融公司） */
const NFRA_AUTO_FINANCE_HOLDERS: OfficialLicenseHolder[] = [
  { group: "大众汽车金融｜大众汽金｜大众（大众汽金·CN）", region: "east-asia", line: "lease", legalName: "大众汽车金融（中国）有限公司", code: "N0001H211000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "丰田汽车金融｜丰田汽金｜丰田（丰田汽金·CN）", region: "east-asia", line: "lease", legalName: "丰田汽车金融（中国）有限公司", code: "N0002H211000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "梅赛德斯-奔驰汽车金融｜奔驰汽金｜奔驰（奔驰汽金·CN）", region: "east-asia", line: "lease", legalName: "梅赛德斯-奔驰汽车金融有限公司", code: "N0003H211000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "东风汽车金融｜东风汽金｜东风（东风汽金·CN）", region: "east-asia", line: "lease", legalName: "东风汽车金融有限公司", code: "N0004H211000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "沃尔沃汽车金融｜沃尔沃汽金｜沃尔沃（沃尔沃汽金·CN）", region: "east-asia", line: "lease", legalName: "沃尔沃汽车金融（中国）有限公司", code: "N0005H211000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "上汽通用汽车金融｜上汽通用汽金｜上汽通用（上汽通用汽金·CN）", region: "east-asia", line: "lease", legalName: "上汽通用汽车金融有限责任公司", code: "N0006H231000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "福特汽车金融｜福特汽金｜福特（福特汽金·CN）", region: "east-asia", line: "lease", legalName: "福特汽车金融（中国）有限公司", code: "N0007H231000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "东风日产汽车金融｜日产汽金｜日产（日产汽金·CN）", region: "east-asia", line: "lease", legalName: "东风日产汽车金融有限公司", code: "N0008H231000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "斯泰兰蒂斯汽车金融｜斯泰兰蒂斯汽金｜斯泰兰蒂斯（斯泰兰蒂斯汽金·CN）", region: "east-asia", line: "lease", legalName: "斯泰兰蒂斯汽车金融有限公司", code: "N0009H231000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "广汽汇理汽车金融｜广汽汇理｜广汽（广汽汇理·CN）", region: "east-asia", line: "lease", legalName: "广汽汇理汽车金融有限公司", code: "N0011H244010001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "宝马汽车金融｜宝马汽金｜宝马（宝马汽金·CN）", region: "east-asia", line: "lease", legalName: "宝马汽车金融（中国）有限公司", code: "N0012H211000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "三一汽车金融｜三一汽金｜三一（三一汽金·CN）", region: "east-asia", line: "lease", legalName: "三一汽车金融有限公司", code: "N0013H243010001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "一汽汽车金融｜一汽汽金｜一汽（一汽汽金·CN）", region: "east-asia", line: "lease", legalName: "一汽汽车金融有限公司", code: "N0014H222010001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "北京现代汽车金融｜现代汽金｜现代（现代汽金·CN）", region: "east-asia", line: "lease", legalName: "北京现代汽车金融有限公司", code: "N0015H211000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "天津长城滨银汽车金融｜长城汽金｜长城（长城汽金·CN）", region: "east-asia", line: "lease", legalName: "天津长城滨银汽车金融有限公司", code: "N0016H212000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "长安汽车金融｜长安汽金｜长安（长安汽金·CN）", region: "east-asia", line: "lease", legalName: "长安汽车金融有限公司", code: "N0017H250000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "瑞福德汽车金融｜瑞福德｜瑞福德（瑞福德·CN）", region: "east-asia", line: "lease", legalName: "瑞福德汽车金融有限公司", code: "N0018H234010001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "奇瑞徽银汽车金融｜奇瑞徽银｜奇瑞（奇瑞徽银·CN）", region: "east-asia", line: "lease", legalName: "奇瑞徽银汽车金融股份有限公司", code: "N0019H334020001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "比亚迪汽车金融｜比亚迪汽金｜比亚迪（比亚迪汽金·CN）", region: "east-asia", line: "lease", legalName: "比亚迪汽车金融有限公司", code: "N0020H261010001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "华泰汽车金融｜华泰汽金｜华泰（华泰汽金·CN）", region: "east-asia", line: "lease", legalName: "华泰汽车金融有限公司", code: "N0021H212000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "上海东正汽车金融｜东正汽金｜东正（东正汽金·CN）", region: "east-asia", line: "lease", legalName: "上海东正汽车金融股份有限公司", code: "N0022H231000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "华晨东亚汽车金融｜华晨东亚｜华晨（华晨东亚·CN）", region: "east-asia", line: "lease", legalName: "华晨东亚汽车金融有限公司", code: "N0023H231000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "吉致汽车金融｜吉致汽金｜吉致（吉致汽金·CN）", region: "east-asia", line: "lease", legalName: "吉致汽车金融有限公司", code: "N0024H231000001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "重汽汽车金融｜重汽汽金｜重汽（重汽汽金·CN）", region: "east-asia", line: "lease", legalName: "重汽汽车金融有限公司", code: "N0025H237010001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
  { group: "北汽汽车金融｜北汽汽金｜北汽（北汽汽金·CN）", region: "east-asia", line: "lease", legalName: "北汽汽车金融（杭州）有限公司", code: "N0027H233010001", licenseKindLabel: "汽车金融", source: "nfraBankCorp" },
];

/** PDIC/BSP：菲律宾投保数字银行 6 家 */
const PH_DIGITAL_BANK_HOLDERS: OfficialLicenseHolder[] = [
  {
    group: "Maya Bank｜Maya｜Voyager（MayaBank·PH）",
    region: "se-asia",
    line: "cash",
    legalName: "Maya Bank, Inc.",
    code: "",
    licenseKindLabel: "BSP数字银行/PDIC投保",
    source: "pdicDigibank",
    controller: "Voyager Innovations / Maya；数字银行法人 Maya Bank, Inc.",
  },
  {
    group: "GoTyme Bank｜GoTyme｜Gokongwei（GoTyme·PH）",
    region: "se-asia",
    line: "cash",
    legalName: "GoTyme Bank Corporation",
    code: "",
    licenseKindLabel: "BSP数字银行/PDIC投保",
    source: "pdicDigibank",
    controller: "Tyme / Gokongwei Group；法定主体 GoTyme Bank Corporation",
  },
  {
    group: "Overseas Filipino Bank｜OFBank｜LANDBANK（OFBank·PH）",
    region: "se-asia",
    line: "cash",
    legalName: "Overseas Filipino Bank, Inc., A Digital Bank of LANDBANK",
    code: "",
    licenseKindLabel: "BSP数字银行/PDIC投保",
    source: "pdicDigibank",
    controller: "LANDBANK 体系；法定主体 Overseas Filipino Bank, Inc.",
  },
  {
    group: "Tonik Digital Bank｜Tonik｜Tonik（Tonik·PH）",
    region: "se-asia",
    line: "cash",
    legalName: "Tonik Digital Bank, Inc.",
    code: "",
    licenseKindLabel: "BSP数字银行/PDIC投保",
    source: "pdicDigibank",
    controller: "Tonik Financial Pte Ltd 关联；法定主体 Tonik Digital Bank, Inc.",
  },
  {
    group: "UnionDigital Bank｜UnionDigital｜UnionBank（UnionDigital·PH）",
    region: "se-asia",
    line: "cash",
    legalName: "UnionDigital Bank, Inc.",
    code: "",
    licenseKindLabel: "BSP数字银行/PDIC投保",
    source: "pdicDigibank",
    controller: "Union Bank of the Philippines；法定主体 UnionDigital Bank, Inc.",
  },
  {
    group: "UNObank｜UNO｜UNOAsia（UNObank·PH）",
    region: "se-asia",
    line: "cash",
    legalName: "UNObank, Inc.",
    code: "",
    licenseKindLabel: "BSP数字银行/PDIC投保",
    source: "pdicDigibank",
    controller: "UNOAsia Pte Ltd 关联；法定主体 UNObank, Inc.",
  },
];

const OFFICIAL_LICENSE_HOLDERS: OfficialLicenseHolder[] = [
  ...NFRA_CONSUMER_FINANCE_HOLDERS,
  ...NFRA_AUTO_FINANCE_HOLDERS,
  ...PH_DIGITAL_BANK_HOLDERS,
];

const OFFICIAL_LICENSE_BY_GROUP: Record<string, OfficialLicenseHolder> = Object.fromEntries(
  OFFICIAL_LICENSE_HOLDERS.map((h) => [h.group, h]),
);

function formatOfficialLicenseReg(h: OfficialLicenseHolder): string {
  const src = REGULATORY_DIRECTORY_SOURCES[h.source];
  if (h.source === "nfraBankCorp") {
    return `CN：${h.legalName}（${h.licenseKindLabel}；机构编码 ${h.code}；来源：${src}）`;
  }
  if (h.source === "pdicDigibank") {
    return `PH：${h.legalName}（${h.licenseKindLabel}；来源：${src}）`;
  }
  return `${h.legalName}（${h.licenseKindLabel}；来源：${src}）`;
}

function licensesForGeo(region: Region, country: CountryCode): RegLicenseDef[] {
  const countries =
    country !== "all"
      ? [country]
      : region === "all"
        ? (Object.keys(COUNTRY_LABEL).filter((c) => c !== "all") as Exclude<CountryCode, "all">[])
        : COUNTRIES_BY_REGION[region];
  const set = new Set(countries);
  return REGULATORY_LICENSE_CATALOG.filter((l) => set.has(l.country));
}

function regulatorMatchesLicense(r: CreditRow, lic: RegLicenseDef): boolean {
  const blob = `${r.group} ${r.brands} ${r.licenses} ${r.licenseReg} ${r.note} ${r.regulators}`;
  if (!matchesCountry(r.group, r.countries, lic.country)) return false;
  return lic.regulatorRe.test(blob);
}

function playerHoldsLicense(r: { licenseReg: string; licenses?: string; group: string; countries: string }, lic: RegLicenseDef): boolean {
  if (!matchesCountry(r.group, r.countries, lic.country)) return false;
  const blob = `${r.licenseReg} ${r.licenses ?? ""}`;
  return lic.holderRe.test(blob);
}

/** 国家筛：组名含 ·XX / 国别简称，或 countries 字段含中文名/别名 */
const COUNTRY_ALIASES: Record<Exclude<CountryCode, "all">, string[]> = {
  CN: ["中国"],
  TW: ["中国台湾", "台湾", "台灣", "Taiwan"],
  JP: ["日本"],
  KR: ["韩国"],
  MN: ["外蒙古", "蒙古", "蒙古国"],
  ID: ["印度尼西亚", "印尼"],
  VN: ["越南"],
  MY: ["马来西亚", "马来"],
  TH: ["泰国"],
  PH: ["菲律宾"],
  IN: ["印度"],
  BD: ["孟加拉"],
  PK: ["巴基斯坦"],
  LK: ["斯里兰卡"],
  KZ: ["哈萨克斯坦"],
  UZ: ["乌兹别克斯坦"],
  KG: ["吉尔吉斯斯坦", "吉尔吉斯"],
  TJ: ["塔吉克斯坦"],
  TM: ["土库曼斯坦"],
  MX: ["墨西哥"],
  BR: ["巴西"],
  CO: ["哥伦比亚"],
  AR: ["阿根廷"],
  PE: ["秘鲁"],
  CL: ["智利"],
  EG: ["埃及"],
  MA: ["摩洛哥", "Morocco"],
  DZ: ["阿尔及利亚", "Algeria"],
  TN: ["突尼斯", "Tunisia"],
  LY: ["利比亚", "Libya"],
  SD: ["苏丹", "Sudan"],
  SA: ["沙特", "沙特阿拉伯"],
  AE: ["阿联酋", "阿拉伯联合酋长国", "UAE"],
  BH: ["巴林", "Bahrain"],
  QA: ["卡塔尔", "Qatar"],
  KW: ["科威特", "Kuwait"],
  OM: ["阿曼", "Oman"],
  JO: ["约旦", "Jordan"],
  LB: ["黎巴嫩", "Lebanon"],
  IQ: ["伊拉克", "Iraq"],
  IL: ["以色列", "Israel"],
  PS: ["巴勒斯坦", "Palestine"],
  TR: ["土耳其", "Türkiye", "Turkey"],
  YE: ["也门", "Yemen"],
  IR: ["伊朗", "Iran"],
  NG: ["尼日利亚", "Nigeria"],
  KE: ["肯尼亚", "Kenya"],
  GH: ["加纳", "Ghana"],
  ZA: ["南非", "South Africa"],
  TZ: ["坦桑尼亚", "Tanzania"],
  UG: ["乌干达", "Uganda"],
  RW: ["卢旺达", "Rwanda"],
  ET: ["埃塞俄比亚", "Ethiopia"],
  CI: ["科特迪瓦", "Ivory Coast", "Côte d'Ivoire", "Cote d'Ivoire"],
  SN: ["塞内加尔", "Senegal"],
  CM: ["喀麦隆", "Cameroon"],
  AO: ["安哥拉", "Angola"],
  MZ: ["莫桑比克", "Mozambique"],
  ZM: ["赞比亚", "Zambia"],
  ZW: ["津巴布韦", "Zimbabwe"],
  BW: ["博茨瓦纳", "Botswana"],
  NA: ["纳米比亚", "Namibia"],
  MU: ["毛里求斯", "Mauritius"],
  MG: ["马达加斯加", "Madagascar"],
  BJ: ["贝宁", "Benin"],
  BF: ["布基纳法索", "Burkina Faso"],
  ML: ["马里", "Mali"],
  CD: ["刚果（金）", "刚果金", "DRC", "Congo"],
  GA: ["加蓬", "Gabon"],
  US: ["美国"],
  CA: ["加拿大", "Canada"],
  GB: ["英国", "UK", "United Kingdom", "Britain"],
  DE: ["德国", "Germany"],
  FR: ["法国", "France"],
  NL: ["荷兰", "Netherlands"],
  ES: ["西班牙", "Spain"],
  PT: ["葡萄牙", "Portugal"],
  IT: ["意大利", "Italy"],
  SE: ["瑞典", "Sweden"],
  PL: ["波兰", "Poland"],
  IE: ["爱尔兰", "Ireland"],
};

function matchesCountry(group: string, countries: string, country: CountryCode): boolean {
  if (country === "all") return true;
  // 「全球」口径服务覆盖：匹配任意已建档国家（用于流量平台等跨国投放）
  if (hasWorldwideCoverage(countries)) return true;
  const blob = `${group} ${countries}`;
  if (country === "TW") {
    return (
      /中国台湾|台湾|台灣|Taiwan|(?:^|[\s、;；,/])TW(?:$|[\s、;；,/])/i.test(blob) ||
      group.includes("·TW")
    );
  }
  if (country === "CN") {
    if (group.includes("·TW") && !group.includes("·CN")) return false;
    if (
      /中国台湾|台湾|台灣|(?:^|[\s、;；,/])TW(?:$|[\s、;；,/])/i.test(blob) &&
      !/中国(?!台湾)/.test(blob) &&
      !group.includes("·CN")
    ) {
      return false;
    }
    if (group.includes("·CN") || /(?:^|[\s、;；,/])CN(?:$|[\s、;；,/])/.test(blob)) return true;
    if (/中国(?!台湾)/.test(blob)) return true;
    return false;
  }
  if (group.includes(`·${country}`)) return true;
  if (new RegExp(`[·（(]${country}[）)]`).test(group)) return true;
  return COUNTRY_ALIASES[country].some((a) => blob.includes(a));
}

/** countries 字段是否声明全球/多国覆盖（须以全球起首或明确「全球多国」等，避免文案里顺带写「全球」误伤） */
function hasWorldwideCoverage(countries: string): boolean {
  const t = countries.trim();
  if (/^全球(\s|$|（|\(|\/|多国|及)/.test(t)) return true;
  if (/^Worldwide\b/i.test(t)) return true;
  if (/全球多国|多国办公室|欧洲及全球|全球及/.test(t)) return true;
  return false;
}

const LINE_LABEL = {
  cash: "现金贷",
  bnpl: "消费分期/BNPL",
  lease: "信用租赁",
  agent: "信贷超市",
} as const;

const CREDIT_PROD_L1_ORDER: Exclude<CreditProdL1, "all">[] = [
  "个人信贷",
  "企业信贷",
  "信贷超市",
  "信贷其他",
];

const CREDIT_PROD_L2_BY_L1: Record<Exclude<CreditProdL1, "all">, Exclude<CreditProdL2, "all">[]> = {
  个人信贷: ["消费信贷", "住房信贷", "汽车信贷"],
  企业信贷: ["流贷", "固贷", "提前收款", "订单融资", "发票融资"],
  信贷超市: [],
  信贷其他: ["学生贷", "农户贷", "公务员贷"],
};

const CREDIT_PROD_L3_BY_L2: Partial<Record<Exclude<CreditProdL2, "all">, Exclude<CreditProdL3, "all">[]>> = {
  消费信贷: ["现金贷", "消费分期/BNPL", "信用卡", "信用租赁"],
  住房信贷: ["按揭贷", "抵押贷"],
  汽车信贷: ["新车贷", "二手车贷"],
};

const SUBSIDY_ROLE_ORDER: SubsidyRole[] = ["商户", "政府", "平台", "其他"];
const GUARANTEE_ROLE_ORDER: GuaranteeRole[] = ["商户", "政府", "平台", "担保/保险公司", "其他"];

function creditLeavesUnder(l1: CreditProdL1, l2: CreditProdL2): string[] {
  if (l1 === "all") return [];
  if (l1 === "信贷超市") return ["信贷超市"];
  if (l2 === "all") {
    const l2s = CREDIT_PROD_L2_BY_L1[l1];
    const out: string[] = [];
    for (const x of l2s) {
      const l3s = CREDIT_PROD_L3_BY_L2[x];
      if (l3s?.length) out.push(...l3s);
      else out.push(x);
    }
    return out;
  }
  const l3s = CREDIT_PROD_L3_BY_L2[l2];
  if (l3s?.length) return [...l3s];
  return [l2];
}

/** 从信贷行推断命中的产品叶子（库内 line/tags + 文案弱匹配） */
function inferCreditProductLeaves(r: CreditRow): Set<string> {
  const out = new Set<string>();
  if (r.line === "cash") out.add("现金贷");
  if (r.line === "bnpl") out.add("消费分期/BNPL");
  if (r.line === "lease") out.add("信用租赁");
  if (r.line === "agent") out.add("信贷超市");
  if (r.tags.includes("信用卡")) out.add("信用卡");
  const blob = `${r.group} ${r.brands} ${r.note} ${r.licenses} ${r.diandian} ${r.volume}`;
  if (/按揭|房贷|住房贷|按揭贷/i.test(blob)) out.add("按揭贷");
  if (/抵押贷|房产抵押|房屋抵押/i.test(blob)) out.add("抵押贷");
  if (/二手车/i.test(blob)) out.add("二手车贷");
  else if (/新车贷|汽车金融|车贷|汽车分期/i.test(blob)) out.add("新车贷");
  if (/流贷|流动资金贷|经营贷/i.test(blob)) out.add("流贷");
  if (/固贷|固定资产贷|设备贷/i.test(blob)) out.add("固贷");
  if (/提前收款|预支|商户收款加速/i.test(blob)) out.add("提前收款");
  if (/订单融资|采购融资/i.test(blob)) out.add("订单融资");
  if (/发票融资|保理|应收账款/i.test(blob)) out.add("发票融资");
  if (/学生贷|校园贷|学贷/i.test(blob)) out.add("学生贷");
  if (/农户|涉农|三农|农贷/i.test(blob)) out.add("农户贷");
  if (/公务员|公职/i.test(blob)) out.add("公务员贷");
  if (/贷超|比价|信贷超市|导流平台/i.test(blob)) out.add("信贷超市");
  return out;
}

function matchesCreditProductTree(
  r: CreditRow,
  l1: CreditProdL1,
  l2: CreditProdL2,
  l3: CreditProdL3,
): boolean {
  if (l1 === "all") return true;
  const leaves = inferCreditProductLeaves(r);
  if (l3 !== "all") return leaves.has(l3);
  const allowed = creditLeavesUnder(l1, l2);
  if (!allowed.length) return l1 === "信贷超市" ? leaves.has("信贷超市") : false;
  return allowed.some((x) => leaves.has(x));
}

function inferSubsidy(r: CreditRow): { has: boolean | null; roles: SubsidyRole[] } {
  const blob = `${r.note} ${r.licenses} ${r.diandian} ${r.volume} ${r.brands}`;
  if (!/贴息|免息|0息|零息|利息补贴|商户贴息|政府贴息|平台贴息/i.test(blob)) {
    return { has: null, roles: [] };
  }
  const roles: SubsidyRole[] = [];
  if (/商户贴息|商家贴息|商户.*贴息|贴息.*商户/i.test(blob)) roles.push("商户");
  if (/政府贴息|财政贴息|贴息.*政府|政府.*贴息/i.test(blob)) roles.push("政府");
  if (/平台贴息|平台.*贴息|贴息.*平台/i.test(blob)) roles.push("平台");
  if (!roles.length) roles.push("其他");
  return { has: true, roles };
}

function inferGuarantee(r: CreditRow): { has: boolean | null; roles: GuaranteeRole[] } {
  const blob = `${r.note} ${r.licenses} ${r.diandian} ${r.volume} ${r.brands} ${r.regulators}`;
  if (!/担保|融担|保证保险|担保公司|保险担保|增信/i.test(blob)) {
    return { has: null, roles: [] };
  }
  const roles: GuaranteeRole[] = [];
  if (/商户担保|商家担保/i.test(blob)) roles.push("商户");
  if (/政府担保|政策性担保|政府.*担保/i.test(blob)) roles.push("政府");
  if (/平台担保|平台.*担保/i.test(blob)) roles.push("平台");
  if (/担保公司|融担|保证保险|保险公司.*担保|担保\/保险/i.test(blob)) roles.push("担保/保险公司");
  if (!roles.length) roles.push("其他");
  return { has: true, roles };
}

function parseRoleCsv<T extends string>(raw: string, allowed: readonly T[]): T[] {
  if (!raw || raw === "all") return [];
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter((x): x is T => (allowed as readonly string[]).includes(x));
}

function toggleRoleCsv<T extends string>(raw: string, role: T): string {
  const cur = new Set(raw.split(",").map((x) => x.trim()).filter(Boolean));
  if (cur.has(role)) cur.delete(role);
  else cur.add(role);
  return [...cur].join(",");
}

function matchesSubsidyFilter(
  r: CreditRow,
  flag: SubsidyFlag,
  rolesCsv: string,
): boolean {
  if (flag === "all") return true;
  const inf = inferSubsidy(r);
  if (flag === "no") return inf.has === false || inf.has === null;
  if (inf.has !== true) return false;
  const want = parseRoleCsv(rolesCsv, SUBSIDY_ROLE_ORDER);
  if (!want.length) return true;
  return want.some((x) => inf.roles.includes(x));
}

function matchesGuaranteeFilter(
  r: CreditRow,
  flag: GuaranteeFlag,
  rolesCsv: string,
): boolean {
  if (flag === "all") return true;
  const inf = inferGuarantee(r);
  if (flag === "no") return inf.has === false || inf.has === null;
  if (inf.has !== true) return false;
  const want = parseRoleCsv(rolesCsv, GUARANTEE_ROLE_ORDER);
  if (!want.length) return true;
  return want.some((x) => inf.roles.includes(x));
}

function creditProductFilterLabel(l1: CreditProdL1, l2: CreditProdL2, l3: CreditProdL3): string {
  if (l1 === "all") return "全部信贷产品";
  if (l3 !== "all") return l3;
  if (l2 !== "all") return l2;
  return l1;
}

/** CRM 机构类型：玩家（下场）在前，其余为非下场生态角色 */
const INSTITUTION_TYPE_ORDER: InstitutionType[] = [
  "玩家",
  "流量服务商",
  "数据服务方",
  "监管",
  "资金参与机构",
  "风险参与机构",
  "风控服务方",
  "支付服务机构",
  "回收机构",
  "权益服务商",
  "触达服务机构",
  "公关服务机构",
  "信托服务机构",
  "会计师事务所",
  "律师事务所",
  "评级机构",
];

/** 市场定位×服务性质五大类（流量服务商单列在业务运营服务商下） */
type InstBucket =
  | "用户端"
  | "监管与合规中介"
  | "资本风险方"
  | "业务运营服务商"
  | "基础设施服务商";

const INST_BUCKET_ORDER: InstBucket[] = [
  "用户端",
  "监管与合规中介",
  "资本风险方",
  "业务运营服务商",
  "基础设施服务商",
];

const INST_BUCKET_TYPES: Record<InstBucket, InstitutionType[]> = {
  用户端: ["玩家"],
  监管与合规中介: ["监管", "会计师事务所", "律师事务所", "评级机构"],
  资本风险方: ["资金参与机构", "风险参与机构"],
  业务运营服务商: ["流量服务商", "回收机构", "权益服务商", "触达服务机构", "公关服务机构"],
  基础设施服务商: ["数据服务方", "风控服务方", "支付服务机构", "信托服务机构"],
};

const INST_BUCKET_LABEL: Record<InstBucket, string> = {
  用户端: "用户端",
  监管与合规中介: "监管与合规中介",
  资本风险方: "资本风险方",
  业务运营服务商: "业务运营服务商",
  基础设施服务商: "基础设施服务商",
};

const INST_TYPE_TO_BUCKET: Record<InstitutionType, InstBucket> = {
  玩家: "用户端",
  监管: "监管与合规中介",
  会计师事务所: "监管与合规中介",
  律师事务所: "监管与合规中介",
  评级机构: "监管与合规中介",
  资金参与机构: "资本风险方",
  风险参与机构: "资本风险方",
  流量服务商: "业务运营服务商",
  回收机构: "业务运营服务商",
  权益服务商: "业务运营服务商",
  触达服务机构: "业务运营服务商",
  公关服务机构: "业务运营服务商",
  数据服务方: "基础设施服务商",
  风控服务方: "基础设施服务商",
  支付服务机构: "基础设施服务商",
  信托服务机构: "基础设施服务商",
};

function primaryInstBucket(types: InstitutionType[]): InstBucket {
  const t = types.find((x) => x !== "玩家") ?? types[0] ?? "玩家";
  return INST_TYPE_TO_BUCKET[t];
}

function isComplianceIntermediary(types: InstitutionType[]): boolean {
  return types.some((t) => INST_BUCKET_TYPES.监管与合规中介.includes(t));
}
const INSTITUTION_TYPE_LABEL: Record<InstitutionType, string> = {
  玩家: "玩家（下场）",
  流量服务商: "流量服务商",
  数据服务方: "数据服务方",
  监管: "监管",
  资金参与机构: "资金参与机构",
  风险参与机构: "风险参与机构",
  风控服务方: "风控服务方",
  支付服务机构: "支付服务机构",
  回收机构: "回收机构",
  权益服务商: "权益服务商",
  触达服务机构: "触达服务机构",
  公关服务机构: "公关服务机构",
  信托服务机构: "信托服务机构",
  会计师事务所: "会计师事务所",
  律师事务所: "律师事务所",
  评级机构: "评级机构",
};
const INSTITUTION_TYPE_BLURB: Record<InstitutionType, string> = {
  玩家: "下场展业主体；按场景原生 / 信贷原生浏览。",
  流量服务商: "流量平台、代理商、贷超、代理运营。",
  数据服务方: "征信、多头、替代数据等。",
  监管: "央行/行业监管名录；洲际→国家→法定牌照交叉筛选。",
  资金参与机构: "本地银行、代理、结构化、优先/夹层投资人。",
  风险参与机构: "保险等增信与风险分担。",
  风控服务方: "信用评分、反欺诈、核验与风控决策等 B 端能力（非 To C 场景词条）。",
  支付服务机构: "出金/入金/资金监管相关支付。",
  回收机构: "贷后回收、委外催收与资产处置。",
  权益服务商: "会员权益、积分、搭售增值包。",
  触达服务机构: "短信、推送、外呼、即时消息。",
  公关服务机构: "品牌公关、危机传播、媒体关系。",
  信托服务机构: "信托计划、ABS/资产信托等受托服务。",
  会计师事务所: "审计、验资、财务尽调。",
  律师事务所: "金融法务、合规、争议解决。",
  评级机构: "主体/债项信用评级。",
};

const ECO_ROLE_ORDER: EcoRole[] = INSTITUTION_TYPE_ORDER.filter((t): t is EcoRole => t !== "玩家");
const ECO_ROLE_LABEL: Record<EcoRole, string> = {
  流量服务商: INSTITUTION_TYPE_LABEL.流量服务商,
  数据服务方: INSTITUTION_TYPE_LABEL.数据服务方,
  监管: INSTITUTION_TYPE_LABEL.监管,
  资金参与机构: INSTITUTION_TYPE_LABEL.资金参与机构,
  风险参与机构: INSTITUTION_TYPE_LABEL.风险参与机构,
  风控服务方: INSTITUTION_TYPE_LABEL.风控服务方,
  支付服务机构: INSTITUTION_TYPE_LABEL.支付服务机构,
  回收机构: INSTITUTION_TYPE_LABEL.回收机构,
  权益服务商: INSTITUTION_TYPE_LABEL.权益服务商,
  触达服务机构: INSTITUTION_TYPE_LABEL.触达服务机构,
  公关服务机构: INSTITUTION_TYPE_LABEL.公关服务机构,
  信托服务机构: INSTITUTION_TYPE_LABEL.信托服务机构,
  会计师事务所: INSTITUTION_TYPE_LABEL.会计师事务所,
  律师事务所: INSTITUTION_TYPE_LABEL.律师事务所,
  评级机构: INSTITUTION_TYPE_LABEL.评级机构,
};

/** 资金参与机构细分（玩家式二分的同级：进入「资金参与机构」后再筛） */
const FUND_KIND_ORDER: FundParticipationKind[] = [
  "本地银行",
  "本地银行代理",
  "结构化服务商",
  "优先投资人",
  "夹层投资人",
];
const FUND_KIND_LABEL: Record<FundParticipationKind, string> = {
  本地银行: "本地银行",
  本地银行代理: "本地银行代理",
  结构化服务商: "结构化服务商",
  优先投资人: "优先投资人",
  夹层投资人: "夹层投资人",
};
const FUND_KIND_BLURB: Record<FundParticipationKind, string> = {
  本地银行: "当地持牌银行直接出资/联合贷资金方。",
  本地银行代理: "代表或通道对接本地银行资金的代理方。",
  结构化服务商: "ABS/信托计划/结构化融资安排与服务。",
  优先投资人: "结构化中优先层出资人。",
  夹层投资人: "结构化中夹层/次级等中间层出资人。",
};

function resolveFundKinds(
  institutionTypes: InstitutionType[],
  draft?: FundParticipationKind[],
): FundParticipationKind[] {
  if (!institutionTypes.includes("资金参与机构")) return [];
  if (draft?.length) return FUND_KIND_ORDER.filter((k) => draft.includes(k));
  return [];
}

/** 流量服务商细分 */
const TRAFFIC_KIND_ORDER: TrafficServiceKind[] = ["流量平台", "代理商", "贷超", "代理运营"];
const TRAFFIC_KIND_LABEL: Record<TrafficServiceKind, string> = {
  流量平台: "流量平台",
  代理商: "代理商",
  贷超: "贷超",
  代理运营: "代理运营",
};
const TRAFFIC_KIND_BLURB: Record<TrafficServiceKind, string> = {
  流量平台:
    "广告/分发平台：Google、Meta、TikTok、Apple，以及 Snap、X、LinkedIn、Taboola、Outbrain 等；现金贷广告多受限或禁止（见各平台流量服务政策）。",
  代理商:
    "平台授权代理/经销商（Reseller/Agency）与 Partner 目录入口（蓝标等）；区域销售、开户与投放服务。≠现金贷流量掮客。",
  贷超: "线上贷超/比价/导流（LendingTree、Credit Karma、Cermati 等）；部分市场需持牌；Lead gen 受 FTC/CFPB 等审视。",
  代理运营: "代运营、ASO/ASA、榜单与监测（点点、七麦、AppsFlyer/Adjust 等）。",
};

/**
 * 标准可采信源 · 广告平台官方政策与授权代理目录（CRM 核验优先）
 * 代理商 ≠ 现金贷流量渠道；开户后仍须通过平台金融广告审核。
 */
const STANDARD_TRAFFIC_SOURCES: {
  id: string;
  platform: string;
  kind: "广告政策" | "授权代理目录";
  label: string;
  url: string;
}[] = [
  {
    id: "google-ads-finance-policy",
    platform: "Google",
    kind: "广告政策",
    label: "Google Ads 金融产品与服务政策",
    url: "https://support.google.com/adspolicy/answer/2464994",
  },
  {
    id: "google-partners-directory",
    platform: "Google",
    kind: "授权代理目录",
    label: "Google Partner Directory",
    url: "https://www.google.com/partners/agency-search/",
  },
  {
    id: "meta-finance-ads-policy",
    platform: "Meta",
    kind: "广告政策",
    label: "Meta 金融产品和服务广告政策",
    url: "https://www.facebook.com/policies/ads/prohibited_content/financial_products",
  },
  {
    id: "meta-business-partners",
    platform: "Meta",
    kind: "授权代理目录",
    label: "Meta Business Partners / Marketing Partners",
    url: "https://www.facebook.com/business/partners",
  },
  {
    id: "tiktok-ads-industry",
    platform: "TikTok",
    kind: "广告政策",
    label: "TikTok Ads 行业准入/金融服务政策",
    url: "https://ads.tiktok.com/help/article/tiktok-advertising-policies-industry-entry",
  },
  {
    id: "tiktok-marketing-partners",
    platform: "TikTok",
    kind: "授权代理目录",
    label: "TikTok Marketing Partners",
    url: "https://www.tiktok.com/business/en-US/solutions/tiktok-marketing-partners",
  },
  {
    id: "apple-review-guidelines",
    platform: "Apple",
    kind: "广告政策",
    label: "App Store Review Guidelines",
    url: "https://developer.apple.com/app-store/review/guidelines/",
  },
  {
    id: "apple-search-ads-partners",
    platform: "Apple",
    kind: "授权代理目录",
    label: "Apple Search Ads Partners",
    url: "https://searchads.apple.com/help/partners/",
  },
];

function standardSourcesForPlatform(platformHint: string): typeof STANDARD_TRAFFIC_SOURCES {
  const p = platformHint.toLowerCase();
  return STANDARD_TRAFFIC_SOURCES.filter((s) => {
    const pl = s.platform.toLowerCase();
    if (pl === "google") return /google|alphabet|youtube/.test(p);
    if (pl === "meta") return /meta|facebook|instagram/.test(p);
    if (pl === "tiktok") return /tiktok|bytedance|字节/.test(p);
    if (pl === "apple") return /apple|asa|app store|searchads/.test(p);
    return false;
  });
}

/** 流量服务商详情：优先匹配平台政策/Partner 目录；代理商默认展示全部官方代理目录 */
function resolveTrafficStandardSources(r: {
  group: string;
  brands: string;
  note: string;
  traffic: string;
  licenses: string;
  trafficKinds: TrafficServiceKind[];
  institutionTypes: InstitutionType[];
}): typeof STANDARD_TRAFFIC_SOURCES {
  const hint = `${r.group} ${r.brands} ${r.note} ${r.traffic} ${r.licenses}`;
  const matched = standardSourcesForPlatform(hint);
  if (matched.length) return matched;
  if (r.trafficKinds.includes("代理商")) {
    return STANDARD_TRAFFIC_SOURCES.filter((s) => s.kind === "授权代理目录");
  }
  return [];
}

/**
 * 核心流量平台 · 现金贷/高息短贷广告政策（公开广告政策对照；非监管立法）
 * 监管侧要求见 REGULATOR_CASH_LENDING_POLICY / 监管机构详情。
 */
type TrafficCorePolicy = {
  summary: string;
  status: string;
  allow: string;
  agentMode: string;
  docs: string;
};

const TRAFFIC_CORE_POLICY: Record<string, TrafficCorePolicy> = {
  "Google｜Google Ads｜Alphabet（流量服务商·流量平台·US）": {
    summary: "多国禁止 payday loan（年利率≥36%等）；合规个贷需金融认证",
    status:
      "2016 年起禁止美/加/英等市场 payday loan 广告（年利率≥36%的贷款）；后扩展至更多国家。",
    allow: "部分市场允许合规个人贷款，但需通过 Google 金融产品认证/预审。",
    agentMode:
      "授权代理=Google Partners/Reseller（标准信源目录可查）。角色为区域销售与投放服务，≠现金贷流量掮客；金融投放仍须平台审核。不按现金贷垂直披露专项代理。",
    docs: "https://support.google.com/adspolicy/answer/2464994",
  },
  "Meta｜Facebook｜Meta（流量服务商·流量平台·US）": {
    summary: "禁止 payday/title/pawn 广告；贷款广告须披露 APR",
    status:
      "2019 年起禁止 payday loan、title loan、pawn shop 等广告；贷款类广告要求披露 APR 等要素。",
    allow: "合规个人贷款、BNPL 等通常需预审；以当地 Meta 金融广告政策为准。",
    agentMode:
      "授权代理=Meta Business Partners / Reseller（标准信源目录可查）。≠现金贷掮客；开户后仍须过金融广告审核。",
    docs: "https://www.facebook.com/policies/ads/prohibited_content/financial_products",
  },
  "ByteDance｜TikTok｜字节跳动（流量服务商·流量平台·全球）": {
    summary: "全球禁止 payday loan 广告；持牌合规金融产品分区开放",
    status: "全球禁止 payday loan 广告；部分地区允许持牌金融机构的合规产品投放。",
    allow: "以 TikTok Ads 金融服务政策及当地牌照预审为准。",
    agentMode:
      "授权代理=TikTok Marketing Partners（标准信源目录可查；与 Shop Partner 部分重叠）。≠现金贷专项名单。",
    docs: "https://ads.tiktok.com/help/article/tiktok-advertising-policies-industry-entry",
  },
  "Apple｜App Store／ASA｜Apple（流量服务商·流量平台·US）": {
    summary: "禁止掠夺性贷款应用；金融 App 审核严格",
    status: "禁止「掠夺性贷款」应用；App Store 审核指南对金融类 App 有严格限制。",
    allow: "持牌/合规金融应用可上架与 ASA，须通过审核。",
    agentMode:
      "授权代理=Apple Search Ads Partners（标准信源目录可查；体系相对封闭）。≠现金贷专项代理。",
    docs: "https://developer.apple.com/app-store/review/guidelines/",
  },
  "Snap｜Snapchat Ads｜Snap（流量服务商·流量平台·US）": {
    summary: "禁止 payday loan（口径近似 Meta）",
    status: "禁止 payday loan 等掠夺性借贷广告（公开广告政策口径）。",
    allow: "合规金融产品以当地政策与预审为准。",
    agentMode: "无公开「现金贷核心代理」名单；授权代理≠现金贷渠道。",
    docs: "https://www.snap.com/en-US/ad-policies",
  },
  "X｜Twitter Ads｜X Corp（流量服务商·流量平台·US）": {
    summary: "高风险金融产品受限；政策多次调整",
    status: "限制高风险金融产品广告；具体以现行 Ads 政策为准（历史上多次修订）。",
    allow: "合规金融广告可能开放但审核收紧。",
    agentMode: "无公开「现金贷核心代理」名单；授权代理≠现金贷渠道。",
    docs: "https://business.x.com/en/help/ads-policies",
  },
  "LinkedIn｜LinkedIn Ads｜Microsoft（流量服务商·流量平台·US）": {
    summary: "禁止 payday loan；B2B 定位不适配现金贷获客",
    status: "禁止 payday loan 等；定位 B2B，不适合现金贷 C 端获客。",
    allow: "企业金融/职场相关合规产品另计。",
    agentMode: "无现金贷专项代理公开名单。",
    docs: "https://www.linkedin.com/legal/ads-policy",
  },
  "Taboola｜Taboola｜Taboola（流量服务商·流量平台·US）": {
    summary: "内容推荐网络；金融/现金贷审核趋严",
    status: "原生推荐广告网络；历史上曾有现金贷广告主，2020 年后审核趋严（公开行业对照）。",
    allow: "以 Taboola 广告政策与媒体侧审核为准。",
    agentMode: "非「核心代理」口径；与授权 Reseller 分列。",
    docs: "https://www.taboola.com/policies",
  },
  "Outbrain｜Outbrain｜Outbrain（流量服务商·流量平台·US）": {
    summary: "内容推荐网络；现金贷类投放审核趋严",
    status: "原生推荐广告网络；高风险金融/现金贷类投放审核趋严。",
    allow: "以 Outbrain 广告政策与媒体侧审核为准。",
    agentMode: "非现金贷核心代理名单。",
    docs: "https://www.outbrain.com/legal/",
  },
};

/** 监管机构 · 现金贷/高息短贷与金融广告相关公开要求（归监管详情） */
const REGULATOR_CASH_LENDING_POLICY: Record<
  string,
  { summary: string; detail: string; docs?: string }
> = {
  "Consumer Financial Protection Bureau｜CFPB｜美国消费者金融保护局（监管·US）": {
    summary: "Payday loan 消费者保护；投诉库与规则制定",
    detail:
      "对 payday loan / 高成本短贷实施消费者保护规则与执法；部分州禁止或严限 payday loan；与 FTC 等协同打击欺诈性获客。Military Lending Act 等对军人等群体设利率上限（公开口径常引 36% APR）。",
    docs: "https://www.consumerfinance.gov/",
  },
  "Federal Trade Commission｜FTC｜美国联邦贸易委员会（监管·US）": {
    summary: "虚假获客/Lead gen 执法；反欺诈广告",
    detail:
      "对欺骗性 lead generation、虚假贷款广告等执法；历史上有多起 lead gen 和解与诉讼。金融广告不得误导 APR、费用与资格。",
    docs: "https://www.ftc.gov/",
  },
  "Financial Conduct Authority｜FCA｜英国金融行为监管局（监管·GB）": {
    summary: "高成本短贷利率上限；行为监管",
    detail:
      "2015 年起对高成本短贷设利率上限（公开口径含日利率上限约 0.8%/天等规则组合）；行业出清后持续行为监管与广告披露要求。",
    docs: "https://www.fca.org.uk/",
  },
  "国家金融监督管理总局｜金管总局｜NFRA（监管·CN）": {
    summary: "现金贷整顿；无牌放贷禁止",
    detail:
      "2017 年起清理整顿现金贷；坚持持牌经营，无牌机构禁止放贷；联合整治网络借贷与暴力催收等。金融广告/导流须对接持牌机构。",
    docs: "https://www.nfra.gov.cn/",
  },
  "Reserve Bank of India｜RBI｜印度央行（监管·IN）": {
    summary: "NBFC 牌照；违规现金贷 App 下架",
    detail:
      "对 NBFC 严格牌照与行为监管；多次推动下架违规数字放贷 App；导流/广告须对接合规持牌主体。",
    docs: "https://www.rbi.org.in/",
  },
  "Otoritas Jasa Keuangan｜OJK｜金监局（监管·ID）": {
    summary: "LPBBTI/P2P 持牌；违规现金贷 App 禁令",
    detail:
      "P2P/LPBBTI 须持牌；多次公布非法网贷名单并协同下架；线上贷超/导流亦受持牌与广告合规约束。",
    docs: "https://www.ojk.go.id/",
  },
  "Central Bank of Nigeria｜CBN｜尼日利亚央行（监管·NG）": {
    summary: "数字贷款监管收紧（与消费者保护机构协同）",
    detail:
      "近年加强数字贷款与消费者保护；协同整治掠夺性数字贷与不当催收（公开报道 2022–2023 起加严）。",
    docs: "https://www.cbn.gov.ng/",
  },
};

function resolveTrafficKinds(
  institutionTypes: InstitutionType[],
  line: CreditRow["line"],
  draft?: TrafficServiceKind[],
): TrafficServiceKind[] {
  if (!institutionTypes.includes("流量服务商")) return [];
  if (draft?.length) return TRAFFIC_KIND_ORDER.filter((k) => draft.includes(k));
  // 历史 line=agent 样本默认归「贷超」
  if (line === "agent") return ["贷超"];
  return [];
}

const SOURCE_CHANNEL_ORDER: SourceChannel[] = ["流量源", "监管源", "经办认领"];

/**
 * 经办认领 / 登录：仅 *@alliancechuan.com 白名单用户名（不区分大小写）。
 * 初始密码 chuan666；输错即锁定，须管理员 leoli 重置。登录后可自行改密。
 */
const CLAIM_ALLOWED_DOMAIN = "alliancechuan.com";
const CLAIM_DEFAULT_PASSWORD = "chuan666";
const CLAIM_ADMIN_LOCAL = "leoli";
const CLAIM_ALLOWED_LOCALS: readonly string[] = [
  "leoli",
  "elsawu",
  "AndrewYin",
  "lunayang",
  "yalizhu",
  "Louischau",
  "kevinyung",
  "tunlin",
  "tracytian",
  "taoli",
  "samsoncheng",
];

type ClaimRecord = {
  email: string;
  /** 默认 = 邮箱本地名（*@domain 的 *） */
  displayName: string;
  note: string;
  confirmedAt: string;
};

type AuthUserRecord = {
  local: string;
  displayLocal: string;
  password: string;
  locked: boolean;
  enabled: boolean;
};

function normalizeClaimEmail(email: string): string {
  return email.trim().toLowerCase();
}

function claimLocalPart(email: string): string {
  return normalizeClaimEmail(email).split("@")[0] ?? "";
}

/** 白名单内展示用本地名（保留名单大小写）；否则回退为输入本地名 */
function canonicalClaimLocal(local: string): string {
  const key = local.trim().toLowerCase();
  return CLAIM_ALLOWED_LOCALS.find((x) => x.toLowerCase() === key) ?? local.trim();
}

function defaultClaimDisplayName(email: string): string {
  return canonicalClaimLocal(claimLocalPart(email));
}

function emailFromLocal(local: string): string {
  return `${local.trim().toLowerCase()}@${CLAIM_ALLOWED_DOMAIN}`;
}

function localHasClaimPermission(local: string): boolean {
  const key = local.trim().toLowerCase();
  if (!key) return false;
  return CLAIM_ALLOWED_LOCALS.some((x) => x.toLowerCase() === key);
}

function emailHasClaimPermission(email: string): boolean {
  const e = normalizeClaimEmail(email);
  const m = /^([^\s@]+)@([^\s@]+)$/.exec(e);
  if (!m) return false;
  const [, local, domain] = m;
  if (domain !== CLAIM_ALLOWED_DOMAIN) return false;
  return localHasClaimPermission(local);
}

function isClaimAdmin(local: string): boolean {
  return local.trim().toLowerCase() === CLAIM_ADMIN_LOCAL;
}

function seedAuthUser(localRaw: string): AuthUserRecord {
  const key = localRaw.trim().toLowerCase();
  return {
    local: key,
    displayLocal: canonicalClaimLocal(localRaw),
    password: CLAIM_DEFAULT_PASSWORD,
    locked: false,
    enabled: true,
  };
}

function resolveAuthUser(
  users: Record<string, AuthUserRecord>,
  localRaw: string,
): AuthUserRecord {
  const key = localRaw.trim().toLowerCase();
  return users[key] ?? seedAuthUser(localRaw);
}

/** 登录框只认用户名；若误填邮箱则取 @ 前部分（不在 UI 提示域名） */
function normalizeLoginUsername(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!s) return "";
  const at = s.indexOf("@");
  return at >= 0 ? s.slice(0, at) : s;
}

/** 登录表单用非受控原生 input，避免中文输入法组合态与 canvas state 冲突乱码 */
function LoginNativeField({
  inputId,
  type,
  placeholder,
  autoComplete,
  defaultValue = "",
}: {
  inputId: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
  defaultValue?: string;
}) {
  const theme = useHostTheme();
  return (
    <input
      id={inputId}
      name={inputId}
      type={type}
      placeholder={placeholder}
      autoComplete={autoComplete}
      defaultValue={defaultValue}
      spellCheck={false}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "8px 10px",
        borderRadius: 8,
        border: `1px solid ${theme.stroke.tertiary}`,
        background: theme.bg.editor,
        color: theme.text.primary,
        outline: "none",
        fontSize: 13,
      }}
    />
  );
}

function readLoginField(inputId: string): string {
  const el = document.getElementById(inputId) as { value?: string } | null;
  return (el?.value ?? "").trim();
}

function setLoginField(inputId: string, value: string) {
  const el = document.getElementById(inputId) as { value?: string } | null;
  if (el) el.value = value;
}

function toggleLoginPasswordVisibility(inputId: string, show: boolean) {
  const el = document.getElementById(inputId) as { type?: string } | null;
  if (el) el.type = show ? "text" : "password";
}

/** 密码框：右侧框内小眼睛切换显示/隐藏 */
function LoginPasswordField({
  inputId,
  showPass,
  onToggle,
}: {
  inputId: string;
  showPass: boolean;
  onToggle: () => void;
}) {
  const theme = useHostTheme();
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        borderRadius: 8,
        border: `1px solid ${theme.stroke.tertiary}`,
        background: theme.bg.editor,
      }}
    >
      <input
        id={inputId}
        name={inputId}
        type={showPass ? "text" : "password"}
        placeholder="密码"
        autoComplete="off"
        defaultValue=""
        spellCheck={false}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "8px 36px 8px 10px",
          border: "none",
          borderRadius: 8,
          background: "transparent",
          color: theme.text.primary,
          outline: "none",
          fontSize: 13,
        }}
      />
      <button
        type="button"
        title={showPass ? "隐藏密码" : "显示密码"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        style={{
          position: "absolute",
          right: 6,
          top: "50%",
          transform: "translateY(-50%)",
          width: 28,
          height: 28,
          padding: 0,
          border: "none",
          borderRadius: 6,
          background: "transparent",
          color: theme.text.tertiary,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showPass ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M2 2l12 12M6.5 6.7A2.5 2.5 0 0 0 9.3 9.5M7.1 4.3A6.8 6.8 0 0 1 8 4.2c3.3 0 5.8 2.4 6.8 3.8-.4.5-1.1 1.3-2.1 2M4.2 4.9C3 5.7 2.2 6.7 1.8 8c1 1.4 3.5 3.8 6.8 3.8.5 0 1-.05 1.4-.14"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M1.8 8c1-1.4 3.5-3.8 6.8-3.8S13.8 6.6 14.8 8c-1 1.4-3.5 3.8-6.8 3.8S2.8 9.4 1.8 8Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        )}
      </button>
    </div>
  );
}
const SOURCE_CHANNEL_LABEL: Record<SourceChannel, string> = {
  流量源: "流量源（商店榜/点点/路飞/Sensor Tower/墨腾研报等）",
  监管源: "监管源（持牌名录/登记）",
  经办认领: "经办认领（客户经理联系确认，对信息质量负责）",
};

/**
 * 墨腾创投（Momentum Works）长期信源摘要。
 * 用户粘贴墨腾微信后优先吸收至此，并回写场景/信贷口径；勿粘贴付费报告全文。
 * @see https://mp.weixin.qq.com/s/2x9gpbb9bkoakoEKaULSzA
 * @see https://mp.weixin.qq.com/s/Qh51KR5OdsuOdTGHv99TYA
 */
const MOTENG_LEARNED = {
  account: "墨腾创投（MomentumWorks）",
  seaVc2022h1: {
    title: "2022上半年东南亚风险投资报告（Cento×墨腾）",
    fundingUsdBn: 6.6,
    fintechShareOfInvestmentApprox: "约50%（2019初约8%）",
    fintechShareOfExitsApprox: "约75%",
    note: "支付基建与监管升级、科技获银行牌照；平台重心由超级应用转向金融服务",
  },
  seaFoodDelivery2025: {
    title: "东南亚外卖平台报告6.0",
    gmvYoY: "2025外卖大盘GMV约+18%（前一年约+13%）",
    /** 主市场结构：Grab + Gojek(GoTo) 双寡头；ShopeeFood/Foodpanda 为挑战/尾部 */
    marketStructure: "Grab + Gojek（GoTo）双寡头为主市场",
    grabShareApprox: "约55%",
    gojekNote: "印尼GoFood与GrabFood构成本地双寡头；区域份额次于Grab",
    shopeeFoodRank: "区域GMV第二（超Foodpanda）；印尼单量追赶GoFood——挑战者非主市场定义",
    foodpandaThExit: true,
    tiktokLocalLife: "短期不取代外卖；SEA变现主路径偏电商",
    growthDrivers: "六国两位数增长；泰约+22%最快；频次驱动、客单价略下行",
  },
} as const;

function resolveEcoRoles(
  line: CreditRow["line"],
  draft?: Partial<Pick<CreditRow, "ecoRoles" | "note" | "brands" | "institutionTypes">>,
): EcoRole[] {
  if (draft?.ecoRoles?.length) return ECO_ROLE_ORDER.filter((r) => draft.ecoRoles!.includes(r));
  if (draft?.institutionTypes?.length) {
    return ECO_ROLE_ORDER.filter((r) => draft.institutionTypes!.includes(r));
  }
  if (line === "agent") return ["流量服务商"];
  return [];
}

function resolveInstitutionTypes(
  kind: "scene" | "credit",
  line?: CreditRow["line"],
  draft?: InstitutionType[],
  ecoRoles?: EcoRole[],
): InstitutionType[] {
  if (draft?.length) return INSTITUTION_TYPE_ORDER.filter((t) => draft.includes(t));
  const out = new Set<InstitutionType>();
  if (kind === "scene") {
    out.add("玩家");
  } else if (line === "agent") {
    out.add("流量服务商");
  } else {
    out.add("玩家");
  }
  for (const r of ecoRoles ?? []) out.add(r);
  return INSTITUTION_TYPE_ORDER.filter((t) => out.has(t));
}

function inferSourceChannels(
  verify: VerifyStatus,
  trafficRank: string,
  licenseReg: string,
  claimed = false,
): SourceChannel[] {
  const out = new Set<SourceChannel>();
  if (verify === "双端通过" || verify === "仅流量" || hasTrafficSignal(trafficRank)) out.add("流量源");
  if (verify === "双端通过" || verify === "仅监管" || hasLicenseSignal(licenseReg)) out.add("监管源");
  if (claimed) out.add("经办认领");
  return SOURCE_CHANNEL_ORDER.filter((c) => out.has(c));
}

/** 信贷横切标签：与三产品线正交，一玩家可兼发信用卡等 */
const CREDIT_TAG_ORDER: CreditTag[] = ["信用卡"];

const CREDIT_TAG_LABEL: Record<CreditTag, string> = {
  信用卡: "信用卡",
};

/**
 * 已知发信用卡/贷记卡或明确卡产品的信贷玩家（可与现金贷/分期/租赁/中介并存）。
 * 未列入者仍可能经文案推断命中「信用卡」。
 */
const CREDIT_TAGS_BY_GROUP: Record<string, CreditTag[]> = {
  "Nubank（Nubank·BR）": ["信用卡"],
  "Klarna（Klarna·EU）": ["信用卡"],
  "Affirm（Affirm·US）": ["信用卡"],
  "Tabby（Tabby·GCC）": ["信用卡"],
  "Tamara（Tamara·GCC）": ["信用卡"],
  "AEON Credit Service/AEON Credit（AEON·MY）": ["信用卡"],
  "Easy Buy（Easy Buy·TH）": ["信用卡"],
  "Upstart（Upstart·US）": ["信用卡"],
  "DiDi Finanzas/DiDi（滴滴·MX）": ["信用卡"],
  "Kredivo/FinAccel（Kredivo·ID）": ["信用卡"],
  "Afterpay/Block（Afterpay·US）": ["信用卡"],
  "FE Credit（FE·VN）": ["信用卡"],
  "Home Credit Vietnam（Home Credit·VN）": ["信用卡"],
  "Bank Neo Commerce/Neo Pinjam（BNC·ID）": ["信用卡"],
  "SoFi Lending": ["信用卡"],
  MoneyLion: ["信用卡"],
  Dave: ["信用卡"],
  "Uni Cards": ["信用卡"],
  Slice: ["信用卡"],
  "Naranja X": ["信用卡"],
  "Ualá卡分期": ["信用卡"],
  "Falabella CMR": ["信用卡"],
  "Synchrony零售卡": ["信用卡"],
  "招商银行+中国联通｜招联｜招联（招联·CN）": ["信用卡"],
  "中原银行｜中原消费｜中原银行（中原·CN）": ["信用卡"],
  "中国邮政｜中邮消费｜中国邮政（中邮·CN）": ["信用卡"],
  "Bajaj Finance": ["信用卡"],
  "Tata Capital": ["信用卡"],
  "Credit Card Matcher（·BR）": ["信用卡"],
  "Credit Card Easy approval（·ZA）": ["信用卡"],
  "novücard（·BR）": ["信用卡"],
};

function inferCreditTags(parts: string[]): CreditTag[] {
  const s = parts.join(" ");
  // 避免把「白条/花呗/Pay Later」等分期误标为信用卡
  if (/花呗|白条|分付|Pay\s*Later|Pay in \d|BNPL/i.test(s) && !/信用卡|Credit Card|发卡|贷记卡/i.test(s)) {
    return [];
  }
  if (/信用卡|贷记卡|发卡|Card Issuer|Credit Card|CMR信用卡|NeuCard|novücard/i.test(s)) {
    return ["信用卡"];
  }
  return [];
}

function resolveCreditTags(
  group: string,
  draft?: Partial<Pick<CreditRow, "tags" | "brands" | "licenses" | "note" | "diandian">>,
): CreditTag[] {
  if (CREDIT_TAGS_BY_GROUP[group]?.length) return CREDIT_TAGS_BY_GROUP[group];
  if (draft?.tags?.length) return CREDIT_TAG_ORDER.filter((t) => draft.tags!.includes(t));
  return inferCreditTags([
    group,
    draft?.brands ?? "",
    draft?.licenses ?? "",
    draft?.note ?? "",
    draft?.diandian ?? "",
  ]);
}

const SCENE_TAG_ORDER: SceneTag[] = [
  "电商",
  "出行",
  "外卖",
  "社交",
  "支付钱包",
  "游戏",
  "直播",
  "信用管理",
  "金融",
  "艺术",
  "内容资讯",
  "企业服务",
  "法律服务",
  "本地生活",
  "在线教育",
  "在线医疗",
  "Web3",
];

const SCENE_TAG_LABEL: Record<SceneTag, string> = {
  电商: "电商",
  出行: "出行",
  外卖: "外卖",
  社交: "社交",
  支付钱包: "支付钱包",
  游戏: "游戏",
  直播: "直播",
  信用管理: "信用管理",
  金融: "金融",
  艺术: "艺术",
  内容资讯: "内容资讯",
  企业服务: "企业服务",
  法律服务: "法律服务",
  本地生活: "本地生活",
  在线教育: "在线教育",
  在线医疗: "在线医疗",
  Web3: "Web3",
};

/** 场景二级（对齐大宽表 + Web3）；历史「侨汇」→「跨境支付/汇款」 */
const SCENE_SUB_ORDER: SceneSubTag[] = [
  "综合电商",
  "垂直电商",
  "社交电商",
  "跨境电商",
  "二手/闲置",
  "网约车",
  "顺风车/拼车",
  "共享单车/电单车",
  "地图/导航",
  "代驾",
  "餐饮外卖",
  "即时零售/闪购",
  "生鲜电商",
  "药品配送",
  "即时通讯",
  "社区/论坛",
  "陌生人社交",
  "职场社交",
  "婚恋/相亲",
  "移动支付",
  "跨境支付/汇款",
  "数字银行/虚拟账户",
  "预付卡/储值",
  "聚合支付",
  "手游",
  "端游/页游",
  "云游戏",
  "游戏平台/分发",
  "电竞/赛事",
  "娱乐直播",
  "游戏直播",
  "电商直播/带货",
  "教育直播",
  "企业直播/会议",
  "征信查询",
  "信用评分/画像",
  "反欺诈服务",
  "债务管理/催收",
  "短视频",
  "中长视频/流媒体",
  "新闻资讯/聚合",
  "知识付费/专栏",
  "播客/音频",
  "企业通讯/协同",
  "项目管理",
  "云存储/云服务",
  "在线文档/表格",
  "电子签章",
  "电子合同",
  "在线公证/存证",
  "法律咨询/智能法务",
  "到店团购",
  "酒店/民宿预订",
  "票务/电影/演出",
  "家政/保洁服务",
  "美容/美发预约",
  "K12学科辅导",
  "语言学习",
  "职业教育/考证",
  "兴趣/素质教育",
  "企业培训/SaaS化",
  "在线问诊",
  "药品电商/配送",
  "健康管理/慢病",
  "心理咨询",
  "体检预约",
  "中心化交易所（CEX）",
  "去中心化交易所（DEX）",
  "NFT交易市场",
  "自托管钱包",
  "托管钱包",
  "硬件钱包",
  "借贷协议",
  "稳定币兑换/持有",
  "质押生息",
  "流动性挖矿",
  "链游玩赚",
  "游戏资产交易",
  "游戏公会参与",
  "去中心化社交",
  "创作者代币",
  "内容打赏",
  "PFP头像/身份",
  "音乐/艺术收藏",
  "品牌会员/权益",
  "票务/入场凭证",
  "稳定币汇款",
  "加密货币支付",
  "抗通胀储蓄",
];

const SCENE_SUB_LABEL: Record<SceneSubTag, string> = Object.fromEntries(
  SCENE_SUB_ORDER.map((t) => [t, t]),
) as Record<SceneSubTag, string>;

const SCENE_SUB_PARENT: Record<SceneSubTag, SceneTag> = {
  "综合电商": "电商",
  "垂直电商": "电商",
  "社交电商": "电商",
  "跨境电商": "电商",
  "二手/闲置": "电商",
  "网约车": "出行",
  "顺风车/拼车": "出行",
  "共享单车/电单车": "出行",
  "地图/导航": "出行",
  "代驾": "出行",
  "餐饮外卖": "外卖",
  "即时零售/闪购": "外卖",
  "生鲜电商": "外卖",
  "药品配送": "外卖",
  "即时通讯": "社交",
  "社区/论坛": "社交",
  "陌生人社交": "社交",
  "职场社交": "社交",
  "婚恋/相亲": "社交",
  "移动支付": "支付钱包",
  "跨境支付/汇款": "支付钱包",
  "数字银行/虚拟账户": "支付钱包",
  "预付卡/储值": "支付钱包",
  "聚合支付": "支付钱包",
  "手游": "游戏",
  "端游/页游": "游戏",
  "云游戏": "游戏",
  "游戏平台/分发": "游戏",
  "电竞/赛事": "游戏",
  "娱乐直播": "直播",
  "游戏直播": "直播",
  "电商直播/带货": "直播",
  "教育直播": "直播",
  "企业直播/会议": "直播",
  "征信查询": "信用管理",
  "信用评分/画像": "信用管理",
  "反欺诈服务": "信用管理",
  "债务管理/催收": "信用管理",
  "短视频": "内容资讯",
  "中长视频/流媒体": "内容资讯",
  "新闻资讯/聚合": "内容资讯",
  "知识付费/专栏": "内容资讯",
  "播客/音频": "内容资讯",
  "企业通讯/协同": "企业服务",
  "项目管理": "企业服务",
  "云存储/云服务": "企业服务",
  "在线文档/表格": "企业服务",
  "电子签章": "法律服务",
  "电子合同": "法律服务",
  "在线公证/存证": "法律服务",
  "法律咨询/智能法务": "法律服务",
  "到店团购": "本地生活",
  "酒店/民宿预订": "本地生活",
  "票务/电影/演出": "本地生活",
  "家政/保洁服务": "本地生活",
  "美容/美发预约": "本地生活",
  "K12学科辅导": "在线教育",
  "语言学习": "在线教育",
  "职业教育/考证": "在线教育",
  "兴趣/素质教育": "在线教育",
  "企业培训/SaaS化": "在线教育",
  "在线问诊": "在线医疗",
  "药品电商/配送": "在线医疗",
  "健康管理/慢病": "在线医疗",
  "心理咨询": "在线医疗",
  "体检预约": "在线医疗",
  "中心化交易所（CEX）": "金融",
  "去中心化交易所（DEX）": "金融",
  "NFT交易市场": "艺术",
  "自托管钱包": "金融",
  "托管钱包": "金融",
  "硬件钱包": "金融",
  "借贷协议": "金融",
  "稳定币兑换/持有": "金融",
  "质押生息": "金融",
  "流动性挖矿": "金融",
  "链游玩赚": "游戏",
  "游戏资产交易": "游戏",
  "游戏公会参与": "游戏",
  "去中心化社交": "社交",
  "创作者代币": "社交",
  "内容打赏": "社交",
  "PFP头像/身份": "艺术",
  "音乐/艺术收藏": "艺术",
  "品牌会员/权益": "艺术",
  "票务/入场凭证": "艺术",
  "稳定币汇款": "金融",
  "加密货币支付": "金融",
  "抗通胀储蓄": "金融",
};

/** 偏 B 端能力：不作线上数字经济 To C 场景词条，归生态角色·风控服务方 */
const SCENE_SUBS_B2B_RISK: ReadonlySet<SceneSubTag> = new Set([
  "信用评分/画像",
  "反欺诈服务",
]);

function sceneSubsForTag(tag: SceneTag | "all"): SceneSubTag[] {
  if (tag === "all") return [];
  return SCENE_SUB_ORDER.filter(
    (s) => SCENE_SUB_PARENT[s] === tag && !SCENE_SUBS_B2B_RISK.has(s),
  );
}

/** 信用租赁二级场景 */
const LEASE_SUB_ORDER: LeaseSubTag[] = ["游戏租赁"];
const LEASE_SUB_LABEL: Record<LeaseSubTag, string> = { 游戏租赁: "游戏租赁" };

/**
 * 已知挂「跨境支付/汇款」二级的支付钱包玩家（自动确保一级含支付钱包）。
 */
const SCENE_SUBS_BY_GROUP: Record<string, SceneSubTag[]> = {
  "蚂蚁集团/支付宝（蚂蚁·CN）": ["跨境支付/汇款"],
  "Wise/Wise（Wise·US）": ["跨境支付/汇款"],
  "Remitly/Remitly（Remitly·US）": ["跨境支付/汇款"],
  "Western Union/Western Union（西联·US）": ["跨境支付/汇款"],
  "MoneyGram/MoneyGram（速汇金·US）": ["跨境支付/汇款"],
  "WorldRemit/WorldRemit（WorldRemit·US）": ["跨境支付/汇款"],
  "Safaricom/M-Pesa（M-Pesa·KE）": ["跨境支付/汇款"],
  GCash: ["跨境支付/汇款"],
  "GCash（·SEA）": ["跨境支付/汇款"],
  PayPal: ["跨境支付/汇款"],
  "PayPal（·US）": ["跨境支付/汇款"],
};

/** 按集团名强制多标签（覆盖推断；一玩家可多场景） */
const SCENE_TAGS_BY_GROUP: Record<string, SceneTag[]> = {
  "蚂蚁集团/支付宝（蚂蚁·CN）": ["支付钱包"],
  "腾讯控股/微信（腾讯·CN）": ["社交", "支付钱包", "游戏"],
  "美团（美团·CN）": ["外卖", "出行", "本地生活"],
  "京东集团/京东（京东·CN）": ["电商"],
  "滴滴出行/滴滴（滴滴·CN）": ["出行"],
  "Sea Limited/Shopee（Sea·SEA）": ["电商", "游戏", "支付钱包", "外卖"],
  "Grab Holdings/Grab（Grab·SEA）": ["出行", "外卖", "支付钱包", "信用管理"],
  "GoTo/Gojek（GoTo·ID）": ["出行", "外卖", "支付钱包"],
  "Delivery Hero/Foodpanda（Foodpanda·SEA）": ["外卖"],
  "Xanh SM（Xanh SM·VN）": ["出行", "外卖"],
  "Lazada/Lazada（Lazada·SEA）": ["电商"],
  "Akulaku/Akulaku（阿卡拉克·SEA）": ["电商", "支付钱包"],
  "PhonePe/PhonePe（PhonePe·IN）": ["支付钱包"],
  "One97/Paytm（Paytm·IN）": ["支付钱包"],
  "Flipkart/Flipkart（Flipkart·IN）": ["电商"],
  "DiDi/99（滴滴·LATAM）": ["出行", "外卖", "支付钱包"],
  "Uber（Uber·LATAM）": ["出行", "外卖"],
  "iFood（iFood·BR）": ["外卖"],
  "PedidosYa（PedidosYa·LATAM）": ["外卖"],
  "Cabify（Cabify·LATAM）": ["出行"],
  "inDrive（inDrive·LATAM）": ["出行"],
  "Yape（Yape·PE）": ["支付钱包"],
  "Clip（Clip·MX）": ["支付钱包"],
  "Americanas（Americanas·BR）": ["电商"],
  "Linio（Linio·LATAM）": ["电商"],
  "Shein LatAm（Shein·LATAM）": ["电商"],
  "Kwai América Latina（快手·LATAM）": ["直播", "社交"],
  "ByteDance/TikTok LatAm（字节·LATAM）": ["直播", "社交"],
  "Garena Free Fire（Free Fire·LATAM）": ["游戏"],
  "Kaspi.kz（Kaspi·KZ）": ["电商", "支付钱包"],
  "Uzum（Uzum·UZ）": ["电商"],
  "Click（Click·UZ）": ["支付钱包"],
  "Payme（Payme·UZ）": ["支付钱包"],
  "inDrive（inDrive·KZ）": ["出行"],
  "LendMN（LendMN·MN）": ["支付钱包"],
  "Mercado Libre/Mercado Libre（美卡多·LATAM）": ["电商", "支付钱包", "信用管理"],
  "Rappi/Rappi（Rappi·LATAM）": ["外卖", "支付钱包"],
  "Safaricom/M-Pesa（M-Pesa·KE）": ["支付钱包"],
  "OPay/OPay（OPay·NG）": ["支付钱包"],
  "Amazon/Amazon（亚马逊·US）": ["电商", "信用管理"],
  "Block/Cash App（Block·US）": ["支付钱包", "信用管理"],
  "拼多多（拼多多·CN）": ["电商"],
  "字节跳动/抖音（抖音·CN）": ["直播", "电商", "社交"],
  "ByteDance/TikTok（字节·SEA）": ["直播", "电商", "社交"],
  "快手（快手·CN）": ["直播", "电商"],
  "广州华人/Badam Live（巴旦木·CN）": ["直播"],
  "赤子城科技/MICO（赤子城·MENA）": ["直播", "社交"],
  "小红书（小红书·CN）": ["社交", "电商"],
  "阿里巴巴/淘宝天猫（淘宝·CN）": ["电商"],
  "饿了么（饿了么·CN）": ["外卖"],
  "携程（携程·CN）": ["出行"],
  "飞猪（飞猪·CN）": ["出行"],
  "哈啰（哈啰·CN）": ["出行"],
  "云闪付（云闪付·CN）": ["支付钱包"],
  "唯品会（唯品会·CN）": ["电商"],
  "苏宁易购（苏宁·CN）": ["电商"],
  "闲鱼（闲鱼·CN）": ["电商"],
  "高德（高德·CN）": ["出行"],
  Tokopedia: ["电商"],
  Traveloka: ["出行"],
  MoMo: ["支付钱包"],
  ZaloPay: ["支付钱包"],
  Dana: ["支付钱包"],
  OVO: ["支付钱包"],
  GCash: ["支付钱包"],
  Maya: ["支付钱包"],
  TrueMoney: ["支付钱包"],
  "Amazon India": ["电商"],
  Myntra: ["电商"],
  Ola: ["出行"],
  "Amazon Pay": ["支付钱包"],
  "Google Pay India（Google Pay·IN）": ["支付钱包"],
  "YONO SBI（·IN）": ["支付钱包"],
  "Airtel Thanks（·IN）": ["支付钱包"],
  JioMart: ["电商"],
  BharatPe: ["支付钱包"],
  Mobikwik: ["支付钱包"],
  Freecharge: ["支付钱包"],
  "Airtel Thanks": ["支付钱包"],
  "Tata Neu": ["电商", "支付钱包", "信用管理"],
  "Magazine Luiza": ["电商", "信用管理"],
  "Shopee Brasil": ["电商"],
  "Amazon Brasil": ["电商", "信用管理"],
  PicPay: ["支付钱包"],
  PagBank: ["支付钱包", "信用管理"],
  "Casas Bahia": ["电商", "信用管理"],
  Falabella: ["电商", "信用管理"],
  Liverpool: ["电商", "信用管理"],
  Coppel: ["电商", "信用管理"],
  Nequi: ["支付钱包"],
  DaviPlata: ["支付钱包"],
  Ualá: ["支付钱包", "信用管理"],
  Jumia: ["电商"],
  Noon: ["电商"],
  Wave: ["支付钱包"],
  "Airtel Money": ["支付钱包"],
  "MTN MoMo": ["支付钱包"],
  "Orange Money": ["支付钱包"],
  PalmPay: ["支付钱包"],
  "STC Pay": ["支付钱包"],
  Urpay: ["支付钱包"],
  Walmart: ["电商", "信用管理"],
  Target: ["电商", "信用管理"],
  Venmo: ["支付钱包"],
  PayPal: ["支付钱包", "信用管理"],
  "Apple Wallet": ["支付钱包", "信用管理"],
  Shopify: ["电商"],
  Revolut: ["支付钱包", "信用管理"],
  "Wise/Wise（Wise·US）": ["支付钱包"],
  "Remitly/Remitly（Remitly·US）": ["支付钱包"],
  "Western Union/Western Union（西联·US）": ["支付钱包"],
  "MoneyGram/MoneyGram（速汇金·US）": ["支付钱包"],
  "WorldRemit/WorldRemit（WorldRemit·US）": ["支付钱包"],
};

type PlatformBizDepth = "core" | "extend";

/**
 * 一级场景业务深度（●核心 ○扩展）。未列出的标签：若 trafficRank 有●○则用之，否则默认●。
 * 多场景平台务必写全，避免只显示词条不标深度。
 */
const SCENE_TAG_DEPTH_BY_GROUP: Record<string, Partial<Record<SceneTag, PlatformBizDepth>>> = {
  "蚂蚁集团/支付宝（蚂蚁·CN）": { 支付钱包: "core" },
  "腾讯控股/微信（腾讯·CN）": { 社交: "core", 支付钱包: "core", 游戏: "core" },
  "美团（美团·CN）": { 外卖: "core", 本地生活: "core", 出行: "extend" },
  "京东集团/京东（京东·CN）": { 电商: "core" },
  "滴滴出行/滴滴（滴滴·CN）": { 出行: "core" },
  "Sea Limited/Shopee（Sea·SEA）": { 电商: "core", 游戏: "core", 外卖: "extend", 支付钱包: "extend" },
  "Grab Holdings/Grab（Grab·SEA）": {
    出行: "core",
    外卖: "core",
    支付钱包: "core",
    信用管理: "extend",
  },
  "GoTo/Gojek（GoTo·ID）": { 出行: "core", 外卖: "core", 支付钱包: "extend" },
  "Delivery Hero/Foodpanda（Foodpanda·SEA）": { 外卖: "extend" },
  "Xanh SM（Xanh SM·VN）": { 出行: "core", 外卖: "extend" },
  "Lazada/Lazada（Lazada·SEA）": { 电商: "core" },
  "Akulaku/Akulaku（阿卡拉克·SEA）": { 电商: "core", 支付钱包: "extend" },
  "PhonePe/PhonePe（PhonePe·IN）": { 支付钱包: "core" },
  "One97/Paytm（Paytm·IN）": { 支付钱包: "core" },
  "Flipkart/Flipkart（Flipkart·IN）": { 电商: "core" },
  "DiDi/99（滴滴·LATAM）": { 出行: "core", 外卖: "core", 支付钱包: "extend" },
  "Uber（Uber·LATAM）": { 出行: "core", 外卖: "extend" },
  "Kwai América Latina（快手·LATAM）": { 直播: "core", 社交: "extend" },
  "ByteDance/TikTok LatAm（字节·LATAM）": { 直播: "core", 社交: "extend" },
  "Kaspi.kz（Kaspi·KZ）": { 电商: "core", 支付钱包: "core" },
  "Mercado Libre/Mercado Libre（美卡多·LATAM）": {
    电商: "core",
    支付钱包: "core",
    信用管理: "extend",
  },
  "Rappi/Rappi（Rappi·LATAM）": { 外卖: "core", 支付钱包: "core" },
  "Safaricom/M-Pesa（M-Pesa·KE）": { 支付钱包: "core" },
  "OPay/OPay（OPay·NG）": { 支付钱包: "core" },
  "Amazon/Amazon（亚马逊·US）": { 电商: "core", 信用管理: "extend" },
  "Block/Cash App（Block·US）": { 支付钱包: "core", 信用管理: "extend" },
  "字节跳动/抖音（抖音·CN）": { 直播: "core", 电商: "core", 社交: "extend" },
  "ByteDance/TikTok（字节·SEA）": { 直播: "core", 电商: "core", 社交: "extend" },
  "快手（快手·CN）": { 直播: "core", 电商: "extend" },
  "赤子城科技/MICO（赤子城·MENA）": { 直播: "core", 社交: "extend" },
  "小红书（小红书·CN）": { 社交: "core", 电商: "extend" },
  "饿了么（饿了么·CN）": { 外卖: "core" },
  Walmart: { 电商: "core", 信用管理: "extend" },
  Target: { 电商: "core", 信用管理: "extend" },
  PayPal: { 支付钱包: "core", 信用管理: "extend" },
  "Apple Wallet": { 支付钱包: "core", 信用管理: "extend" },
  Revolut: { 支付钱包: "core", 信用管理: "extend" },
};

function formatSceneTags(tags: SceneTag[], subTags: SceneSubTag[] = []): string {
  return SCENE_TAG_ORDER.filter((t) => tags.includes(t))
    .map((t) => {
      const kids = SCENE_SUB_ORDER.filter(
        (s) => subTags.includes(s) && SCENE_SUB_PARENT[s] === t,
      ).map((s) => SCENE_SUB_LABEL[s]);
      return kids.length ? `${SCENE_TAG_LABEL[t]}/${kids.join("·")}` : SCENE_TAG_LABEL[t];
    })
    .join(" · ");
}

function formatLeaseLine(_leaseSubs: LeaseSubTag[]): string {
  // 已取消租赁二级分类；统一展示信用租赁
  return LINE_LABEL.lease;
}

const LICENSE_KIND_ORDER: LicenseKind[] = ["银行", "保险", "支付", "消金小贷", "其他"];
const LICENSE_KIND_LABEL: Record<LicenseKind, string> = {
  银行: "银行",
  保险: "保险",
  支付: "支付",
  消金小贷: "消金/小贷等",
  其他: "其他牌照",
};

/**
 * 牌照粗类只认「已持有」表述，不认合作/导流/分发/申请中。
 * 「非银行支付」等含「银行」字样的否定/合作语境不得命中银行牌照。
 * 「其他」仅限可识别的非四类牌照（证券/租赁/征信等）；信息不详不归「其他」。
 */
function heldLicenseBlob(...parts: string[]): string {
  const raw = parts.filter(Boolean).join(" ");
  const cut = raw.search(/申请中|拟申请|申请：/);
  const held = cut >= 0 ? raw.slice(0, cut) : raw;
  return held
    .replace(/非银行/gi, "NONBANK")
    .replace(
      /银行合作|合作银行|银行伙伴|银行导流|银行分发|银行\/持牌|持牌机构分发|多为银行|银行信贷|导流银行|银行通道/g,
      "PARTNER",
    );
}

function inferLicenseKinds(...parts: string[]): LicenseKind[] {
  const s = heldLicenseBlob(...parts);
  const out = new Set<LicenseKind>();
  if (
    /银行牌照|商业银行|数字银行|吸储|持牌银行|Bank\s*licen[cs]e|digital\s*bank/i.test(s)
  ) {
    out.add("银行");
  }
  if (/保险牌照|保险公司|保险经纪|保险代理|财险|寿险|insurer|Insurance\s*licen/i.test(s))
    out.add("保险");
  if (
    /支付|Payment|e-?money|电子货币|钱包牌|NONBANK支付|UPI|PSP|发卡行合作支付/i.test(s)
  )
    out.add("支付");
  if (
    /消金|小贷|助贷|借贷|信贷\(|P2P|SOFOM|SOFIPO|NBFC|OLP|融资公司|金融公司|Multifinance|LPBBTI|CoR|Lending|放贷|消费金融/i.test(
      s,
    )
  )
    out.add("消金小贷");
  if (
    /证券|基金销售|基金代销|信托|融资租赁|金融租赁|融资租赁牌|征信|保理|期货|资管计划|货币经纪|典当|拍卖|融资担保|担保牌照/i.test(
      s,
    )
  ) {
    out.add("其他");
  }
  return LICENSE_KIND_ORDER.filter((k) => out.has(k));
}

function resolveLicenseKinds(
  draft?: LicenseKind[],
  ...parts: string[]
): LicenseKind[] {
  if (draft?.length) return LICENSE_KIND_ORDER.filter((k) => draft.includes(k));
  return inferLicenseKinds(...parts);
}

function inferSceneTags(text: string, group?: string): SceneTag[] {
  const s = `${group ?? ""} ${text}`;
  const out = new Set<SceneTag>();
  if (/电商|零售|商城|二手|购物|Marketplace|E-?commerce|标杆|跨境|Shopify|PayPal/i.test(s))
    out.add("电商");
  if (/出行|打车|地图|两轮|航旅|旅游|Travel|Ride/i.test(s)) out.add("出行");
  if (/外卖|即时配送|Food|Delivery/i.test(s)) out.add("外卖");
  if (/社交|微信|社区|Social/i.test(s)) out.add("社交");
  if (
    /支付|钱包|UPI|移动货币|P2P|数字银行|Wallet|Money|Pay(?!ment Bank)|侨汇|汇款|Remit/i.test(s)
  )
    out.add("支付钱包");
  if (/游戏|Game|Free Fire|PUBG/i.test(s) && !/链游|GameFi|Web3/i.test(s)) out.add("游戏");
  if (/直播|抖音|快手|TikTok|Badam|巴旦木|赤子城|MICO|Kwai|Live/i.test(s) && !/短视频内容/i.test(s))
    out.add("直播");
  const looksBnplOnly =
    /花呗|白条|分付|月付|Pay\s*Later|Pay in \d|BNPL/i.test(s) &&
    !/信用卡|贷记卡|Credit Card|发卡|CMR|NeuCard|Apple Card|RedCard/i.test(s);
  if (
    !looksBnplOnly &&
    /信用卡|贷记卡|发卡|Credit Card|CMR信用卡|NeuCard|Apple Card|RedCard|Grab Card|征信查询|个人征信/i.test(s)
  ) {
    out.add("信用管理");
  }
  if (/短视频|流媒体|新闻资讯|知识付费|播客|内容资讯/i.test(s)) out.add("内容资讯");
  if (/企业服务|企业通讯|协同办公|云存储|在线文档|项目管理/i.test(s)) out.add("企业服务");
  if (/法律服务|电子签|电子合同|e签|法大大|DocuSign|在线公证|存证|智能法务|法律咨询/i.test(s))
    out.add("法律服务");
  if (/本地生活|到店|团购|民宿|家政|美发预约/i.test(s)) out.add("本地生活");
  if (/在线教育|K12|语言学习|职业教育|网课/i.test(s)) out.add("在线教育");
  if (/在线医疗|在线问诊|互联网医院|健康管理|心理咨询/i.test(s)) out.add("在线医疗");
  if (/Web3|加密|Crypto|DeFi|NFT|区块链|CEX|DEX|稳定币|GameFi|SocialFi/i.test(s)) out.add("Web3");
  return SCENE_TAG_ORDER.filter((t) => out.has(t));
}

function inferSceneSubTags(text: string, group?: string): SceneSubTag[] {
  const s = `${group ?? ""} ${text}`;
  const out = new Set<SceneSubTag>();
  if (/侨汇|汇款|Remit|Western Union|MoneyGram|WorldRemit|Wise|速汇|跨境支付/i.test(s))
    out.add("跨境支付/汇款");
  // Web3 L2 粗推断
  if (/CEX|中心化交易所|币安|Coinbase|Upbit|Binance/i.test(s)) out.add("中心化交易所（CEX）");
  if (/\bDEX\b|Uniswap|去中心化交易所/i.test(s)) out.add("去中心化交易所（DEX）");
  if (/NFT交易|OpenSea|Blur/i.test(s)) out.add("NFT交易市场");
  if (/MetaMask|自托管|imToken|Phantom/i.test(s)) out.add("自托管钱包");
  if (/硬件钱包|Ledger|Trezor|OneKey/i.test(s)) out.add("硬件钱包");
  if (/稳定币汇款|USDT汇|USDC汇/i.test(s)) out.add("稳定币汇款");
  if (/抗通胀|美元化|里拉|比索崩溃/i.test(s)) out.add("抗通胀储蓄");
  if (/链游|GameFi|Axie|YGG|玩赚/i.test(s)) out.add("链游玩赚");
  if (/电子签章|e签宝|法大大|DocuSign|Adobe Sign|CloudSign/i.test(s)) out.add("电子签章");
  if (/电子合同|契约锁|合同锁|智能合同/i.test(s)) out.add("电子合同");
  if (/在线公证|区块链存证|存证/i.test(s)) out.add("在线公证/存证");
  if (/法律咨询|智能法务|LegalTech|律师平台/i.test(s)) out.add("法律咨询/智能法务");
  return SCENE_SUB_ORDER.filter((t) => out.has(t));
}

function resolveSceneSubTags(
  group: string,
  sceneType?: string,
  subTags?: SceneSubTag[],
): SceneSubTag[] {
  if (SCENE_SUBS_BY_GROUP[group]?.length) return SCENE_SUBS_BY_GROUP[group];
  if (subTags?.length) return SCENE_SUB_ORDER.filter((t) => subTags.includes(t));
  return inferSceneSubTags(sceneType ?? "", group);
}

function resolveSceneTags(group: string, sceneType?: string, tags?: SceneTag[]): SceneTag[] {
  let resolved: SceneTag[];
  if (SCENE_TAGS_BY_GROUP[group]?.length) resolved = SCENE_TAGS_BY_GROUP[group];
  else if (tags?.length) resolved = SCENE_TAG_ORDER.filter((t) => tags.includes(t));
  else {
    const inferred = inferSceneTags(sceneType ?? "", group);
    resolved = inferred.length ? inferred : ["电商"];
  }
  // 二级跨境支付/汇款挂在支付钱包下；Web3 二级确保一级含 Web3
  const subs = resolveSceneSubTags(group, sceneType);
  if (subs.includes("跨境支付/汇款") && !resolved.includes("支付钱包")) {
    resolved = [...resolved, "支付钱包"];
  }
  if (subs.some((s) => SCENE_SUB_PARENT[s] === "Web3") && !resolved.includes("Web3")) {
    resolved = [...resolved, "Web3"];
  }
  return SCENE_TAG_ORDER.filter((t) => resolved.includes(t));
}

function inferLeaseSubTags(parts: string[]): LeaseSubTag[] {
  const s = parts.join(" ");
  if (/游戏租|租号|装备租|账号租|帐号租|Game\s*(Account|Item)?\s*Rent|Zuhaowan|U号租/i.test(s)) {
    return ["游戏租赁"];
  }
  return [];
}

function resolveLeaseSubTags(
  _group: string,
  _line: CreditRow["line"],
  _draft?: Partial<Pick<CreditRow, "leaseSubs" | "brands" | "licenses" | "note" | "volume">>,
): LeaseSubTag[] {
  // 已取消租赁二级分类
  return [];
}

const scenesCore: SceneDraft[] = [
  {
    region: "east-asia",
    group: "蚂蚁集团/支付宝（蚂蚁·CN）",
    sceneType: "支付钱包 + 生活服务",
    apps: "支付宝",
    countries: "中国；Alipay+ 跨境",
    languages: "简中等",
    mau: "生态常称10亿+；MAU约6–7亿级（待核实）",
    registered: ">10亿",
    share: "中国移动支付约53–55%",
    creditAttach: "派生：花呗(分期)、借呗(现金贷)、芝麻信用免押租赁生态",
    diandian: "CN支付：非点点出海借贷榜；国内应用商店金融类另计",
  },
  {
    region: "east-asia",
    group: "腾讯控股/微信（腾讯·CN）",
    sceneType: "社交 + 支付",
    apps: "微信",
    countries: "中国",
    languages: "简中",
    mau: "微信MAU约14.1–14.3亿（2025末/2026初）",
    registered: "近饱和",
    share: "中国移动支付约40–42%",
    creditAttach: "派生：分发信贷/理财/保险（嵌微信）",
    diandian: "CN社交/支付：非点点出海借贷榜",
  },
  {
    region: "east-asia",
    group: "美团（美团·CN）",
    sceneType: "外卖/本地生活",
    apps: "美团",
    countries: "中国；Keeta出海",
    languages: "简中",
    mau: "年交易用户创新高（FY2024>7.7亿；FY2025再创新高）",
    registered: "未公开",
    share: "中国外卖约60%+",
    creditAttach: "派生：美团支付、月付等",
    diandian: "CN本地生活：非点点出海借贷榜",
  },
  {
    region: "east-asia",
    group: "京东集团/京东（京东·CN）",
    sceneType: "电商",
    apps: "京东",
    countries: "中国",
    languages: "简中",
    mau: "约6.1亿（第三方）",
    registered: "年活约7亿+",
    share: "中国电商GMV约24%",
    creditAttach: "派生：白条(分期)、金条(现金贷)",
    diandian: "CN电商：非点点出海借贷榜",
  },
  {
    region: "east-asia",
    group: "滴滴出行/滴滴（滴滴·CN）",
    sceneType: "出行",
    apps: "滴滴出行",
    countries: "中国；拉美另线",
    languages: "简中",
    mau: "近年未稳定披露；Q4'25日均约3890万单",
    registered: "未公开",
    share: "中国网约车约70%+",
    creditAttach: "派生：支付、现金贷、司机金融",
    diandian: "CN出行：非点点出海借贷榜 | MX·DiDi Finanzas：点点称墨App Store金融免费榜常居约5–15，2025-09-21曾冲#1后下架复核",
  },
  {
    region: "se-asia",
    group: "Sea Limited/Shopee（Sea·SEA）",
    sceneType: "电商",
    apps: "Shopee；ShopeePay；ShopeeFood",
    countries: "ID TH MY PH VN SG TW 等",
    languages: "多本地语",
    mau: "不披露统一MAU；FY2025 GMV $127.4B",
    registered: "未公开",
    share: "SEA平台电商GMV约52–53%；外卖为扩展盘：ShopeeFood区域GMV第二（墨腾6.0），主市场仍属Grab+GoFood",
    creditAttach: "派生：SPayLater(分期)、SLoan、SeaBank",
    diandian: "SEA电商：点点电商榜另计；借贷工具榜看SPayLater嵌入非独立App｜墨腾外卖6.0（挑战者）",
  },
  {
    region: "se-asia",
    group: "Grab Holdings/Grab（Grab·SEA）",
    sceneType: "出行 + 外卖",
    apps: "Grab",
    countries: "约8国SEA",
    languages: "英语+本地语",
    mau: "MTU Q4'25：50.5M",
    registered: "未公开",
    share: `SEA外卖主市场龙头约${MOTENG_LEARNED.seaFoodDelivery2025.grabShareApprox}（墨腾《${MOTENG_LEARNED.seaFoodDelivery2025.title}》）；与GoFood构成区域双寡头；新加坡打车约70–75%`,
    creditAttach: "派生：GrabPay、借贷、GXS/GXBank",
    diandian: "SEA超级App：点点出行/外卖榜另计｜墨腾：外卖主市场=Grab+Gojek；2025大盘GMV约+18%",
  },
  {
    region: "se-asia",
    group: "GoTo/Gojek（GoTo·ID）",
    sceneType: "出行 + 外卖",
    apps: "Gojek；GoPay",
    countries: "印尼为主",
    languages: "印尼语、英语",
    mau: "ATU FY2025：66M；GoPay MTU≈24M",
    registered: "未公开",
    share: "印尼出行/外卖与Grab双寡头（GoFood）；区域外卖主市场一侧；ShopeeFood在印尼单量追赶属挑战者叙事",
    creditAttach: "派生：GoPayLater、Pinjam；关联Bank Jago",
    diandian: "ID超级App：点点出行/外卖榜另计｜墨腾：Grab↔GoTo为SEA外卖主市场双寡头",
  },
  {
    region: "se-asia",
    group: "Delivery Hero/Foodpanda（Foodpanda·SEA）",
    sceneType: "外卖",
    apps: "Foodpanda",
    countries: "新马等（泰国外卖已退出）",
    languages: "英语+本地语",
    mau: "区域份额下滑（墨腾：落后Grab/GoFood；GMV已被ShopeeFood超越）",
    registered: "未公开",
    share: "SEA外卖尾部/收缩；主市场为Grab+GoFood；2025退出泰国（墨腾外卖6.0）",
    creditAttach: "派生：信贷/钱包合作待核实",
    diandian: "墨腾外卖6.0：Foodpanda退出泰国；非SEA外卖主市场定义",
  },
  {
    region: "se-asia",
    group: "Xanh SM（Xanh SM·VN）",
    sceneType: "出行 + 外卖",
    apps: "Xanh SM",
    countries: "越南",
    languages: "越南语",
    mau: "电动出行起家；外卖为挑战者",
    registered: "未公开",
    share: "越南出行新兴；外卖试图挑战头部（墨腾外卖6.0）",
    creditAttach: "派生：信贷合作待核实",
    diandian: "墨腾外卖6.0：范日旺关联Xanh SM推外卖",
  },
  {
    region: "se-asia",
    group: "Lazada/Lazada（Lazada·SEA）",
    sceneType: "电商",
    apps: "Lazada",
    countries: "SEA六国",
    languages: "多本地语",
    mau: "未公开",
    registered: "未公开",
    share: "双位数份额，落后Shopee/TikTok",
    creditAttach: "派生：LazPayLater（多为持牌合作嵌入）",
    diandian: "SEA电商：点点电商榜另计",
  },
  {
    region: "se-asia",
    group: "ByteDance/TikTok（字节·SEA）",
    sceneType: "直播+电商+社交",
    apps: "TikTok；TikTok Shop",
    countries: "SEA为主（ID与Tokopedia整合叙事）；全球短视频",
    languages: "多本地语",
    mau: "全球月活常称十余亿级（集团口径；国别待拆）",
    registered: "未公开",
    share: "SEA直播电商快速追赶Shopee/Lazada；墨腾：短期不以本地生活/外卖替代平台为主变现",
    creditAttach: "派生：TikTok Shop PayLater/分期（多国持牌机构合作嵌入）",
    diandian: "SEA：短视频/电商榜另计；PayLater非独立借贷App｜墨腾外卖6.0：TikTok SEA变现主路径偏电商",
  },
  {
    region: "se-asia",
    group: "Akulaku/Akulaku（阿卡拉克·SEA）",
    sceneType: "轻电商/分期商城（电商算场景）",
    apps: "Akulaku；BNC/neobank；Asetku；OwnBank（PH）",
    countries: "印尼、菲律宾、马来、泰国",
    languages: "印尼语等",
    mau: "未公开",
    registered: ">40M（至2024）",
    share: "印尼BNPL头部之一",
    creditAttach: "强信贷：BNPL、现金贷；银行臂BNC(ID)·OwnBank(PH)；泰Akulaku X放贷；Asetku P2P",
    diandian: "ID/PH/TH：分期商城+银行/放贷臂；点点借贷/金融工具榜位次待补最新月",
  },
  {
    region: "south-asia",
    group: "PhonePe/PhonePe（PhonePe·IN）",
    sceneType: "支付（UPI）",
    apps: "PhonePe",
    countries: "印度",
    languages: "英语+印度多语",
    mau: "MAC 2.378亿",
    registered: "LTD≈6.576亿",
    share: "UPI约46–49%",
    creditAttach: "派生：保险/借贷/理财分销",
    diandian: "IN支付：印度支付榜另计",
  },
  {
    region: "south-asia",
    group: "One97/Paytm（Paytm·IN）",
    sceneType: "支付",
    apps: "Paytm",
    countries: "印度",
    languages: "多语",
    mau: "MTU约7500–7600万",
    registered: "未公开",
    share: "UPI约6–8%",
    creditAttach: "派生：贷款/保险分销；Payments Bank已吊销",
    diandian: "IN支付：印度支付榜另计",
  },
  {
    region: "south-asia",
    group: "Flipkart/Flipkart（Flipkart·IN）",
    sceneType: "电商",
    apps: "Flipkart",
    countries: "印度",
    languages: "多语",
    mau: "约2.2–2.4亿",
    registered: "常引5亿+",
    share: "印度电商GMV约50–60%",
    creditAttach: "派生：Pay Later（银行/NBFC合作）",
    diandian: "IN电商：电商榜另计",
  },
  {
    region: "latam",
    group: "DiDi/99（滴滴·LATAM）",
    sceneType: "出行 + 外卖",
    apps: "DiDi；DiDi Food；99",
    countries: "墨西哥、巴西等约10国拉美",
    languages: "西语、葡语",
    mau: "墨约3000万；巴约5500万活跃",
    registered: "未公开",
    share: "巴西出行约40%；墨西哥出行/外卖头部场景原生",
    creditAttach: "派生：99Pay、DiDi Cuenta、DiDi Finanzas信贷/卡（金融臂另见信贷表）",
    diandian: "MX·DiDi Finanzas：点点墨金融榜约5–15，2025Q4 MAU均约367.5万（+8.8%YoY）；2025-09曾冲商店#1后复核下架",
  },
  {
    region: "latam",
    group: "Mercado Libre/Mercado Libre（美卡多·LATAM）",
    sceneType: "电商",
    apps: "Mercado Libre；Mercado Pago",
    countries: "巴西、墨西哥、阿根廷、智利、哥伦比亚等",
    languages: "西语、葡语",
    mau: "Pago近7800万MAU",
    registered: "巴西央行口径约7130万",
    share: "巴西电商约27–35%；阿根廷约60%+",
    creditAttach: "派生：钱包、信贷、理财（Pago可独立获客）",
    diandian: "拉美电商/钱包：点点电商与金融工具分榜，精确借贷名次待补",
  },
  {
    region: "latam",
    group: "Rappi/Rappi（Rappi·LATAM）",
    sceneType: "外卖/本地生活",
    apps: "Rappi",
    countries: "墨西哥、哥伦比亚、巴西等约9国",
    languages: "西语、葡语",
    mau: "宣称3000万+活跃",
    registered: "未公开",
    share: "哥伦比亚外卖领先之一",
    creditAttach: "派生：RappiPay（哥伦比亚）；墨金融已收缩",
    diandian: "拉美本地生活：点点生活服务榜另计",
  },
  {
    region: "africa",
    group: "Safaricom/M-Pesa（M-Pesa·KE）",
    sceneType: "支付/移动货币",
    apps: "M-PESA",
    countries: "肯尼亚+东非",
    languages: "斯瓦希里、英语",
    mau: "肯尼亚月活约3600–4400万",
    registered: "高于月活",
    share: "肯尼亚移动货币近垄断",
    creditAttach: "派生：Fuliza/M-Shwari等信贷",
    diandian: "KE移动货币：电信/支付榜另计",
  },
  {
    region: "africa",
    group: "OPay/OPay（OPay·NG）",
    sceneType: "支付/代理银行",
    apps: "OPay",
    countries: "尼日利亚",
    languages: "英语",
    mau: "月末交易活跃约3932万",
    registered: "约4500万",
    share: "尼日利亚数字支付领先梯队",
    creditAttach: "派生：OPay借贷/分期等信贷产品线",
    diandian: "NG支付：支付榜另计",
  },
  {
    region: "west",
    group: "Amazon/Amazon（亚马逊·US）",
    sceneType: "电商",
    apps: "Amazon",
    countries: "美英日印等",
    languages: "多语",
    mau: "依托数亿账户",
    registered: "数亿级账户",
    share: "多国电商龙头",
    creditAttach: "派生：Amazon Pay、Installments/合作分期",
    diandian: "电商：电商榜另计",
  },
  {
    region: "west",
    group: "Block/Cash App（Block·US）",
    sceneType: "支付/P2P钱包",
    apps: "Cash App",
    countries: "美国为主",
    languages: "英语",
    mau: "月交易活跃5900万",
    registered: "未公开",
    share: "美国年轻用户钱包头部",
    creditAttach: "同集团 Afterpay=消费分期产品线（见信贷表）",
    diandian: "US支付：美区榜另计",
  },
];

const REGION_COUNTRY: Record<Exclude<Region, "all">, string> = {
  "east-asia": "中日韩蒙等",
  "se-asia": "东南亚多国",
  "south-asia": "印度等",
  "central-asia": "哈萨克斯坦、乌兹别克斯坦等",
  latam: "拉美多国",
  mena: "中东与北非多国",
  africa: "非洲多国（撒哈拉以南为主）",
  west: "美加英欧等",
};

type SceneSeed = {
  region: Exclude<Region, "all">;
  group: string;
  sceneType: string;
  creditAttach: string;
};
type CreditSeed = {
  region: Exclude<Region, "all">;
  line: "cash" | "bnpl" | "lease" | "agent";
  group: string;
};

/** 仅收录已涉信贷派生的场景玩家；纯支付/出行/外卖不入库 */
const sceneCrmSeedTuples: [Exclude<Region, "all">, string, string, string][] = [
  ["east-asia", "拼多多（拼多多·CN）", "电商", "派生：多多支付/月付等"],
  ["east-asia", "字节跳动/抖音（抖音·CN）", "直播+短视频+电商", "派生：抖音月付、放心借等"],
  ["east-asia", "快手（快手·CN）", "直播+短视频+电商", "派生：快手月付等"],
  ["east-asia", "广州华人/Badam Live（巴旦木·CN）", "直播", "派生：直播消费/虚拟礼物；信贷合作待核实"],
  ["east-asia", "小红书（小红书·CN）", "社交内容+电商", "派生：月付/信贷合作"],
  ["east-asia", "阿里巴巴/淘宝天猫（淘宝·CN）", "电商", "派生：花呗/借呗入口（蚂蚁）"],
  ["east-asia", "饿了么（饿了么·CN）", "外卖", "派生：支付宝生态信贷入口"],
  ["east-asia", "携程（携程·CN）", "出行", "派生：拿去花等分期"],
  ["east-asia", "飞猪（飞猪·CN）", "出行", "派生：花呗分期"],
  ["east-asia", "哈啰（哈啰·CN）", "两轮出行", "派生：哈啰金融/信贷合作"],
  ["east-asia", "云闪付（云闪付·CN）", "支付钱包", "派生：银行信贷导流"],
  ["east-asia", "唯品会（唯品会·CN）", "电商", "派生：唯品花"],
  ["east-asia", "苏宁易购（苏宁·CN）", "电商", "派生：任性付/苏宁金融"],
  ["east-asia", "闲鱼（闲鱼·CN）", "二手电商", "派生：闲鱼小贷/芝麻免押"],
  ["east-asia", "贝壳（贝壳·CN）", "房产交易", "派生：贝壳金服历史/信贷合作"],
  ["east-asia", "高德（高德·CN）", "地图出行", "派生：阿里信贷入口"],
  ["east-asia", "百度｜百度｜百度（百度·CN）", "搜索+地图", "派生：度小满｜有钱花｜百度（度小满·CN）"],
  ["se-asia", "Tokopedia（·SEA）", "电商", "派生：GoPay/GoTo金融借贷"],
  ["se-asia", "Traveloka（·SEA）", "出行", "派生：PayLater等"],
  ["se-asia", "MoMo（·SEA）", "支付钱包", "派生：借贷/保险"],
  ["se-asia", "ZaloPay（·SEA）", "支付钱包", "派生：信贷合作"],
  ["se-asia", "Dana（·SEA）", "支付钱包", "派生：信贷/分期"],
  ["se-asia", "OVO（·SEA）", "支付钱包", "派生：借贷合作"],
  ["se-asia", "GCash（·SEA）", "支付钱包/跨境支付汇款", "派生：GLoan等；跨境支付/汇款"],
  ["se-asia", "Maya（·SEA）", "支付钱包+数字银行", "派生：Maya Credit"],
  ["se-asia", "TrueMoney（·SEA）", "支付钱包", "派生：借贷合作"],
  ["south-asia", "Amazon India（·IN）", "电商", "派生：Amazon Pay Later"],
  ["south-asia", "Myntra（·IN）", "电商", "派生：Flipkart生态分期"],
  ["south-asia", "Ola（·IN）", "出行", "派生：Ola Money/金融"],
  ["south-asia", "Amazon Pay（·IN）", "支付钱包", "派生：Pay Later"],
  ["south-asia", "Google Pay India（Google Pay·IN）", "支付钱包", "派生：UPI；信贷合作导流"],
  ["south-asia", "YONO SBI（·IN）", "支付钱包+银行", "派生：银行信贷/贷款入口"],
  ["south-asia", "JioMart（·IN）", "电商", "派生：JioFinance入口"],
  ["south-asia", "BharatPe（·IN）", "支付+商户", "派生：商户贷"],
  ["south-asia", "Mobikwik（·IN）", "支付钱包", "派生：ZIP/信贷"],
  ["south-asia", "Freecharge（·IN）", "支付钱包", "派生：信贷合作"],
  ["south-asia", "Airtel Thanks（·IN）", "电信+支付", "派生：Payments Bank/信贷"],
  ["south-asia", "Tata Neu（·IN）", "超级App", "派生：NeuCard/信贷"],
  ["latam", "Magazine Luiza（·LATAM）", "电商零售", "派生：MagaluPay/信贷"],
  ["latam", "Shopee Brasil（·LATAM）", "电商", "派生：SPayLater等"],
  ["latam", "Amazon Brasil（·LATAM）", "电商", "派生：分期"],
  ["latam", "PicPay（·LATAM）", "支付钱包", "派生：信贷/投资"],
  ["latam", "PagBank（·LATAM）", "支付+银行", "派生：信贷"],
  ["latam", "Casas Bahia（·LATAM）", "零售", "派生：CDC消费分期"],
  ["latam", "Falabella（·LATAM）", "零售", "派生：CMR信用卡/消费贷"],
  ["latam", "Liverpool（·LATAM）", "零售", "派生：信用卡/消费贷"],
  ["latam", "Coppel（·LATAM）", "零售", "派生：Coppel信贷"],
  ["latam", "Nequi（·LATAM）", "支付钱包", "派生：信贷"],
  ["latam", "DaviPlata（·LATAM）", "支付钱包", "派生：银行信贷"],
  ["latam", "Ualá（·LATAM）", "支付钱包", "派生：信贷卡"],
  ["latam", "Uber（Uber·LATAM）", "出行+外卖", "派生：Uber Money/合作信贷；场景原生出行外卖"],
  ["latam", "iFood（iFood·BR）", "外卖", "派生：商户贷/消费信贷合作"],
  ["latam", "PedidosYa（PedidosYa·LATAM）", "外卖", "派生：钱包/信贷合作待核实"],
  ["latam", "Cabify（Cabify·LATAM）", "出行", "派生：企业账户；信贷合作待核实"],
  ["latam", "inDrive（inDrive·LATAM）", "出行", "派生：司机金融合作待核实"],
  ["latam", "Yape（Yape·PE）", "支付钱包", "派生：BCP生态信贷导流"],
  ["latam", "Clip（Clip·MX）", "支付钱包", "派生：商户贷/分期"],
  ["latam", "Americanas（Americanas·BR）", "电商", "派生：Ame Digital/分期"],
  ["latam", "Linio（Linio·LATAM）", "电商", "派生：分期合作待核实"],
  ["latam", "Shein LatAm（Shein·LATAM）", "电商", "派生：Shop Pay Later类合作待核实"],
  ["latam", "Kwai América Latina（快手·LATAM）", "直播+社交", "派生：直播打赏/电商；信贷合作待核实"],
  ["latam", "ByteDance/TikTok LatAm（字节·LATAM）", "直播+社交", "派生：TikTok Shop；信贷合作待核实"],
  ["latam", "Garena Free Fire（Free Fire·LATAM）", "游戏", "派生：虚拟道具支付；信贷合作待核实"],
  ["central-asia", "Kaspi.kz（Kaspi·KZ）", "电商+支付超级App", "派生：Kaspi Pay/分期信贷"],
  ["central-asia", "Uzum（Uzum·UZ）", "电商", "派生：Uzum Nasiya分期"],
  ["central-asia", "Click（Click·UZ）", "支付钱包", "派生：信贷合作待核实"],
  ["central-asia", "Payme（Payme·UZ）", "支付钱包", "派生：信贷合作待核实"],
  ["central-asia", "inDrive（inDrive·KZ）", "出行", "派生：司机侧金融合作待核实"],
  ["east-asia", "LendMN（LendMN·MN）", "支付钱包+信贷入口", "派生：蒙古数字贷款/钱包"],
  ["mena", "赤子城科技/MICO（赤子城·MENA）", "直播+社交", "派生：社交电商/创新业务；信贷合作待核实"],
  ["africa", "Jumia（·非洲）", "电商", "派生：JumiaPay/分期"],
  ["mena", "Noon（·MENA）", "电商", "派生：Noon Pay/分期"],
  ["africa", "Wave（·非洲）", "支付钱包", "派生：小额贷"],
  ["africa", "Airtel Money（·非洲）", "支付钱包", "派生：小额贷"],
  ["africa", "MTN MoMo（·非洲）", "支付钱包", "派生：借贷"],
  ["africa", "Orange Money（·非洲）", "支付钱包", "派生：借贷"],
  ["africa", "PalmPay（·非洲）", "支付钱包", "派生：信贷"],
  ["mena", "STC Pay（·MENA）", "支付钱包", "派生：信贷"],
  ["mena", "Urpay（·MENA）", "支付钱包", "派生：银行信贷"],
  ["west", "Walmart（·US）", "零售", "派生：Walmart Capital/卡分期等"],
  ["west", "Target（·US）", "零售", "派生：RedCard/分期"],
  ["west", "Venmo（·US）", "支付钱包", "派生：Venmo Credit Card"],
  ["west", "PayPal（·US）", "支付钱包/跨境支付汇款", "派生：PayPal Credit/BNPL；跨境汇款"],
  ["west", "Apple Wallet（·US）", "支付钱包", "派生：Apple Card / Pay Later"],
  ["west", "Shopify（·US）", "电商标杆", "派生：Shopify Capital / Shop Pay"],
  ["west", "Revolut（·US）", "支付超级App", "派生：信贷/BNPL"],
  ["west", "Wise/Wise（Wise·US）", "支付钱包/跨境支付汇款", "派生：多币种账户；信贷合作待核实"],
  ["west", "Remitly/Remitly（Remitly·US）", "支付钱包/跨境支付汇款", "派生：跨境汇款主场景；信贷合作待核实"],
  ["west", "Western Union/Western Union（西联·US）", "支付钱包/跨境支付汇款", "派生：全球跨境汇款网络"],
  ["west", "MoneyGram/MoneyGram（速汇金·US）", "支付钱包/跨境支付汇款", "派生：全球跨境汇款网络"],
  ["west", "WorldRemit/WorldRemit（WorldRemit·US）", "支付钱包/跨境支付汇款", "派生：数字跨境汇款"],
];

const creditCrmSeedTuples: [Exclude<Region, "all">, "cash" | "bnpl" | "lease" | "agent", string][] = [
  ["east-asia", "cash", "宜人智科/宜人（宜人·CN）"],
  ["east-asia", "cash", "小赢科技（小赢·CN）"],
  ["east-asia", "cash", "维信金科（维信·CN）"],
  ["east-asia", "cash", "萨摩耶云（萨摩耶·CN）"],
  ["east-asia", "cash", "中关村科金｜马上｜中科金（中科金·CN）"],
  ["east-asia", "cash", "招商银行+中国联通｜招联｜招联（招联·CN）"],
  ["east-asia", "cash", "中原银行｜中原消费｜中原银行（中原·CN）"],
  ["east-asia", "cash", "度小满｜有钱花｜百度（度小满·CN）"],
  ["east-asia", "cash", "数禾｜还呗｜数禾（数禾·CN）"],
  ["east-asia", "cash", "极融云仓（极融云仓·CN）"],
  ["east-asia", "cash", "闪银（闪银·CN）"],
  ["east-asia", "cash", "你我贷（你我贷·CN）"],
  ["east-asia", "cash", "飞贷（飞贷·CN）"],
  ["east-asia", "cash", "好分期（好分期·CN）"],
  ["east-asia", "agent", "融360（融360·CN）"],
  ["east-asia", "cash", "桔子数字（桔子数字·CN）"],
  ["east-asia", "agent", "水滴信贷导流（水滴信贷导流·CN）"],
  ["east-asia", "cash", "中国邮政｜中邮消费｜中国邮政（中邮·CN）"],
  ["se-asia", "cash", "AdaKami/FinVolution（信也·ID）"],
  ["se-asia", "cash", "Easycash/Fintopia（洋钱罐·ID）"],
  ["se-asia", "cash", "Akulaku Finance/Akulaku（阿卡拉克·SEA）"],
  ["se-asia", "cash", "GoTo Financial/GoTo（GoTo·ID）"],
  ["se-asia", "cash", "Shopee Pinjam/Sea（Shopee·SEA）"],
  ["se-asia", "cash", "Home Credit SEA（·SEA）"],
  ["se-asia", "cash", "AEON Financial SEA（·SEA）"],
  ["se-asia", "cash", "UangMe（·ID）"],
  ["se-asia", "cash", "Kredit Pintar（·SEA）"],
  ["se-asia", "cash", "Rupiah Cepat（·ID）"],
  ["se-asia", "cash", "Pinjam Yuk（·SEA）"],
  ["se-asia", "cash", "TunaiKita（·SEA）"],
  ["se-asia", "cash", "CashCash（·SEA）"],
  ["se-asia", "cash", "JuanHand/FinVolution（信也·PH）"],
  ["se-asia", "cash", "Tala（Tala·PH）"],
  ["se-asia", "cash", "GCash/GLoan（GCash·PH）"],
  ["se-asia", "cash", "Cashalo/Paloo（·PH）"],
  ["se-asia", "cash", "Digido（·PH）"],
  ["se-asia", "cash", "ACOM Fast Cash（·SEA）"],
  ["se-asia", "cash", "Advance Tech Lending（·SEA）"],
  ["se-asia", "cash", "Online Loans Pilipinas（·PH）"],
  ["se-asia", "cash", "FE Credit（FE·VN）"],
  ["se-asia", "cash", "Home Credit Vietnam（Home Credit·VN）"],
  ["se-asia", "cash", "Shinhan Finance（新韩·VN）"],
  ["se-asia", "cash", "HD Saison（VN·SBV）"],
  ["se-asia", "cash", "Mcredit（VN·SBV）"],
  ["se-asia", "cash", "AEON Credit Service/AEON Credit（AEON·MY）"],
  ["se-asia", "cash", "RCE Marketing（·MY）"],
  ["se-asia", "cash", "AEON Thana Sinsap（TH·BOT）"],
  ["se-asia", "cash", "Easy Buy（Easy Buy·TH）"],
  ["se-asia", "cash", "Ascend Nano/Ascend（Ascend·TH）"],
  ["se-asia", "cash", "Krungsri Consumer（TH·BOT）"],
  ["se-asia", "cash", "Amartha（ID·OJK LPBBTI）"],
  ["se-asia", "cash", "Investree（ID·OJK LPBBTI）"],
  ["se-asia", "cash", "JULO（·ID）"],
  // OJK LPBBTI 官网名录交叉补录（2025-07/08 公开名单；与已有 AdaKami/Easycash 等去重）
  ["se-asia", "cash", "Danamas/PT Pasar Dana Pinjaman（Danamas·ID）"],
  ["se-asia", "cash", "Dompet Kilat/PT Indo FinTek（DompetKilat·ID）"],
  ["se-asia", "cash", "Modalku/PT Mitrausaha Indonesia Grup（Modalku·ID）"],
  ["se-asia", "cash", "KTA Kilat/PT Pendanaan Teknologi Nusa（KTAKilat·ID）"],
  ["se-asia", "cash", "Finmas/PT Oriente Mas Sejahtera（Finmas·ID）"],
  ["se-asia", "cash", "Akseleran/PT Akseleran Keuangan Inklusif（Akseleran·ID）"],
  ["se-asia", "cash", "KoinWorks/KoinP2P（KoinWorks·ID）"],
  ["se-asia", "cash", "Indodana/PT Artha Dana Teknologi（Indodana·ID）"],
  ["se-asia", "cash", "DanaRupiah/PT Layanan Keuangan Berbagi（DanaRupiah·ID）"],
  ["se-asia", "cash", "Alami/PT Alami Fintek Sharia（Alami·ID）"],
  ["se-asia", "cash", "AwanTunai/PT Simplefi Teknologi（AwanTunai·ID）"],
  ["se-asia", "cash", "Singa/PT Abadi Sejahtera Finansindo（Singa·ID）"],
  ["se-asia", "cash", "BATUMBU/PT Berdayakan Usaha Indonesia（Batumbu·ID）"],
  ["se-asia", "cash", "Cashcepat/PT Artha Permata Makmur（Cashcepat·ID）"],
  ["se-asia", "cash", "Cicil/PT Cicil Solusi Mitra Teknologi（Cicil·ID）"],
  ["se-asia", "cash", "Kredito/PT Fintek Digital Indonesia（Kredito·ID）"],
  ["se-asia", "cash", "AdaPundi/PT Info Tekno Siaga（AdaPundi·ID）"],
  ["se-asia", "cash", "Komunal/PT Komunal Finansial Indonesia（Komunal·ID）"],
  ["se-asia", "cash", "Gradana/PT Gradana Teknoruci（Gradana·ID）"],
  ["se-asia", "cash", "Danacita/PT Inclusive Finance Group（Danacita·ID）"],
  ["se-asia", "cash", "KrediFazz/PT KrediFazz Digital（KrediFazz·ID）"],
  ["se-asia", "cash", "Doeku/PT Doeku Peduli Indonesia（Doeku·ID）"],
  ["se-asia", "cash", "Edufund/PT Fintech Bina Bangsa（Edufund·ID）"],
  ["se-asia", "cash", "ETHIS/PT Ethis Fintek Indonesia（Ethis·ID）"],
  ["se-asia", "cash", "Findaya/PT Mapan Global Reksa（Findaya·ID）"],
  ["se-asia", "cash", "Pinjamin/PT Progo Puncak Group（Pinjamin·ID）"],
  ["se-asia", "cash", "PinjamModal/PT Finansial Integrasi Teknologi（PinjamModal·ID）"],
  ["se-asia", "cash", "ModalRakyat/PT Modal Rakyat Indonesia（ModalRakyat·ID）"],
  ["south-asia", "cash", "MoneyView（·IN）"],
  ["south-asia", "cash", "CASHe（·IN）"],
  ["south-asia", "cash", "Fibe（·IN）"],
  ["south-asia", "cash", "Navi（·IN）"],
  ["south-asia", "cash", "PaySense（·IN）"],
  ["south-asia", "cash", "MoneyTap（·IN）"],
  ["south-asia", "cash", "Lendingkart（·IN）"],
  ["south-asia", "cash", "Axio（·IN）"],
  ["south-asia", "cash", "Bajaj Finance（·IN）"],
  ["south-asia", "cash", "Tata Capital（·IN）"],
  ["south-asia", "cash", "Mahindra Finance（·IN）"],
  ["south-asia", "cash", "Home Credit India（·IN）"],
  ["south-asia", "cash", "SmartCoin（·IN）"],
  ["south-asia", "cash", "Mpokket（·IN）"],
  ["south-asia", "cash", "Stashfin（·IN）"],
  ["south-asia", "cash", "IDLC Finance（BD·BB NBFI）"],
  ["south-asia", "cash", "IPDC Finance（BD·BB NBFI）"],
  ["south-asia", "cash", "LankaBangla Finance（BD·BB NBFI）"],
  ["south-asia", "cash", "United Finance（BD·BB NBFI）"],
  ["south-asia", "cash", "Paisayaar / JingleCred（PK·SECP Lending NBFC）"],
  ["south-asia", "cash", "JazzCash Digital Lending（PK·SECP）"],
  ["south-asia", "cash", "Aitemaad / 4Sight（PK·SECP）"],
  ["south-asia", "cash", "Fauri Cash / Pakisnova（PK·SECP）"],
  ["south-asia", "cash", "PakCredit / VisionCred（PK·SECP）"],
  ["south-asia", "cash", "Loan Lado / Easy Finance（PK·SECP）"],
  ["south-asia", "cash", "LOLC Finance（LK·CBSL LFC）"],
  ["south-asia", "cash", "LB Finance（LK·CBSL LFC）"],
  ["south-asia", "cash", "Commercial Credit & Finance（LK·CBSL LFC）"],
  ["south-asia", "cash", "People's Leasing & Finance（LK·CBSL LFC）"],
  ["south-asia", "cash", "HNB Finance（LK·CBSL LFC）"],
  ["south-asia", "cash", "Dialog Finance（LK·CBSL LFC）"],
  ["latam", "cash", "Creditas（·LATAM）"],
  ["latam", "cash", "Crefisa（·LATAM）"],
  ["latam", "cash", "Simplic（·LATAM）"],
  ["latam", "cash", "Juvo（·LATAM）"],
  ["latam", "cash", "Credmex/Fintopia（洋钱罐·MX）"],
  ["latam", "cash", "中关村科金｜待核｜中科金（中科金·MX）"],
  ["latam", "cash", "Kueski Cash（·LATAM）"],
  ["latam", "cash", "Konfío（·LATAM）"],
  ["latam", "cash", "Creditea（·LATAM）"],
  ["latam", "cash", "Prestadero（·LATAM）"],
  ["latam", "cash", "RapiCredit（·LATAM）"],
  ["latam", "cash", "Lineru（·LATAM）"],
  ["latam", "cash", "TPaga借贷（·LATAM）"],
  ["latam", "cash", "Claropay借贷臂（·LATAM）"],
  ["latam", "cash", "Ualá信贷（·LATAM）"],
  ["latam", "cash", "Rappi Credit/Rappi（Rappi·LATAM）"],
  ["latam", "cash", "Mercado Credito/Mercado Libre（美卡多·LATAM）"],
  ["latam", "cash", "DiDi Credit/DiDi（滴滴·LATAM）"],
  ["latam", "cash", "Banco Pan合作贷（·LATAM）"],
  ["latam", "cash", "Solventa（·CO）"],
  ["latam", "cash", "Facio（·BR）"],
  ["africa", "cash", "FairMoney（·非洲）"],
  ["africa", "cash", "Carbon（·非洲）"],
  ["africa", "cash", "PalmCredit（·非洲）"],
  ["africa", "cash", "Branch（Branch·NG）"],
  ["africa", "cash", "Tala（Tala·KE）"],
  ["africa", "cash", "Zenka（·非洲）"],
  ["africa", "cash", "Okash（·非洲）"],
  ["mena", "cash", "Halan（·MENA）"],
  ["mena", "cash", "MoneyFellows（·MENA）"],
  ["mena", "cash", "ValU现金臂（·MENA）"],
  ["mena", "cash", "Contact（·MENA）"],
  ["africa", "cash", "LendPlus（·ZA）"],
  ["mena", "cash", "Halan（·EG）"],
  ["mena", "cash", "EasyGeneh（·EG）"],
  ["africa", "cash", "OKash（·NG）"],
  ["africa", "cash", "FinChoice（·ZA）"],
  ["africa", "cash", "TargetCredit（·GH）"],
  ["africa", "cash", "Hypera Cash（·KE）"],
  ["africa", "cash", "KKPesa（·TZ）"],
  ["west", "cash", "LendingClub（·US）"],
  ["west", "cash", "Prosper（·US）"],
  ["west", "cash", "SoFi Lending（·US）"],
  ["west", "cash", "Upgrade（·US）"],
  ["west", "cash", "Avant（·US）"],
  ["west", "cash", "Earnest（·US）"],
  ["west", "cash", "Best Egg（·US）"],
  ["west", "cash", "OneMain（·US）"],
  ["west", "cash", "OppLoans（·US）"],
  ["west", "cash", "CashNetUSA（·US）"],
  ["west", "cash", "EarnIn（·US）"],
  ["west", "cash", "Dave（·US）"],
  ["west", "cash", "Brigit（·US）"],
  ["west", "cash", "MoneyLion（·US）"],
  ["west", "cash", "Credit Genie（·US）"],
  ["west", "cash", "Younited Credit（·US）"],
  ["west", "cash", "Auxmoney（·US）"],
  ["west", "cash", "Smava（·US）"],
  ["west", "cash", "Cofidis（·US）"],
  ["east-asia", "bnpl", "蚂蚁/花呗（蚂蚁·CN）"],
  ["east-asia", "bnpl", "京东/白条（京东·CN）"],
  ["east-asia", "bnpl", "字节跳动/抖音月付（抖音·CN）"],
  ["east-asia", "bnpl", "美团/美团月付（美团·CN）"],
  ["east-asia", "bnpl", "唯品花（唯品花·CN）"],
  ["east-asia", "bnpl", "苏宁任性付（苏宁任性付·CN）"],
  ["east-asia", "bnpl", "携程拿去花（携程拿去花·CN）"],
  ["east-asia", "bnpl", "腾讯/分付（腾讯·CN）"],
  ["east-asia", "bnpl", "桔子分期（桔子分期·CN）"],
  ["east-asia", "bnpl", "分期乐（分期乐·CN）"],
  ["east-asia", "bnpl", "JP BNPL Paidy（·JP）"],
  ["se-asia", "bnpl", "SPayLater/Shopee/Sea（Shopee·SEA）"],
  ["se-asia", "bnpl", "Grab PayLater/Grab（Grab·SEA）"],
  ["se-asia", "bnpl", "GoPayLater/GoTo（GoTo·ID）"],
  ["se-asia", "bnpl", "Akulaku Cicilan/Akulaku（阿卡拉克·ID）"],
  ["se-asia", "bnpl", "Home Credit BNPL（·SEA）"],
  ["se-asia", "bnpl", "Indodana（·SEA）"],
  ["se-asia", "bnpl", "KreditPlus（·SEA）"],
  ["se-asia", "bnpl", "FIFGROUP（·SEA）"],
  ["se-asia", "bnpl", "BFI Finance（·SEA）"],
  ["se-asia", "bnpl", "AEON Credit MY/TH（·MY）"],
  ["se-asia", "bnpl", "Pace BNPL（·SEA）"],
  ["se-asia", "bnpl", "BillEase（·SEA）"],
  ["se-asia", "bnpl", "Cashalo（·SEA）"],
  ["se-asia", "bnpl", "Split新马（·SEA）"],
  ["south-asia", "bnpl", "Simpl（·IN）"],
  ["south-asia", "bnpl", "LazyPay（·IN）"],
  ["south-asia", "bnpl", "Snapmint（·IN）"],
  ["south-asia", "bnpl", "ZestMoney（·IN）"],
  ["south-asia", "bnpl", "Amazon Pay Later IN（·IN）"],
  ["south-asia", "bnpl", "Flipkart Pay Later（·IN）"],
  ["south-asia", "bnpl", "ePayLater（·IN）"],
  ["south-asia", "bnpl", "Postpe（·IN）"],
  ["south-asia", "bnpl", "Uni Cards（·IN）"],
  ["south-asia", "bnpl", "Slice（·IN）"],
  ["south-asia", "bnpl", "CRED mint（·IN）"],
  ["south-asia", "bnpl", "Bajaj Mall EMI（·IN）"],
  ["south-asia", "bnpl", "TVS Credit（·IN）"],
  ["latam", "bnpl", "Mercado Credito分期（·LATAM）"],
  ["latam", "bnpl", "Magalu parcelado（·LATAM）"],
  ["latam", "bnpl", "Casas Bahia CDC（·LATAM）"],
  ["latam", "bnpl", "Aplazo（Aplazo·MX）"],
  ["latam", "bnpl", "Kueski Pay（·LATAM）"],
  ["latam", "bnpl", "Clip BNPL（·LATAM）"],
  ["latam", "bnpl", "Sistecredito（·LATAM）"],
  ["latam", "bnpl", "Naranja X（·LATAM）"],
  ["latam", "bnpl", "Ualá卡分期（·LATAM）"],
  ["latam", "bnpl", "Ripley分期（·LATAM）"],
  ["latam", "bnpl", "Falabella CMR（·LATAM）"],
  ["latam", "bnpl", "DiDi Pay分期（·LATAM）"],
  ["latam", "bnpl", "Cuotitas南锥（·LATAM）"],
  ["mena", "bnpl", "Spotii（·MENA）"],
  ["mena", "bnpl", "Postpay（·MENA）"],
  ["mena", "bnpl", "Cashew（·MENA）"],
  ["mena", "bnpl", "Syarah分期（·MENA）"],
  ["mena", "bnpl", "ValU（·MENA）"],
  ["mena", "bnpl", "Souhoola（·MENA）"],
  ["mena", "bnpl", "Noon Pay Later（·MENA）"],
  ["mena", "bnpl", "Amazon AE分期（·MENA）"],
  ["africa", "bnpl", "Jumia Pay分期（·非洲）"],
  ["africa", "bnpl", "M-Pesa Fuliza（·非洲）"],
  ["africa", "bnpl", "OPay BNPL（·非洲）"],
  ["africa", "bnpl", "Carbon Shop（·非洲）"],
  ["west", "bnpl", "PayPal Pay in 4（·IN）"],
  ["west", "bnpl", "Apple Pay Later（·US）"],
  ["west", "bnpl", "Sezzle（·US）"],
  ["west", "bnpl", "Zip（·US）"],
  ["west", "bnpl", "Bread（·US）"],
  ["west", "bnpl", "Synchrony零售卡（·US）"],
  ["west", "bnpl", "Clearpay（·US）"],
  ["west", "bnpl", "Laybuy（·US）"],
  ["west", "bnpl", "Scalapay（·US）"],
  ["west", "bnpl", "Alma（·US）"],
  ["west", "bnpl", "PayPal欧盟分期（·EU）"],
  ["west", "bnpl", "DivideBuy（·US）"],
  ["east-asia", "lease", "平安租赁消费臂（平安租赁消费臂·CN）"],
  ["east-asia", "lease", "狮桥（狮桥·CN）"],
  ["east-asia", "lease", "悦租（悦租·CN）"],
  ["east-asia", "lease", "享借（享借·CN）"],
  ["east-asia", "lease", "机融租赁（机融租赁·CN）"],
  ["east-asia", "lease", "提钱乐租机（提钱乐租机·CN）"],
  ["east-asia", "lease", "花花租（花花租·CN）"],
  ["east-asia", "lease", "物主租赁（物主租赁·CN）"],
  ["east-asia", "lease", "优品租（优品租·CN）"],
  ["east-asia", "lease", "刀锋网络/租号玩（租号玩·CN）"],
  ["east-asia", "lease", "U号租（U号租·CN）"],
  ["se-asia", "lease", "Home Credit设备贷（·SEA）"],
  ["se-asia", "lease", "Samsung Finance SEA（·SEA）"],
  ["south-asia", "lease", "Samsung Finance+ IN（·IN）"],
  ["south-asia", "lease", "Bajaj 3C EMI（·IN）"],
  ["south-asia", "lease", "TVS Credit两轮（·IN）"],
  ["south-asia", "lease", "Mahindra车辆金融（·IN）"],
  ["south-asia", "lease", "Hero FinCorp（·IN）"],
  ["south-asia", "lease", "Tata车贷租赁（·IN）"],
  ["south-asia", "lease", "Zoomcar（·IN）"],
  ["south-asia", "lease", "Revv（·IN）"],
  ["south-asia", "lease", "Rentomojo（·IN）"],
  ["south-asia", "lease", "Furlenco（·IN）"],
  ["south-asia", "lease", "Cityfurnish（·IN）"],
  ["south-asia", "lease", "Home Credit IN设备（·IN）"],
  ["latam", "lease", "Allugator（·LATAM）"],
  ["latam", "lease", "Samsung巴西金融（·BR）"],
  ["latam", "lease", "Casas Bahia设备CDC（·LATAM）"],
  ["latam", "lease", "PayJoy MX（·MX）"],
  ["latam", "lease", "Coppel手机分期（·LATAM）"],
  ["latam", "lease", "Liverpool手机（·LATAM）"],
  ["latam", "lease", "Creditas车贷（·LATAM）"],
  ["latam", "lease", "Localiza订阅（·LATAM）"],
  ["latam", "lease", "Movida订阅（·LATAM）"],
  ["latam", "lease", "Kinto订阅（·LATAM）"],
  ["latam", "lease", "Moto融资CO/BR（·BR）"],
  ["africa", "lease", "Sun King PAYG（·非洲）"],
  ["africa", "lease", "d.light（·非洲）"],
  ["africa", "lease", "FairMoney设备（·非洲）"],
  ["west", "lease", "Synchrony苹果包（·US）"],
  ["west", "lease", "DLL设备租赁（·US）"],
  ["west", "lease", "Element Fleet（·US）"],
  ["west", "lease", "FINN汽车订阅（·US）"],
  ["west", "lease", "Sixt+（·US）"],
  ["west", "lease", "Care by Volvo（·US）"],
  ["west", "lease", "Porsche Drive（·US）"],
  ["west", "lease", "FlexShopper（·US）"],
  ["west", "lease", "Katapult（·US）"],
  ["west", "lease", "Aaron's（·US）"],
  ["west", "lease", "Progressive Leasing（·US）"],
  ["west", "lease", "Acima（·US）"],
];

const sceneCrmSeeds: SceneSeed[] = sceneCrmSeedTuples.map(
  ([region, group, sceneType, creditAttach]) => ({
    region,
    group,
    sceneType,
    creditAttach,
  }),
);

// AUTO: 路飞的海外风控笔记 Google Play 借款榜 2026-08-01 扩表
const luffyCreditSeedTuples: [Exclude<Region, "all">, "cash" | "bnpl" | "lease" | "agent", string][] = [
  // --- agent ---
  ["se-asia", "agent", "PinjamPasti（·ID）"],
  ["se-asia", "agent", "Yup（·ID）"],
  ["se-asia", "agent", "UangIndo（·ID）"],
  ["se-asia", "agent", "Uang Sahabat（·ID）"],
  ["se-asia", "agent", "Tunai Cakra（·ID）"],
  ["se-asia", "agent", "Dana Yuk（·ID）"],
  ["se-asia", "agent", "PinjamAmanah（·ID）"],
  ["se-asia", "agent", "UiPinjam（·ID）"],
  ["se-asia", "agent", "PinjamPlus（·ID）"],
  ["se-asia", "agent", "Kredit Kancil（·ID）"],
  ["se-asia", "agent", "Pinjam Aja（·ID）"],
  ["se-asia", "agent", "Tiền24（·VN）"],
  ["se-asia", "agent", "Hẹn Mức+（·VN）"],
  ["se-asia", "agent", "Sen Vay（·VN）"],
  ["se-asia", "agent", "VayTínPhát（·VN）"],
  ["se-asia", "agent", "Vay Nhanh FinSearch（·VN）"],
  ["se-asia", "agent", "An Tâm Vay（·VN）"],
  ["se-asia", "agent", "CreditXpress（·MY）"],
  ["se-asia", "agent", "Paylaju EX（·MY）"],
  ["se-asia", "agent", "LoanCepat（·MY）"],
  ["se-asia", "agent", "Duit Now（·MY）"],
  ["se-asia", "agent", "ProLoan（·MY）"],
  ["se-asia", "agent", "Kasih Kredit（·MY）"],
  ["se-asia", "agent", "DuitGo（·MY）"],
  ["se-asia", "agent", "พามาแก้โจทย์（·TH）"],
  ["se-asia", "agent", "Spe（·TH）"],
  ["se-asia", "agent", "ไปทำขับดี（·TH）"],
  ["se-asia", "agent", "เงินเหลือในกระเป๋า（·TH）"],
  ["south-asia", "agent", "GoCredit（·IN）"],
  ["south-asia", "agent", "SwipeLoan（·IN）"],
  ["south-asia", "agent", "Paizo（·IN）"],
  ["south-asia", "agent", "FlexiBee（·IN）"],
  ["south-asia", "agent", "Bajaj Markets（·IN）"],
  ["south-asia", "agent", "PayMe（·IN）"],
  ["south-asia", "agent", "LoanVanta（·IN）"],
  ["south-asia", "agent", "Quid（·IN）"],
  ["south-asia", "agent", "Cridgo（·IN）"],
  ["south-asia", "agent", "CreditSea（·IN）"],
  ["south-asia", "agent", "Muthoot FinCorp ONE（·IN）"],
  ["south-asia", "agent", "BrightLoans（·IN）"],
  ["south-asia", "agent", "Kredit Rupee（·IN）"],
  ["south-asia", "agent", "Buddy Loan（·IN）"],
  ["south-asia", "agent", "PopKash（·BD）"],
  ["south-asia", "agent", "Dost Loan（·BD）"],
  ["south-asia", "agent", "ALO Kash（·BD）"],
  ["south-asia", "agent", "TakaGo Pro（·BD）"],
  ["south-asia", "agent", "Loan Haat（·BD）"],
  ["south-asia", "agent", "GrowPak e-Loan Manager（·PK）"],
  ["south-asia", "agent", "Online Loans Sri Lanka（·LK）"],
  ["south-asia", "agent", "Loanme（·LK）"],
  ["south-asia", "agent", "ProLoan（·LK）"],
  ["latam", "agent", "Dinero Rápido UD（·MX）"],
  ["latam", "agent", "Préstamo Personal en línea（·MX）"],
  ["latam", "agent", "ClipCash（·MX）"],
  ["latam", "agent", "Dinero Fácil MX（·MX）"],
  ["latam", "agent", "Préstamo Rápido Cash（·MX）"],
  ["latam", "agent", "Más Efectivo（·CO）"],
  ["latam", "agent", "Finversor（·CO）"],
  ["latam", "agent", "ColombiaFin（·CO）"],
  ["latam", "agent", "Crédito Fácil y Rápido（·CO）"],
  ["latam", "agent", "Préstamos Personales en línea（·CO）"],
  ["latam", "agent", "Aprov（·BR）"],
  ["latam", "agent", "PazCrédito（·BR）"],
  ["latam", "agent", "Empréstimos Pessoais Rápidos（·BR）"],
  ["latam", "agent", "Credit Card Matcher（·BR）"],
  ["latam", "agent", "Aro（·BR）"],
  ["latam", "agent", "Crédito Popular（·BR）"],
  ["latam", "agent", "CloQ（·BR）"],
  ["latam", "agent", "Empréstimo SIM（·BR）"],
  ["latam", "agent", "PegaCrédito（·BR）"],
  ["latam", "agent", "Préstamo Personal con DNI（·AR）"],
  ["latam", "agent", "PlataPro（·AR）"],
  ["latam", "agent", "Molina Plata（·AR）"],
  ["latam", "agent", "CrediRey（·AR）"],
  ["latam", "agent", "ElegiCrédito（·AR）"],
  ["latam", "agent", "FlyCred（·AR）"],
  ["latam", "agent", "CreContigo（·PE）"],
  ["latam", "agent", "QullqiFacil（·PE）"],
  ["latam", "agent", "SolPrestamo（·PE）"],
  ["latam", "agent", "PlataPro（·PE）"],
  ["latam", "agent", "Mi Credito Peru（·PE）"],
  ["latam", "agent", "PlazaCrédito（·CL）"],
  ["latam", "agent", "PlataPro（·CL）"],
  ["latam", "agent", "DineroAhora（·CL）"],
  ["latam", "agent", "Prestamos Online Ecuador（·EC）"],
  ["latam", "agent", "Efectivo Ya（·EC）"],
  ["africa", "agent", "CashX（·NG）"],
  ["africa", "agent", "Futurecash（·NG）"],
  ["africa", "agent", "GetKash（·NG）"],
  ["africa", "agent", "Quick Loan Easy Cash（·GH）"],
  ["africa", "agent", "Personal Loans Quick Cash（·ZA）"],
  ["africa", "agent", "Credit Card Easy approval（·ZA）"],
  ["africa", "agent", "Quick Loan（·UG）"],
  ["africa", "agent", "Pesa Go（·UG）"],
  ["africa", "agent", "MSACCO（·UG）"],
  ["africa", "agent", "Ozzy pesa（·TZ）"],
  ["africa", "agent", "Pesa Max（·TZ）"],
  ["central-asia", "agent", "OrdaCredit（·KZ）"],
  ["central-asia", "agent", "Банки.ру（KZ/KG/UZ·路飞中介）"],
  ["central-asia", "agent", "Банк Онлайн系列（中亚·路飞中介）"],
  ["central-asia", "agent", "Finko（·UZ）"],
  ["central-asia", "agent", "Finq（·UZ）"],
  ["central-asia", "agent", "Onlayn qarzlar（·UZ）"],
  ["se-asia", "cash", "Danaku（·ID）"],
  ["se-asia", "cash", "FinPlus（·ID）"],
  ["se-asia", "cash", "Adapundi（·ID）"],
  ["se-asia", "cash", "Pinjam Yuk（·ID）"],
  ["se-asia", "cash", "Indosaku（·ID）"],
  ["se-asia", "cash", "Artha Niaga（·ID）"],
  ["se-asia", "cash", "Cairin（·ID）"],
  ["se-asia", "cash", "BantuSaku（·ID）"],
  ["se-asia", "cash", "UATAS（·ID）"],
  ["se-asia", "cash", "PinjamDuit（·ID）"],
  ["se-asia", "cash", "Lumbung Dana（·ID）"],
  ["se-asia", "cash", "Cashcepat（·ID）"],
  ["se-asia", "cash", "Pinjamin（·ID）"],
  ["se-asia", "cash", "Dana Pinjam（·ID）"],
  ["se-asia", "cash", "Singa Fintech（·ID）"],
  ["se-asia", "cash", "Kredito（·ID）"],
  ["se-asia", "cash", "UKU（·ID）"],
  ["se-asia", "cash", "KTA KILAT（·ID）"],
  ["se-asia", "cash", "KreditOK（·ID）"],
  ["se-asia", "cash", "Samir（·ID）"],
  ["se-asia", "cash", "Ada Modal（·ID）"],
  ["se-asia", "cash", "KlikKami（·ID）"],
  ["se-asia", "cash", "FE ONLINE（·VN）"],
  ["se-asia", "cash", "Home Credit VN（·VN）"],
  ["se-asia", "cash", "Dola Dong（·VN）"],
  ["se-asia", "cash", "Ví Tốt（·VN）"],
  ["se-asia", "cash", "VayDễ（·VN）"],
  ["se-asia", "cash", "GemCredit（·VN）"],
  ["se-asia", "cash", "VayNhanh（·VN）"],
  ["se-asia", "cash", "Canaan Tôi（·VN）"],
  ["se-asia", "cash", "CỏLiền（·VN）"],
  ["se-asia", "cash", "iShinhan（·VN）"],
  ["se-asia", "cash", "Sdong（·VN）"],
  ["se-asia", "cash", "Vietdong（·VN）"],
  ["se-asia", "cash", "AnTin（·VN）"],
  ["se-asia", "cash", "Ví Tiện Lợi（·VN）"],
  ["se-asia", "cash", "Ví Vàng（·VN）"],
  ["se-asia", "cash", "HIFI CREDIT（·VN）"],
  ["se-asia", "cash", "Tala VN（·VN）"],
  ["se-asia", "cash", "FinVui（·VN）"],
  ["se-asia", "cash", "SHBFinance（·VN）"],
  ["se-asia", "cash", "TiềnDễ（·VN）"],
  ["se-asia", "cash", "VayMax（·VN）"],
  ["se-asia", "cash", "Mdong（·VN）"],
  ["se-asia", "cash", "Bình Lạc（·VN）"],
  ["se-asia", "cash", "Vitalloc（·VN）"],
  ["se-asia", "cash", "CUB Vietnam（·VN）"],
  ["se-asia", "cash", "Cần Là Có（·VN）"],
  ["se-asia", "cash", "Siêu vay（·VN）"],
  ["se-asia", "cash", "Sika Rush（·VN）"],
  ["se-asia", "cash", "HD Saison（·VN）"],
  ["se-asia", "cash", "Tiger Dong（·VN）"],
  ["se-asia", "cash", "Vốn Nhanh（·VN）"],
  ["se-asia", "cash", "VayĐồng（·VN）"],
  ["se-asia", "cash", "FastRinggit（·MY）"],
  ["se-asia", "cash", "Tambadana（·MY）"],
  ["se-asia", "cash", "FlexiDuit（·MY）"],
  ["se-asia", "cash", "Evo Credit（·MY）"],
  ["se-asia", "cash", "Fundora（·MY）"],
  ["se-asia", "cash", "Nimbura（·MY）"],
  ["se-asia", "cash", "Finroro（·MY）"],
  ["se-asia", "cash", "Adacash（·MY）"],
  ["se-asia", "cash", "DanaHero（·MY）"],
  ["se-asia", "cash", "WantKash（·MY）"],
  ["se-asia", "cash", "KreditMy（·MY）"],
  ["se-asia", "cash", "CashNow MY（·MY）"],
  ["se-asia", "cash", "J-Clicks（·MY）"],
  ["se-asia", "cash", "Emicro Loan（·MY）"],
  ["se-asia", "cash", "Pinjamin MY（·MY）"],
  ["se-asia", "cash", "SpeedyAid（·MY）"],
  ["se-asia", "cash", "mudahpinjam（·MY）"],
  ["se-asia", "cash", "557 Pinjaman（·MY）"],
  ["se-asia", "cash", "Pantas Loan（·MY）"],
  ["se-asia", "cash", "SHENMA Mobile（·MY）"],
  ["se-asia", "cash", "Happy Pinjaman（·MY）"],
  ["se-asia", "cash", "Fast Loan MY（·MY）"],
  ["se-asia", "cash", "Trust Loans MY（·MY）"],
  ["se-asia", "cash", "MAXS Pinjaman（·MY）"],
  ["se-asia", "cash", "FairMoney MY（·MY）"],
  ["se-asia", "cash", "Pinjaman Red Sun（·MY）"],
  ["se-asia", "cash", "อิ่มคล่อง（·TH）"],
  ["se-asia", "cash", "เงินติดมือ（·TH）"],
  ["se-asia", "cash", "A money（·TH）"],
  ["se-asia", "cash", "SmartCash TH（·TH）"],
  ["se-asia", "cash", "Good Money GSB（·TH）"],
  ["se-asia", "cash", "Loan Hub（·TH）"],
  ["se-asia", "cash", "PROMISE（·TH）"],
  ["se-asia", "cash", "นึกจัด（·TH）"],
  ["se-asia", "cash", "มินิมอล（·TH）"],
  ["se-asia", "cash", "อุ่นใจ（·TH）"],
  ["se-asia", "cash", "สินเชื่อบีบี（·TH）"],
  ["se-asia", "cash", "EASY สินเชื่อ（·TH）"],
  ["se-asia", "cash", "อีซี่บาย（·TH）"],
  ["se-asia", "cash", "มีตัง（·TH）"],
  ["se-asia", "cash", "กู้ง่ายๆ（·TH）"],
  ["se-asia", "cash", "FINNIX（·TH）"],
  ["se-asia", "cash", "Thong（·TH）"],
  ["se-asia", "cash", "CardX（·TH）"],
  ["se-asia", "cash", "ปลาร้า（·TH）"],
  ["se-asia", "cash", "ฟาร์มอีส（·TH）"],
  ["se-asia", "cash", "PAYPAYA（·TH）"],
  ["se-asia", "cash", "ชัยแคปิตอล（·TH）"],
  ["se-asia", "cash", "MoneyThunder（·TH）"],
  ["se-asia", "cash", "MoneyElephant（·TH）"],
  ["se-asia", "cash", "Umay+（·TH）"],
  ["se-asia", "cash", "สมใจ（·TH）"],
  ["se-asia", "cash", "Rabbit Cash（·TH）"],
  ["se-asia", "cash", "Nebula Cash（·TH）"],
  ["se-asia", "cash", "Kashjoy（·TH）"],
  ["se-asia", "cash", "PocketLend（·TH）"],
  ["se-asia", "cash", "Gad Cash（·TH）"],
  ["se-asia", "cash", "GagaCredit（·TH）"],
  ["se-asia", "cash", "Credit Cash PH（·PH）"],
  ["se-asia", "cash", "Skyro（·PH）"],
  ["se-asia", "cash", "Pesoloan（·PH）"],
  ["se-asia", "cash", "Tekcash（·PH）"],
  ["se-asia", "cash", "Cashify PH（·PH）"],
  ["se-asia", "cash", "Peso Cash Loan（·PH）"],
  ["se-asia", "cash", "PeraMoo（·PH）"],
  ["se-asia", "cash", "Mr. Cash（·PH）"],
["south-asia", "cash", "Kissht（·IN）"],
  ["south-asia", "cash", "True Balance（·IN）"],
  ["south-asia", "cash", "FatakPay（·IN）"],
  ["south-asia", "cash", "PayRupik（·IN）"],
  ["south-asia", "cash", "DMI（·IN）"],
  ["south-asia", "cash", "Home Credit（·IN）"],
  ["south-asia", "cash", "Poonawalla（·IN）"],
  ["south-asia", "cash", "ASH Money（·BD）"],
  ["south-asia", "cash", "FinCash（·BD）"],
  ["south-asia", "cash", "CashCorner（·BD）"],
  ["south-asia", "cash", "Cashora（·BD）"],
  ["south-asia", "cash", "QuickLoan（·BD）"],
  ["south-asia", "cash", "DhakaFin（·BD）"],
  ["south-asia", "cash", "BBL Shubidha（·BD）"],
  ["south-asia", "cash", "wagely（·BD）"],
  ["south-asia", "cash", "BongoCash（·BD）"],
  ["south-asia", "cash", "Paisayaar（·PK）"],
  ["south-asia", "cash", "SmartQarza（·PK）"],
  ["south-asia", "cash", "Daira（·PK）"],
  ["south-asia", "cash", "Aitemaad（·PK）"],
  ["south-asia", "cash", "Fauri Cash（·PK）"],
  ["south-asia", "cash", "SAHARA（·PK）"],
  ["south-asia", "cash", "QarzMitra（·PK）"],
  ["south-asia", "cash", "ForiQarz（·PK）"],
  ["south-asia", "cash", "PakCredit（·PK）"],
  ["south-asia", "cash", "OnCredit（·LK）"],
  ["south-asia", "cash", "HastyCredit（·LK）"],
  ["south-asia", "cash", "InsCash（·LK）"],
  ["south-asia", "cash", "Loan Plus（·LK）"],
  ["south-asia", "cash", "CashGedara（·LK）"],
  ["south-asia", "cash", "LakCash（·LK）"],
  ["south-asia", "cash", "CashMate（·LK）"],
  ["south-asia", "cash", "Kreditone（·LK）"],
  ["south-asia", "cash", "MyKredit（·LK）"],
  ["latam", "cash", "Duai（·MX）"],
  ["latam", "cash", "TiiT（·MX）"],
  ["latam", "cash", "Kaby（·MX）"],
  ["latam", "cash", "LaLANITA（·MX）"],
  ["latam", "cash", "Qrece（·MX）"],
  ["latam", "cash", "PréstamoClaro（·MX）"],
  ["latam", "cash", "Rápikrédito（·MX）"],
  ["latam", "cash", "We Finanzas（·MX）"],
  ["latam", "cash", "ALA（·MX）"],
  ["latam", "cash", "Moneyman（·MX）"],
  ["latam", "cash", "Boaya（·MX）"],
  ["latam", "cash", "Cresia（·MX）"],
  ["latam", "cash", "OKDinero（·MX）"],
  ["latam", "cash", "PrestaGo（·MX）"],
  ["latam", "cash", "LuckyPlata（·CO）"],
  ["latam", "cash", "Rapid Crédito（·CO）"],
  ["latam", "cash", "Dinerbacano（·CO）"],
  ["latam", "cash", "CrediApoyo（·CO）"],
  ["latam", "cash", "Platayuda（·CO）"],
  ["latam", "cash", "Crédito365（·CO）"],
  ["latam", "cash", "RapidoCash（·CO）"],
  ["latam", "cash", "Zala（·CO）"],
  ["latam", "cash", "LanaYa（·CO）"],
  ["latam", "cash", "CréditoLeve（·BR）"],
  ["latam", "cash", "Blipay（·BR）"],
  ["latam", "cash", "meutudo（·BR）"],
  ["latam", "cash", "Jeitto（·BR）"],
  ["latam", "cash", "Crefisa+（·BR）"],
  ["latam", "cash", "ElevaCrédito（·BR）"],
  ["latam", "cash", "ProntoCrédito（·BR）"],
  ["latam", "cash", "Ágil（·BR）"],
  ["latam", "cash", "NoVerde（·BR）"],
  ["latam", "cash", "Bullla（·BR）"],
  ["latam", "cash", "Micro Dinero（·AR）"],
  ["latam", "cash", "Mony24（·AR）"],
  ["latam", "cash", "Flux（·AR）"],
  ["latam", "cash", "CrediToque（·AR）"],
  ["latam", "cash", "Pitage（·AR）"],
  ["latam", "cash", "MatePlata（·AR）"],
  ["latam", "cash", "KooPlata（·AR）"],
  ["latam", "cash", "Moni（·AR）"],
  ["latam", "cash", "Voda（·AR）"],
  ["latam", "cash", "Filo Credito（·AR）"],
  ["latam", "cash", "vana（·PE）"],
  ["latam", "cash", "Yapi Cash（·PE）"],
  ["latam", "cash", "Kashin（·PE）"],
  ["latam", "cash", "Sol Dinero（·PE）"],
  ["latam", "cash", "Doctor Sol（·PE）"],
  ["latam", "cash", "IllariCred（·PE）"],
  ["latam", "cash", "SolPresta（·CL）"],
  ["latam", "cash", "Súper Préstamo（·CL）"],
  ["latam", "cash", "CreditoJusto（·CL）"],
  ["latam", "cash", "ConfiCrédito（·CL）"],
  ["latam", "cash", "Sumak（·EC）"],
  ["latam", "cash", "KillaPay（·EC）"],
  ["latam", "cash", "DineroAlInstante（·EC）"],
  ["latam", "cash", "PlatoVerde（·EC）"],
  ["latam", "cash", "MiDólar（·EC）"],
  ["latam", "cash", "DaleCredi（·EC）"],
  ["mena", "cash", "LoanEgp（·EG）"],
  ["mena", "cash", "Khazna（·EG）"],
  ["mena", "cash", "YallaCash（·EG）"],
  ["mena", "cash", "HelaLoan（·EG）"],
  ["mena", "cash", "Tamweelk（·EG）"],
  ["mena", "cash", "Sanaddak（·EG）"],
  ["mena", "cash", "Lime（·EG）"],
  ["africa", "cash", "EaseMoni（·NG）"],
  ["africa", "cash", "Quickash（·NG）"],
  ["africa", "cash", "Ease Cash（·NG）"],
  ["africa", "cash", "9Credit（·NG）"],
  ["africa", "cash", "AidaCredit（·NG）"],
  ["africa", "cash", "Frimoni（·NG）"],
  ["africa", "cash", "Hypera（·KE）"],
  ["africa", "cash", "ZK Pesa（·KE）"],
  ["africa", "cash", "Koro（·KE）"],
  ["africa", "cash", "Tuma（·KE）"],
  ["africa", "cash", "Linker（·KE）"],
  ["africa", "cash", "AdvancePesa（·KE）"],
  ["africa", "cash", "Fido（·GH）"],
  ["africa", "cash", "Loan Base（·GH）"],
  ["africa", "cash", "Onua（·GH）"],
  ["africa", "cash", "AyaLend（·GH）"],
  ["africa", "cash", "Gh loans（·GH）"],
  ["africa", "cash", "MoniLend（·GH）"],
  ["africa", "cash", "Palm Loan（·GH）"],
  ["africa", "cash", "Paymenow（·ZA）"],
  ["africa", "cash", "PrimeLoans（·ZA）"],
  ["africa", "cash", "Aloan（·ZA）"],
  ["africa", "cash", "CashNow（·ZA）"],
  ["africa", "cash", "AlloCash（·CI）"],
  ["africa", "cash", "CréditVif（·CI）"],
  ["africa", "cash", "Flèche Prêt（·CI）"],
  ["africa", "cash", "Monifi（·CI）"],
  ["africa", "cash", "Dexter（·CI）"],
  ["africa", "cash", "Ivoireloan（·CI）"],
  ["africa", "cash", "Cash Link（·UG）"],
  ["africa", "cash", "Cash Mates（·UG）"],
  ["africa", "cash", "Chaploan（·UG）"],
  ["africa", "cash", "DoveCash（·UG）"],
  ["africa", "cash", "FunaLoan（·UG）"],
  ["africa", "cash", "PesaTuma（·TZ）"],
  ["africa", "cash", "PesaYangu（·TZ）"],
  ["africa", "cash", "Minute Mkopo（·TZ）"],
  ["africa", "cash", "PesaWOW（·TZ）"],
  ["africa", "cash", "Mix Mkopo（·TZ）"],
  ["africa", "cash", "Wamaka（·ZM）"],
  ["africa", "cash", "Sedeas（·ZM）"],
  ["africa", "cash", "Impiya（·ZM）"],
  ["africa", "cash", "FlipmoCredit（·ZM）"],
  ["africa", "cash", "Zedloan（·ZM）"],
  ["africa", "cash", "ZeedLoans（·ZM）"],
  ["central-asia", "cash", "OrdaCredit（·KZ）"],
  ["central-asia", "cash", "Nomad Credit（·KZ）"],
  ["central-asia", "cash", "Cash Bee（·KZ）"],
  ["central-asia", "cash", "EQCredit（·KZ）"],
  ["central-asia", "cash", "Solva（·KZ）"],
  ["central-asia", "cash", "ZaimBee（·KZ）"],
  ["central-asia", "cash", "Vivus（·KZ）"],
  ["central-asia", "cash", "М Булак（·KG）"],
  ["central-asia", "cash", "Элет-Капитал（·KG）"],
  ["central-asia", "cash", "Байлык 24（·KG）"],
  ["central-asia", "cash", "ABN24（·KG）"],
  ["central-asia", "cash", "Байбол（·KG）"],
  ["central-asia", "cash", "ТезФинанс（·KG）"],
  ["central-asia", "cash", "InvesCore（·KG）"],
  ["central-asia", "cash", "Una Moliya（·UZ）"],
  ["central-asia", "cash", "Paystep（·UZ）"],
  ["central-asia", "cash", "Onlayn Mikrokreditlar（·UZ）"],
  ["central-asia", "cash", "WinGo（·UZ）"],
  ["se-asia", "bnpl", "Kredivo（·ID）"],
  ["se-asia", "bnpl", "Indodana（·ID）"],
  ["se-asia", "bnpl", "Honest（·ID）"],
  ["se-asia", "bnpl", "YesssCredit（·ID）"],
  ["se-asia", "bnpl", "Kredivo VN（·）"],
  ["se-asia", "bnpl", "AhaPay（·MY）"],
  ["se-asia", "bnpl", "Lenda Pay（·MY）"],
  ["se-asia", "bnpl", "UFUND（·TH）"],
  ["se-asia", "bnpl", "Kredivo TH（·TH）"],
  ["se-asia", "bnpl", "Billease（·PH）"],
  ["se-asia", "bnpl", "Luvit x Junahand（·PH）"],
  ["se-asia", "bnpl", "Kredivo PH（·PH）"],
  ["south-asia", "bnpl", "0% EMI Shopping App（·IN）"],
  ["south-asia", "bnpl", "eRin Device（·BD）"],
  ["south-asia", "bnpl", "PalmPay PK（·PK）"],
  ["south-asia", "bnpl", "Alif Shop（·PK）"],
  ["south-asia", "bnpl", "BaadMay（·PK）"],
  ["south-asia", "bnpl", "Tabby PK（·PK）"],
  ["south-asia", "bnpl", "Tabby LK（·）"],
  ["latam", "bnpl", "APLAZO（·MX）"],
  ["latam", "bnpl", "Addi Shop（·CO）"],
  ["latam", "bnpl", "Cashea CO（·CO）"],
  ["latam", "bnpl", "Krece CO（·CO）"],
  ["latam", "bnpl", "Quac（·CO）"],
  ["latam", "bnpl", "Koin（·BR）"],
  ["latam", "bnpl", "Pagaleve（·BR）"],
  ["latam", "bnpl", "SuperSim（·BR）"],
  ["latam", "bnpl", "Cartão Pernambucanas（·BR）"],
  ["latam", "bnpl", "Nova（·BR）"],
  ["latam", "bnpl", "Ume（·BR）"],
  ["latam", "bnpl", "PayJoy BR（·BR）"],
  ["latam", "bnpl", "novücard（·BR）"],
  ["latam", "bnpl", "Credicuotas（·AR）"],
  ["latam", "bnpl", "GOcuotas（·AR）"],
  ["latam", "bnpl", "Krece PE（·）"],
  ["latam", "bnpl", "Cashea CL（·CL）"],
  ["latam", "bnpl", "Krece CL（·CL）"],
  ["latam", "bnpl", "CrediTotal（·CL）"],
  ["latam", "bnpl", "EMMA（·EC）"],
  ["latam", "bnpl", "Cashea EC（·EC）"],
  ["mena", "bnpl", "seven（·EG）"],
  ["mena", "bnpl", "mylo（·EG）"],
  ["mena", "bnpl", "Forsa Finance（·EG）"],
  ["mena", "bnpl", "Valu（·EG）"],
  ["mena", "bnpl", "Souhoola（·EG）"],
  ["mena", "bnpl", "Mogo（·EG）"],
  ["mena", "bnpl", "TRU（·EG）"],
  ["mena", "bnpl", "Premium Card（·EG）"],
  ["mena", "bnpl", "Takka（·EG）"],
  ["mena", "bnpl", "Blink（·EG）"],
  ["mena", "bnpl", "Tamara EG（·EG）"],
  ["mena", "bnpl", "Tabby EG（·EG）"],
  ["mena", "bnpl", "Raya Elite（·EG）"],
  ["africa", "bnpl", "TunaCredit（·NG）"],
  ["africa", "bnpl", "SapaClear（·NG）"],
  ["africa", "bnpl", "Easybuy NG（·NG）"],
  ["africa", "bnpl", "PixKudi（·NG）"],
  ["africa", "bnpl", "OnfonMobile（·KE）"],
  ["africa", "bnpl", "PayJustNow（·ZA）"],
  ["africa", "bnpl", "Payflex（·ZA）"],
  ["africa", "bnpl", "Happy Pay（·ZA）"],
  ["africa", "bnpl", "mobicred（·ZA）"],
  ["africa", "bnpl", "Klarna ZA（·ZA）"],
  ["africa", "bnpl", "Easybuy CI（·）"],
  ["africa", "bnpl", "Easybuy TZ（·）"],
  ["africa", "bnpl", "Easy Bills ZM（·）"],
  ["central-asia", "bnpl", "INSAF FINANCE（·KG）"],
  ["central-asia", "bnpl", "Uzum Nasiya（·UZ）"],
  ["central-asia", "bnpl", "Variant nasiya（·UZ）"],
  ["central-asia", "bnpl", "Open Muddatli（·UZ）"],
  ["central-asia", "bnpl", "Rahmat（·UZ）"],
  // end luffy expand
];

const luffyCreditSeeds: CreditSeed[] = luffyCreditSeedTuples.map(([region, line, group]) => ({
  region,
  line,
  group,
}));

const creditCrmSeeds: CreditSeed[] = (() => {
  const base = creditCrmSeedTuples.map(([region, line, group]) => ({
    region,
    line,
    group,
  }));
  const seen = new Set(base.map((s) => s.group));
  const fromOfficial = OFFICIAL_LICENSE_HOLDERS.filter((h) => !seen.has(h.group)).map((h) => ({
    region: h.region,
    line: h.line,
    group: h.group,
  }));
  return [...base, ...fromOfficial];
})();

function expandSceneSeeds(seeds: SceneSeed[]): SceneDraft[] {
  return seeds.map((s) => {
    const hint = `${s.sceneType} ${s.creditAttach}`;
    const subTags = resolveSceneSubTags(s.group, hint);
    const tags = resolveSceneTags(s.group, hint);
    return {
      region: s.region,
      group: s.group,
      tags,
      subTags,
      sceneType: formatSceneTags(tags, subTags),
      apps: s.group,
      countries: REGION_COUNTRY[s.region],
      languages: "待核实",
      mau: "待核实",
      registered: "待核实",
      share: "待核实",
      creditAttach: s.creditAttach,
      diandian: "CRM扩表·点点/路飞位次待补",
      controller: "待核实",
      equity: "待核实",
      licenseReg: "待双端：监管名录未逐条核验",
      trafficRank: "待双端：GP/Apple/点点/路飞待补",
      verify: "待双端" as const,
    };
  });
}

function expandCreditSeeds(seeds: CreditSeed[], source: "crm" | "luffy" = "crm"): CreditDraft[] {
  const licenseByRegionLine: Record<
    Exclude<Region, "all">,
    Record<"cash" | "bnpl" | "lease" | "agent", string>
  > = {
    "east-asia": {
      cash: "中国：地方小贷/助贷/持牌消金（非吸储）",
      bnpl: "中国：小贷/消费信贷合作（非吸储）",
      lease: "中国：融资租赁/租赁经营",
      agent: "中国：导流/助贷/比价（常无自有放贷牌；合作路径见资金方）",
    },
    "se-asia": {
      cash: "按国：ID=OJK LPBBTI/Multifinance；PH=SEC Lending/Financing+OLP；VN=SBV金融公司；MY=BNM非银信贷；TH=BOT P-Loan/Nano",
      bnpl: "按国：ID=Multifinance/BNPL；PH=SEC Financing+OLP；其余本地消费信贷",
      lease: "按国：多金融/设备融资/电信合约机",
      agent: "按国：贷超/比价/导流（路飞「中介」；常无自有放贷牌，PH等或要求OLP/中介登记）",
    },
    "south-asia": {
      cash: "按国：IN=RBI NBFC CoR（非吸储）；PK=SECP Lending NBFC；BD=BB NBFI/MRA；LK=CBSL LFC",
      bnpl: "按国：IN=RBI NBFC/合作银行EMI；其余本地",
      lease: "按国：IN=NBFC车辆/设备；LK=LFC租赁交叉",
      agent: "按国：贷款超市/比价/DSA导流（路飞「中介」；持牌/登记要求因国而异）",
    },
    "central-asia": {
      cash: "按国：KZ/UZ等=MFO微金融/非银放贷牌照（非吸储银行）",
      bnpl: "按国：分期/nasiya类金融公司或银行合作",
      lease: "设备/车辆融资租赁（本地另计）",
      agent: "按国：比价/导流/贷超（路飞「中介」；持牌要求因国而异）",
    },
    latam: {
      cash: "按国：MX=SOFOM/SOFIPO等；BR=SCD/金融公司；其余本地金融公司",
      bnpl: "按国：BNPL/融资公司小牌照",
      lease: "设备租赁/lease-to-own/电信合约",
      agent: "按国：比价/导流/贷超（路飞「中介」；持牌要求因国而异）",
    },
    mena: {
      cash: "按国：EG/MA等非银放贷；GCC=SAMA/CBUAE等金融公司（非吸储银行主叙事）",
      bnpl: "按国：SAMA/CBUAE等金融公司/BNPL牌照；埃及消费分期公司",
      lease: "设备分期/汽车金融（本地另计）",
      agent: "按国：比价/导流/贷超（路飞「中介」；持牌要求因国而异）",
    },
    africa: {
      cash: "按国：微金融/数字信贷/非银放贷牌照（非央行吸储银行）",
      bnpl: "按国：BNPL/消费信贷或移动货币信贷合作",
      lease: "PAYG资产融资/设备分期/太阳能与手机融资",
      agent: "按国：比价/导流/贷超（路飞「中介」；持牌要求因国而异）",
    },
    west: {
      cash: "按国：州放贷牌照/消费信贷牌照/银行合作（非全能银行叙事）",
      bnpl: "按国：BNPL/消费信贷牌照或银行合作",
      lease: "rent-to-own/融资租赁/车队租赁",
      agent: "按国：贷款比价/broker（常非自营放贷；个别州要求经纪登记）",
    },
  };

  return seeds.map((s) => {
    const fromLuffy = source === "luffy" || s.group.includes("路飞");
    const official = OFFICIAL_LICENSE_BY_GROUP[s.group];
    const fromOjk = !official && (s.group.includes("·ID）") || s.group.includes("OJK"));
    return {
      region: s.region,
      line: s.line,
      tier: "腰部" as const,
      group: s.group,
      brands: official?.legalName ?? s.group,
      countries: REGION_COUNTRY[s.region],
      languages: "待核实",
      licenses: official
        ? official.source === "pdicDigibank"
          ? "PH：BSP数字银行（PDIC投保目录交叉）"
          : `中国：${official.licenseKindLabel}（金管总局法人名单）`
        : licenseByRegionLine[s.region][s.line],
      timing: "待核实",
      regulators: official
        ? official.source === "pdicDigibank"
          ? "BSP / PDIC"
          : "金管总局/属地金融监管局"
        : "待核实",
      traffic: s.line === "agent" ? "贷超/比价/导流获客" : "投放/App/门店",
      volume: "待核实",
      users: "待核实",
      diandian: fromLuffy
        ? "路飞海外风控笔记·GP财务免费榜借款类快照（2026-08-01前后）"
        : official
          ? REGULATORY_DIRECTORY_SOURCES[official.source]
          : fromOjk
            ? "OJK LPBBTI 官网名录交叉建档（2025公开名单）"
            : "点点位次待补；优先以监管官网持牌名单交叉",
      note: s.line === "agent"
        ? "生态角色·流量（中介/比价/贷超）：非下场放贷玩家；偏撮合/导流"
        : fromLuffy
          ? "路飞流量端已检出；监管名录交叉填齐中（无数量上限）"
          : official
            ? `来源：${REGULATORY_DIRECTORY_SOURCES[official.source]}；法定名 ${official.legalName}`
            : fromOjk
              ? "来源：OJK LPBBTI 持牌名录；法定公司名见 brands/group"
              : "CRM扩表；须完成流量榜×监管名录双端校验",
      controller: official?.controller ?? "待核实",
      equity: "待核实",
      licenseReg: fromLuffy
        ? `待核监管名录（区域口径：${licenseByRegionLine[s.region][s.line]}）`
        : official
          ? formatOfficialLicenseReg(official)
          : fromOjk
            ? "ID：OJK LPBBTI 持牌（官网名录交叉）"
            : "待核：持牌实体法定名/登记号/名录条目",
      trafficRank: fromLuffy
        ? "路飞·GP财务免费榜借款类（第三方；非官方商店API）"
        : official
          ? `监管源·${official.licenseKindLabel}`
          : fromOjk
            ? "监管源·OJK LPBBTI 名录"
            : "待核：GP/Apple/FB/点点位次",
      verify: fromLuffy
        ? ("仅流量" as const)
        : official || fromOjk
          ? ("仅监管" as const)
          : ("待双端" as const),
    };
  });
}

/** 按集团名补丁：实控人 / 股权 / 牌照登记 / 流量排名 / 校验态（覆盖默认） */
const SCENE_KYC: Record<
  string,
  Partial<Pick<SceneRow, "controller" | "equity" | "licenseReg" | "trafficRank" | "verify">>
> = {
  "蚂蚁集团/支付宝（蚂蚁·CN）": {
    controller: "蚂蚁集团（软银/阿里等历史股东结构；上市进程以最新公告为准）",
    equity: "蚂蚁集团主主体；支付宝为中国支付品牌",
    licenseReg: "中国：非银行支付机构等（央行支付牌照体系）+ 关联小贷/消金合作",
    trafficRank: "CN：国内应用商店金融/支付头部；非点点出海借贷榜主口径",
    verify: "仅监管",
  },
  "腾讯控股/微信（腾讯·CN）": {
    controller: "腾讯控股（0700.HK）",
    equity: "港交所上市公司腾讯控股",
    licenseReg: "财付通等支付牌照；信贷多为银行/持牌机构分发",
    trafficRank: "CN：社交/支付头部；非点点出海借贷榜",
    verify: "仅监管",
  },
  "美团（美团·CN）": {
    controller: "美团（王兴等）",
    equity: "HKEX: 3690.HK",
    licenseReg:
      "已持：支付(中国)·小贷(中国)·保险经纪(中国)·基金代销(中国)·征信(中国)；申请中：消费金融(中国)",
    trafficRank: "CN超级平台｜外卖● 到店● 酒旅● 打车○ 买菜○",
    verify: "双端通过",
  },
  "京东集团/京东（京东·CN）": {
    controller: "京东集团",
    equity: "NASDAQ: JD / HKEX: 9618.HK",
    licenseReg: "京东科技/支付/消金合作路径",
    trafficRank: "CN电商头部",
    verify: "仅监管",
  },
  "滴滴出行/滴滴（滴滴·CN）": {
    controller: "滴滴出行",
    equity: "私营（历史上市路径已退市叙事）",
    licenseReg: "支付/小贷合作；出行场景信贷",
    trafficRank: "CN出行头部",
    verify: "仅监管",
  },
  "Sea Limited/Shopee（Sea·SEA）": {
    controller: "Sea Limited（创始人Forrest Li等）",
    equity: "NYSE: SE",
    licenseReg:
      "已持：支付：SeaMoney·MPI·新 | ShopeePay·PJP·印 | SeaMoney·PSP·泰 | SeaMoney·PSP(pilot)·越 | SeaMoney·eMoney·马；信贷：SeaMoney·Moneylender·新 | SeaMoney·Financing·马；数字银行：SeaBank·PDKB·印；申请中：数字银行(新加坡)·保险经纪(印尼)",
    trafficRank: "新加坡综合平台｜电商● 外卖● 游戏● 支付○",
    verify: "双端通过",
  },
  "Grab Holdings/Grab（Grab·SEA）": {
    controller: "Grab Holdings",
    equity: "NASDAQ: GRAB",
    licenseReg:
      "已持：支付(新加坡·印尼·马来·菲律宾·越南·泰国)·借贷(新加坡·马来·印尼)·保险经纪(新加坡)；申请中：数字银行(新加坡·马来)·证券(印尼)",
    trafficRank: "新加坡超级平台｜出行● 外卖● 支付● 信用○｜墨腾外卖份额约55%",
    verify: "双端通过",
  },
  "GoTo/Gojek（GoTo·ID）": {
    controller: "GoTo Group",
    equity: "IDX: GOTO.JK",
    licenseReg:
      "已持：支付(印尼)·借贷(印尼)·保险经纪(印尼)；申请中：数字银行(印尼)·证券(印尼)",
    trafficRank: "印尼综合平台｜出行● 外卖● 支付○｜墨腾：ShopeeFood印尼单量追平叙事",
    verify: "双端通过",
  },
  "Delivery Hero/Foodpanda（Foodpanda·SEA）": {
    controller: "Delivery Hero",
    equity: "FRA: DHER（德国；东南亚运营）",
    licenseReg: "牌照：—（金融牌照未单列；垂直外卖）",
    trafficRank: "德国总部·东南亚垂直平台｜外卖●｜墨腾：区域位次落后ShopeeFood；已退出泰国",
    verify: "仅流量",
  },
  "Xanh SM（Xanh SM·VN）": {
    controller: "Vingroup关联/范日旺生态（公开叙事）",
    equity: "私营",
    licenseReg: "牌照：—；申请中：—",
    trafficRank: "越南垂直平台｜出行● 外卖○",
    verify: "待双端",
  },
  "Lazada/Lazada（Lazada·SEA）": {
    controller: "Lazada（阿里巴巴东南亚历史控股叙事）",
    equity: "Alibaba关联",
    licenseReg: "各国支付/消费信贷合作",
    trafficRank: "SEA电商",
    verify: "仅监管",
  },
  "ByteDance/TikTok（字节·SEA）": {
    controller: "字节跳动 / ByteDance",
    equity: "私营；TikTok为海外品牌（与抖音分端）",
    licenseReg: "各国：TikTok Shop PayLater多与持牌机构合作嵌入",
    trafficRank: "全球短视频头部；SEA直播电商上升快",
    verify: "仅监管",
  },
  "广州华人/Badam Live（巴旦木·CN）": {
    controller: "广州华人科技（Badam/巴旦木直播）",
    equity: "私营",
    licenseReg: "直播娱乐为主；信贷牌照/合作待核实",
    trafficRank: "CN区域直播（维语/新疆向内容）",
    verify: "待双端",
  },
  "赤子城科技/MICO（赤子城·MENA）": {
    controller: "赤子城科技（09911.HK）",
    equity: "HKEX: 09911.HK",
    licenseReg: "海外社交直播/虚拟物品；信贷合作待核实",
    trafficRank: "MEA等：MICO/YoHo/SUGO等出海社交直播矩阵",
    verify: "待双端",
  },
  "GCash（·SEA）": {
    controller: "Globe Fintech Innovations / Mynt（GCash）",
    equity: "Globe/Ayala/Ant等历史股东叙事",
    licenseReg: "已持：支付(菲律宾)·放贷(菲律宾)；EMI/电子货币+借贷臂",
    trafficRank: "PH 超级钱包头部；GLoan派生",
    verify: "双端通过",
  },
  "Maya（·SEA）": {
    controller: "Maya Bank / Voyager Innovations；数字银行法人另列 MayaBank·PH",
    equity: "菲律宾数字银行路径（以BSP/PDIC披露为准）",
    licenseReg: "已持：数字银行(菲律宾)·支付(菲律宾)；法人 Maya Bank, Inc. 见 PDIC 投保数字银行目录",
    trafficRank: "PH 钱包+数字银行；Maya Credit派生",
    verify: "双端通过",
  },
  "Akulaku/Akulaku（阿卡拉克·SEA）": {
    controller: "Akulaku Group",
    equity: "私募；ID=BNC；PH=OwnBank农村银行；TH=Akulaku X（BOT非银个人贷/Nano，非Virtual Bank）",
    licenseReg:
      "已持：支付(印尼)·P2P(印尼)·多金融(印尼)·银行(印尼·BNC)·银行(菲律宾·OwnBank)·P-Loan/Nano(泰国·Akulaku X)",
    trafficRank: "SEA BNPL/信贷场景头部；菲OwnBank（农村银行牌照，非BSP Digital Bank六席）",
    verify: "仅监管",
  },
  "PhonePe/PhonePe（PhonePe·IN）": {
    controller: "PhonePe（Walmart/Flipkart历史关联）",
    equity: "印度私营支付巨头",
    licenseReg: "印度：支付/PPINBI等；信贷多为NBFC/银行合作",
    trafficRank:
      "IN UPI头部；Sensor Tower IN Finance Top Free 2024-07-30 快照中未落入可见#3–6（更可能居#1–2，待补完整榜）",
    verify: "双端通过",
  },
  "One97/Paytm（Paytm·IN）": {
    controller: "One97 / Paytm",
    equity: "NSE/BSE: PAYTM",
    licenseReg: "印度：支付银行/支付牌照路径（监管变迁以RBI为准）",
    trafficRank: "Sensor Tower·IN Finance Top Free #4（2024-07-30，Android）；点点/商店支付榜另计",
    verify: "双端通过",
  },
  "Google Pay India（Google Pay·IN）": {
    controller: "Google LLC",
    equity: "Alphabet/Google",
    licenseReg: "印度：UPI支付；信贷多为合作导流",
    trafficRank: "Sensor Tower·IN Finance Top Free #5（2024-07-30，Android）",
    verify: "双端通过",
  },
  "Airtel Thanks（·IN）": {
    controller: "Bharti Airtel",
    equity: "NSE: BHARTIARTL",
    licenseReg: "印度：电信+Payments Bank/信贷入口",
    trafficRank:
      "Sensor Tower·IN Finance Top Free #3（2024-07-30，Android；App=Airtel Recharge/Bank & Loans）",
    verify: "双端通过",
  },
  "YONO SBI（·IN）": {
    controller: "State Bank of India",
    equity: "NSE: SBIN",
    licenseReg: "印度：商业银行大牌照（SBI）",
    trafficRank: "Sensor Tower·IN Finance Top Free #6（2024-07-30，Android）",
    verify: "双端通过",
  },
  "Flipkart/Flipkart（Flipkart·IN）": {
    controller: "Flipkart（Walmart）",
    equity: "Walmart控股",
    licenseReg: "电商+消费信贷合作（非自营银行叙事）",
    trafficRank: "IN电商头部",
    verify: "仅监管",
  },
  "Uber（Uber·LATAM）": {
    controller: "Uber Technologies",
    equity: "NYSE: UBER",
    licenseReg: "出行平台；金融多为合作/Uber Money路径，按国另计",
    trafficRank: "拉美出行/外卖：商店生活服务榜另计",
    verify: "待双端",
  },
  "iFood（iFood·BR）": {
    controller: "iFood / Prosus关联",
    equity: "Prosus/移动互联网集团关联",
    licenseReg: "巴西外卖平台；信贷多为合作派生",
    trafficRank: "BR外卖头部：生活服务榜另计",
    verify: "待双端",
  },
  "Kaspi.kz（Kaspi·KZ）": {
    controller: "Kaspi.kz",
    equity: "LSE/AIX上市 Kaspi.kz",
    licenseReg: "哈萨克斯坦银行/支付与电商一体超级App",
    trafficRank: "KZ超级App头部",
    verify: "仅监管",
  },
  "DiDi/99（滴滴·LATAM）": {
    controller: "滴滴国际 / 99（巴西）",
    equity: "NYSE: DIDIY.US（中国控股·拉美运营）",
    licenseReg:
      "已持：支付(巴西·墨西哥)·信贷(巴西)；申请中：支付(智利·哥伦比亚)",
    trafficRank: "中国控股·拉美综合平台｜出行● 外卖● 支付○",
    verify: "双端通过",
  },
  "Mercado Libre/Mercado Libre（美卡多·LATAM）": {
    controller: "Mercado Libre",
    equity: "NASDAQ: MELI",
    licenseReg: "Mercado Pago支付+信贷臂；各国牌照分主体",
    trafficRank: "LatAm电商/支付头部",
    verify: "仅监管",
  },
  "Rappi/Rappi（Rappi·LATAM）": {
    controller: "Rappi",
    equity: "哥伦比亚·拉美私募",
    licenseReg:
      "已持：支付(哥伦比亚·墨西哥·巴西·智利·秘鲁)·信贷(哥伦比亚·墨西哥)；申请中：数字银行(墨西哥)·证券(巴西)",
    trafficRank: "哥伦比亚垂直/超级App向｜外卖● 支付●",
    verify: "双端通过",
  },
  "饿了么（饿了么·CN）": {
    controller: "阿里巴巴本地生活 / 饿了么",
    equity: "阿里巴巴集团关联",
    licenseReg: "牌照：—（支付/信贷由支付宝/蚂蚁集团提供）",
    trafficRank: "中国垂直平台｜外卖●",
    verify: "仅监管",
  },
  "Safaricom/M-Pesa（M-Pesa·KE）": {
    controller: "Safaricom / Vodafone关联叙事",
    equity: "Safaricom上市关联",
    licenseReg: "肯尼亚等：电子货币/移动货币牌照；信贷多为合作",
    trafficRank: "东非移动货币头部",
    verify: "仅监管",
  },
  "OPay/OPay（OPay·NG）": {
    controller: "Opera/OPay体系叙事",
    equity: "私募支付",
    licenseReg: "尼日利亚等：支付牌照；信贷合作",
    trafficRank: "NG支付头部",
    verify: "仅监管",
  },
  "Amazon/Amazon（亚马逊·US）": {
    controller: "Amazon.com, Inc.",
    equity: "NASDAQ: AMZN",
    licenseReg: "各国支付/消费信贷合作（对照）",
    trafficRank: "全球电商对照",
    verify: "仅监管",
  },
  "Block/Cash App（Block·US）": {
    controller: "Block, Inc.",
    equity: "NYSE: XYZ",
    licenseReg: "美国：货币服务/银行合作；Afterpay另列",
    trafficRank: "US支付对照",
    verify: "仅监管",
  },
};

const CREDIT_KYC: Record<
  string,
  Partial<Pick<CreditRow, "controller" | "equity" | "licenseReg" | "trafficRank" | "verify" | "note">>
> = {
  "奇富科技/奇富借条/Qfin（奇富·CN）": {
    controller: "奇富科技（原360数科路径；公开披露以年报/招股为准）",
    equity: "NASDAQ: QFIN",
    licenseReg: "中国：助贷撮合+银行/消金资金方；非吸储",
    trafficRank: "CN助贷App国内商店；出海见KrediOne行",
    verify: "仅监管",
  },
  "FinVolution/信也（信也·CN）": {
    controller: "季恒等（FinVolution Group）",
    equity: "NYSE: FINV",
    licenseReg: "已持：助贷(中国)·P2P(印尼)·放贷(菲律宾)；出海分主体另计",
    trafficRank: "点点：AdaKami印尼现金贷头部梯队；JuanHand菲榜常见",
    verify: "双端通过",
    note: "上市代码 FINV.N；国内与出海分主体，列表按（信也·国别）去重",
  },
  "Fintopia/瓴岳/洋钱罐（洋钱罐·CN）": {
    controller: "洋钱罐/瓴岳科技体系（Fintopia）",
    equity: "非上市集团口径；品牌Easycash/Credmex等",
    licenseReg: "已持：P2P(印尼)·SOFOM(墨西哥)；Easycash/Credmex分主体",
    trafficRank: "点点Dec’25：Easycash印尼借贷下载约#2；MX Credmex活跃前排",
    verify: "双端通过",
  },
  "乐信/分期乐/Lexin（乐信·CN）": {
    controller: "乐信集团",
    equity: "NASDAQ: LX",
    licenseReg: "中国消金/助贷合作；MX：Fortaprest等",
    trafficRank: "点点MX常见对标；国内另计",
    verify: "仅流量",
  },
  "中关村科金｜马上｜中科金（中科金·CN）": {
    controller: "北京中关村科金技术有限公司（中科金）；马上消费为境内持牌消金主体，不作玩家主名",
    licenseReg: "CN：马上消费金融（银保监消金牌照）写入本字段，非 group 名",
    trafficRank: "国内马上App；出海见中科金·MX",
    verify: "仅监管",
    note: "玩家=发起方/科技集团中科金，非持牌主体马上消费",
  },
  "中关村科金｜待核｜中科金（中科金·MX）": {
    controller: "中科金出海墨（与境内马上消金主体区分）",
    licenseReg: "MX：本地金融公司/SOFOM等路径待核登记号；APP名待双端回填",
    trafficRank: "MX商店榜待核",
    verify: "待双端",
    note: "中科金类科技集团可横向境外；招行/邮储/中原银行等境内发起方不按此叙事",
  },
  "招商银行+中国联通｜招联｜招联（招联·CN）": {
    controller: "发起方：招商银行 + 中国联通；招联消费金融为持牌主体",
    licenseReg: "CN：招联消费金融（消金牌照）",
    verify: "仅监管",
    note: "母公司为境内银行/央企体系，不按横向境外展业收录",
  },
  "中原银行｜中原消费｜中原银行（中原·CN）": {
    controller: "发起方：中原银行；中原消费金融为持牌主体",
    licenseReg: "CN：中原消费金融（消金牌照）",
    verify: "仅监管",
    note: "母公司为境内银行，不按横向境外展业收录",
  },
  "中国邮政｜中邮消费｜中国邮政（中邮·CN）": {
    controller: "发起方：中国邮政体系；中邮消费金融为持牌主体",
    licenseReg: "CN：中邮消费金融（消金牌照）",
    verify: "仅监管",
    note: "母公司为境内央企/邮政体系，不按横向境外展业收录",
  },
  "数禾｜还呗｜数禾（数禾·CN）": {
    controller: "上海数禾科技（数禾）；还呗为APP名，不作单独玩家主名",
    licenseReg: "CN：助贷/小贷等合作路径待核",
    trafficRank: "还呗App国内商店",
    verify: "仅流量",
    note: "命名：运营公司｜APP｜集团俗称",
  },
  "度小满｜有钱花｜百度（度小满·CN）": {
    controller: "度小满（百度旗下当地公司/金融科技主体）；有钱花为APP/产品名",
    licenseReg: "CN：小贷/助贷/银行合作等路径（以披露为准）",
    trafficRank: "有钱花/度小满App国内商店",
    verify: "仅流量",
    note: "当地公司名=度小满，集团=百度；不以百度直接当信贷玩家名",
  },
  "Xinfei Digital/KrediOne（奇富·ID）": {
    controller: "股权链常见表述：Xinfei Digital↔奇富QFIN（点点写作「信飞科技」；≠国内信用飞品牌）",
    equity: "Xinfei Digital持股约85%等公开叙事（以当地披露为准）",
    licenseReg: "印尼：OJK相关放贷/多金融路径（以OJK名录最新为准）",
    trafficRank: "点点2025-09下载#2~85.1万；2025H2走弱",
    verify: "冲突观察",
    note: "点点「信飞」=Xinfei音译；与国内「信用飞」勿合并",
  },
  "Surfin Meta/Surfin（Surfin·SG）": {
    controller: "吴亚南（Yanan Wu）；Surfin Meta Digital Technology Pte. Ltd.",
    equity: "新加坡主体；2025公开融资约累计USD26.5M（Insignia/Woori等）",
    licenseReg: "多国分主体；印尼等含P2P/基金分销等（逐国OJK等名录待回填登记号）",
    trafficRank: "多国运营；点点/路飞国榜位次待逐国回填（含IN）",
    verify: "仅监管",
  },
  "Adapundi/印闪（印闪·ID）": {
    controller: "印闪科技体系（点点公开写作）",
    equity: "待核实详细股东",
    licenseReg: "已持：P2P(印尼)；OJK LPBBTI",
    trafficRank: "点点2025-12借贷下载#3~66.4万",
    verify: "双端通过",
  },
  "AdaKami": {
    controller: "FinVolution（信也）出海",
    equity: "FinVolution Group",
    licenseReg: "已持：P2P(印尼)；OJK LPBBTI",
    trafficRank: "点点印尼现金贷头部梯队",
    verify: "双端通过",
  },
  "Kredivo/FinAccel（Kredivo·ID）": {
    controller: "Kredivo / FinAccel",
    equity: "FinAccel（私募）",
    licenseReg: "印尼：Multifinance/BNPL相关；多国分主体",
    trafficRank: "点点Dec借贷下载常列#1；路飞ID榜BNPL头部",
    verify: "双端通过",
  },
  "KreditBee（KreditBee·IN）": {
    controller: "Finnovation Tech Solutions（KreditBee）",
    equity: "印度私募/机构股东（以MCA披露为准）",
    licenseReg: "印度：RBI NBFC CoR路径（以RBI名录最新条目为准；登记号待回填）",
    trafficRank: "路飞IN借款Top：KreditBee财务榜常见前十",
    verify: "仅流量",
  },
  "嘉银科技/嘉银/Jiayin（嘉银·CN）": {
    controller: "嘉银科技",
    equity: "NASDAQ: JFIN",
    licenseReg: "中国助贷撮合；出海分主体待核当地名录",
    trafficRank: "国内商店；出海点点位次待补",
    verify: "仅监管",
  },
  "信飞科技/信用飞（信用飞·CN）": {
    controller: "国内「信用飞」品牌主体（勿与点点「信飞」=Xinfei/KrediOne混淆）",
    equity: "待核实上市/股东",
    licenseReg: "中国：助贷/小贷合作路径（非吸储）",
    trafficRank: "国内；与KrediOne分行",
    verify: "仅监管",
  },
  "Finplus（·ID）": {
    controller: "待核实（点点印尼MAU常列）",
    equity: "待核实",
    licenseReg: "印尼：OJK相关路径待核登记号",
    trafficRank: "点点2025-09 MAU约162万",
    verify: "仅流量",
  },
  "Cairin（·ID）": {
    controller: "待核实",
    equity: "待核实",
    licenseReg: "印尼：OJK LPBBTI/多金融待核",
    trafficRank: "点点印尼借贷榜常见",
    verify: "仅流量",
  },
  "PinjamDuit（·ID）": {
    controller: "待核实",
    equity: "待核实",
    licenseReg: "印尼：OJK待核登记号",
    trafficRank: "点点印尼榜常见",
    verify: "仅流量",
  },
  "Bussan Auto Finance/BAF Mobile（BAF·ID）": {
    controller: "Bussan Auto Finance（三菱系多金融叙事）",
    equity: "日系多金融/汽车金融背景",
    licenseReg: "印尼：OJK Multifinance",
    trafficRank: "点点2025-09唯一五星提及",
    verify: "双端通过",
  },
  "Ammana（·ID）": {
    controller: "待核实（伊斯兰金融叙事）",
    equity: "待核实",
    licenseReg: "印尼：OJK P2P/多金融待核",
    trafficRank: "点点印尼榜常见",
    verify: "仅流量",
  },
  "AsetKu/Akulaku（阿卡拉克·ID）": {
    controller: "Akulaku/AsetKu体系",
    equity: "Akulaku集团关联",
    licenseReg: "已持：P2P(印尼)；OJK LPBBTI",
    trafficRank: "点点印尼P2P/借贷交叉常见",
    verify: "仅监管",
  },
  "Rupiah Cepat（·ID）": {
    controller: "待核实",
    equity: "待核实",
    licenseReg: "印尼：OJK待核",
    trafficRank: "点点印尼榜常见",
    verify: "仅流量",
  },
  "UangMe（·ID）": {
    controller: "待核实",
    equity: "待核实",
    licenseReg: "印尼：OJK待核",
    trafficRank: "点点印尼榜常见",
    verify: "仅流量",
  },
  "Bank Neo Commerce/Neo Pinjam（BNC·ID）": {
    controller: "Bank Neo Commerce / Akulaku银行臂叙事",
    equity: "BNC上市公司路径（以IDX披露为准）",
    licenseReg: "已持：银行(印尼)",
    trafficRank: "点点/银行App交叉",
    verify: "仅监管",
  },
  "维信金科/Vcredit（维信·CN）": {
    controller: "维信金科",
    equity: "HKEX: 2003.HK",
    licenseReg: "中国助贷；出海分主体待核",
    trafficRank: "国内为主；出海点点待补",
    verify: "仅监管",
  },
  "Danaku/TrustIQ（·ID）": {
    controller: "TrustIQ/Danaku体系（待核UBO）",
    equity: "待核实",
    licenseReg: "印尼：OJK待核",
    trafficRank: "点点印尼现金贷常见",
    verify: "仅流量",
  },
  "JuanHand/FinVolution（信也·PH）": {
    controller: "FinVolution（信也）菲主体",
    equity: "FinVolution Group",
    licenseReg: "已持：放贷(菲律宾)；SEC Lending/Financing + OLP",
    trafficRank: "点点/路飞PH榜常见",
    verify: "双端通过",
  },
  "MabilisCash（·PH）": {
    controller: "待核实",
    equity: "待核实",
    licenseReg: "菲律宾：SEC OLP待核登记",
    trafficRank: "点点PH榜常见",
    verify: "仅流量",
  },
  "FTLending（·PH）": {
    controller: "待核实",
    equity: "待核实",
    licenseReg: "菲律宾：SEC待核",
    trafficRank: "点点PH榜常见",
    verify: "仅流量",
  },
  "Mr.cash（·PH）": {
    controller: "待核实",
    equity: "待核实",
    licenseReg: "菲律宾：SEC待核",
    trafficRank: "点点PH榜常见",
    verify: "仅流量",
  },
  "Paisayaar/JingleCred（·PK）": {
    controller: "JingleCred/Paisayaar体系",
    equity: "待核实",
    licenseReg: "印度：RBI NBFC路径待核CoR",
    trafficRank: "路飞IN榜常见",
    verify: "仅流量",
  },
  "JazzCash/JazzCash Lending（JazzCash·PK）": {
    controller: "Jazz/Veon体系支付臂信贷",
    equity: "Veon/Jazz关联",
    licenseReg: "巴基斯坦：SECP Lending NBFC等路径待核",
    trafficRank: "路飞PK支付/借贷交叉",
    verify: "仅流量",
  },
  "Aitemaad/4Sight（·PK）": {
    controller: "4Sight/Aitemaad",
    equity: "待核实",
    licenseReg: "巴基斯坦：SECP待核",
    trafficRank: "路飞PK榜",
    verify: "仅流量",
  },
  "Fauri Cash/Pakisnova（·PK）": {
    controller: "Pakisnova",
    equity: "待核实",
    licenseReg: "巴基斯坦：SECP待核",
    trafficRank: "路飞PK榜",
    verify: "仅流量",
  },
  "PakCredit/VisionCred（·PK）": {
    controller: "VisionCred",
    equity: "待核实",
    licenseReg: "巴基斯坦：SECP待核",
    trafficRank: "路飞PK榜",
    verify: "仅流量",
  },
  "IDLC Finance（·BD）": {
    controller: "IDLC",
    equity: "孟加拉上市金融公司口径",
    licenseReg: "孟加拉：BB NBFI",
    trafficRank: "本地非点点出海主榜",
    verify: "仅监管",
  },
  "IPDC Finance（·BD）": {
    controller: "IPDC",
    equity: "孟加拉金融公司",
    licenseReg: "孟加拉：BB NBFI",
    trafficRank: "本地",
    verify: "仅监管",
  },
  "LankaBangla Finance（·BD）": {
    controller: "LankaBangla",
    equity: "孟加拉金融公司",
    licenseReg: "孟加拉：BB NBFI",
    trafficRank: "本地",
    verify: "仅监管",
  },
  "LOLC Finance（·LK）": {
    controller: "LOLC集团",
    equity: "斯里兰卡上市金融集团",
    licenseReg: "斯里兰卡：CBSL LFC（部分可吸储，需单列）",
    trafficRank: "本地",
    verify: "仅监管",
  },
  "LB Finance（·LK）": {
    controller: "LB Finance",
    equity: "斯里兰卡LFC",
    licenseReg: "斯里兰卡：CBSL LFC",
    trafficRank: "本地",
    verify: "仅监管",
  },
  "Commercial Credit & Finance（·LK）": {
    controller: "Commercial Credit",
    equity: "斯里兰卡",
    licenseReg: "斯里兰卡：CBSL LFC",
    trafficRank: "本地",
    verify: "仅监管",
  },
  "Cashalo/Paloo（·PH）": {
    controller: "Paloo/Cashalo体系",
    equity: "待核实",
    licenseReg: "菲律宾：SEC Lending/OLP待核",
    trafficRank: "路飞PH/历史榜",
    verify: "仅流量",
  },
  "Digido（·PH）": {
    controller: "待核实",
    equity: "待核实",
    licenseReg: "菲律宾：SEC待核",
    trafficRank: "路飞PH榜",
    verify: "仅流量",
  },
  "FE Credit（FE·VN）": {
    controller: "FE Credit（VPBank历史关联叙事）",
    equity: "越南消费金融；股权以最新披露为准",
    licenseReg: "越南：SBV金融公司",
    trafficRank: "VN消费金融头部；路飞VN榜",
    verify: "仅监管",
  },
  "Home Credit Vietnam（Home Credit·VN）": {
    controller: "Home Credit Group",
    equity: "PPF/Home Credit国际",
    licenseReg: "越南：SBV金融公司",
    trafficRank: "VN消费金融头部",
    verify: "仅监管",
  },
  "Shinhan Finance（新韩·VN）": {
    controller: "新韩金融集团",
    equity: "韩资",
    licenseReg: "越南：SBV金融公司",
    trafficRank: "本地",
    verify: "仅监管",
  },
  "AEON Credit Service/AEON Credit（AEON·MY）": {
    controller: "AEON Credit Service",
    equity: "日资AEON金融",
    licenseReg: "马来西亚：BNM非银信贷",
    trafficRank: "MY本地",
    verify: "仅监管",
  },
  "Easy Buy（Easy Buy·TH）": {
    controller: "Easy Buy（ACS/日资消费金融叙事）",
    equity: "日资消费金融",
    licenseReg: "泰国：BOT相关消费信贷",
    trafficRank: "TH本地",
    verify: "仅监管",
  },
  "Ascend Nano/Ascend（Ascend·TH）": {
    controller: "Ascend Group / True体系叙事",
    equity: "泰国Ascend",
    licenseReg: "泰国：BOT Nano Finance",
    trafficRank: "TH Nano常见",
    verify: "仅监管",
  },
  "Upstart（Upstart·US）": {
    controller: "Upstart Network",
    equity: "NASDAQ: UPST",
    licenseReg: "美国：银行合作/州放贷路径（非全能银行）",
    trafficRank: "US对照；非点点出海借贷榜",
    verify: "仅监管",
  },
  "DiDi Finanzas/DiDi（滴滴·MX）": {
    controller: "滴滴出行信贷臂（墨西哥）",
    equity: "DiDi全球关联",
    licenseReg: "墨西哥：SOFOM等路径待核登记号",
    trafficRank: "点点/MX场景衍生信贷",
    verify: "仅流量",
  },
  "Tala（Tala·MX）": {
    controller: "Tala",
    equity: "美国总部私募",
    licenseReg: "墨西哥：本地放贷主体待核",
    trafficRank: "路飞MX现金贷榜常见",
    verify: "仅流量",
  },
  "Fortaprest/Lexin（乐信·MX）": {
    controller: "乐信Lexin出海",
    equity: "NASDAQ: LX 关联",
    licenseReg: "墨西哥：SOFOM等待核",
    trafficRank: "点点MX榜常见",
    verify: "仅流量",
  },
  "Starpresta（·MX）": {
    controller: "待核实",
    equity: "待核实",
    licenseReg: "墨西哥：待核CNBV/CONDUSEF相关名录",
    trafficRank: "点点MX榜常见",
    verify: "仅流量",
  },
  "Finanzas Ágiles/FinVolution（信也·MX）": {
    controller: "FinVolution（信也）墨主体",
    equity: "FinVolution Group",
    licenseReg: "墨西哥：本地金融公司待核登记号",
    trafficRank: "点点MX榜",
    verify: "仅流量",
  },
  "Baubap（·MX）": {
    controller: "Baubap",
    equity: "墨西哥私募",
    licenseReg: "墨西哥：SOFOM等待核",
    trafficRank: "点点MX榜",
    verify: "仅流量",
  },
  "PopPréstamo（·MX）": {
    controller: "待核实",
    equity: "待核实",
    licenseReg: "墨西哥：待核",
    trafficRank: "点点/路飞MX",
    verify: "仅流量",
  },
  "Nubank（Nubank·BR）": {
    controller: "Nubank",
    equity: "NYSE: NU",
    licenseReg: "巴西：数字银行大牌照臂+信用卡/借贷",
    trafficRank: "BR超级App；路飞BR榜交叉",
    verify: "仅监管",
  },
  "Atome（Atome·SEA）": {
    controller: "Atome / Advance.ai 关联叙事",
    equity: "私募",
    licenseReg: "多国BNPL分主体（SEA）",
    trafficRank: "SEA BNPL商店榜常见",
    verify: "仅流量",
  },
  "Tabby（Tabby·GCC）": {
    controller: "Tabby",
    equity: "中东BNPL私募",
    licenseReg: "沙特等：SAMA BNPL/金融公司路径",
    trafficRank: "MEA BNPL头部",
    verify: "仅监管",
  },
  "Tamara（Tamara·GCC）": {
    controller: "Tamara",
    equity: "中东BNPL私募",
    licenseReg: "沙特等：SAMA相关",
    trafficRank: "MEA BNPL头部",
    verify: "仅监管",
  },
  "Addi（Addi·CO）": {
    controller: "Addi",
    equity: "哥伦比亚BNPL私募",
    licenseReg: "哥伦比亚：本地信贷/BNPL主体待核",
    trafficRank: "路飞CO榜BNPL",
    verify: "仅流量",
  },
  "Klarna（Klarna·EU）": {
    controller: "Klarna Bank AB",
    equity: "瑞典BNPL/银行；私募为主",
    licenseReg: "欧盟银行/消费信贷牌照路径",
    trafficRank: "欧美对照；非点点出海主榜",
    verify: "仅监管",
  },
  "Affirm（Affirm·US）": {
    controller: "Affirm Holdings",
    equity: "NASDAQ: AFRM",
    licenseReg: "美国：银行合作/州放贷",
    trafficRank: "US对照",
    verify: "仅监管",
  },
  "Afterpay/Block（Afterpay·US）": {
    controller: "Block, Inc.（Afterpay）",
    equity: "NYSE: XYZ（原SQ）",
    licenseReg: "澳/美等BNPL监管路径",
    trafficRank: "澳美对照",
    verify: "仅监管",
  },
  "爱租机（爱租机·CN）": {
    controller: "爱租机（中国租机）",
    equity: "待核实",
    licenseReg: "中国：融资租赁/租赁经营；灰区看回收套现",
    trafficRank: "国内应用商店租机类",
    verify: "仅监管",
  },
  "人人租（人人租·CN）": {
    controller: "人人租",
    equity: "待核实",
    licenseReg: "中国：租赁经营",
    trafficRank: "国内",
    verify: "仅监管",
  },
  "得机/得机租赁（得机·CN）": {
    controller: "得机",
    equity: "待核实",
    licenseReg: "中国：租赁",
    trafficRank: "国内",
    verify: "仅监管",
  },
  "SUPEREV/超级电动（SUPEREV·CN）": {
    controller: "SUPEREV",
    equity: "待核实",
    licenseReg: "出行工具订阅/租赁；牌照国别待核",
    trafficRank: "待补商店榜",
    verify: "待双端",
  },
  "M-KOPA（M-KOPA·KE）": {
    controller: "M-KOPA",
    equity: "非洲PAYG私募/机构",
    licenseReg: "多国：资产融资/电信PAYG（非经典现金贷牌照）",
    trafficRank: "KE等PAYG头部",
    verify: "仅监管",
  },
  "Watu/Watu Africa（Watu·KE）": {
    controller: "Watu",
    equity: "两轮资产融资私募",
    licenseReg: "东非等：资产融资/租赁",
    trafficRank: "KE/UG等",
    verify: "仅监管",
  },
  "JiuJiu Rental/久久租机（久久·NG）": {
    controller: "待核实",
    equity: "待核实",
    licenseReg: "设备租赁路径待核",
    trafficRank: "待补",
    verify: "待双端",
  },
  "Tala（Tala·MULTI）": {
    controller: "Tala (Venture capital backed)",
    equity: "美国总部私募",
    licenseReg: "多国微金融/放贷牌照分主体（PH/KE/MX/IN等）",
    trafficRank: "路飞：PH/KE/MX榜常见现金贷名",
    verify: "仅流量",
  },
  "Branch（Branch·MULTI）": {
    controller: "Branch International",
    equity: "私募",
    licenseReg: "多国非银放贷分主体",
    trafficRank: "路飞：NG/KE/IN等榜常见",
    verify: "仅流量",
  },
  "MexDin（微财·MX）": {
    controller: "微财（用户口径）",
    equity: "待核实上市/股东披露",
    licenseReg: "墨西哥：SOFOM等路径待核登记号",
    trafficRank: "点点MX现金贷活跃前排",
    verify: "仅流量",
  },
  "MexiCash（快牛·MX）": {
    controller: "快牛体系（用户口径）",
    equity: "待核实",
    licenseReg: "墨西哥本地放贷主体待核名录",
    trafficRank: "点点MX榜常见",
    verify: "仅流量",
  },
  "Aplazo（Aplazo·MX）": {
    controller: "Aplazo",
    equity: "墨西哥BNPL私募",
    licenseReg: "MX BNPL/金融科技主体待核CNBV等名录",
    trafficRank: "路飞MX借款榜BNPL#24财务档常见",
    verify: "仅流量",
  },
};

function isPendingText(s: string): boolean {
  return (
    !s ||
    s.includes("待核实") ||
    s.includes("待补") ||
    s.includes("待核") ||
    s.includes("待双端") ||
    s.includes("CRM扩表")
  );
}

function hasTrafficSignal(s: string): boolean {
  if (isPendingText(s) && !s.includes("路飞") && !s.includes("点点") && !s.includes("Sensor Tower"))
    return false;
  // 路飞/点点/Sensor Tower 快照本身算流量端证据；纯「待核：GP…」不算
  if (s.includes("待核：GP") || s.includes("待核：GP/Apple")) return false;
  return (
    s.includes("点点") ||
    s.includes("路飞") ||
    s.includes("Sensor Tower") ||
    s.includes("ST·") ||
    (s.includes("GP") && !s.includes("待核")) ||
    s.includes("Apple") ||
    s.includes("#") ||
    s.includes("下载") ||
    s.includes("MAU") ||
    s.includes("榜")
  );
}

function hasLicenseSignal(s: string): boolean {
  // 区域口径模板/「待核监管名录」不算已完成监管端
  if (isPendingText(s)) return false;
  return (
    s.includes("OJK") ||
    s.includes("SEC") ||
    s.includes("RBI") ||
    s.includes("NBFC") ||
    s.includes("SBV") ||
    s.includes("BNM") ||
    s.includes("BOT") ||
    s.includes("SECP") ||
    s.includes("CBSL") ||
    s.includes("BB ") ||
    s.includes("支付") ||
    s.includes("牌照") ||
    s.includes("SOFOM") ||
    s.includes("SOFIPO") ||
    s.includes("LPBBTI") ||
    s.includes("OLP") ||
    s.includes("SAMA") ||
    s.includes("NASDAQ") ||
    s.includes("NYSE") ||
    s.includes("HK")
  );
}

function inferVerify(
  trafficRank: string,
  licenseReg: string,
  controller: string,
  forced?: VerifyStatus,
): VerifyStatus {
  if (forced) return forced;
  const t = hasTrafficSignal(trafficRank);
  const l = hasLicenseSignal(licenseReg);
  const c = !!controller && controller !== "待核实";
  if (t && l && c) return "双端通过";
  if (t && l) return "双端通过";
  if (t && !l) return "仅流量";
  if (!t && l) return "仅监管";
  return "待双端";
}

function finalizeScene(r: SceneDraft): SceneRow {
  const patch = SCENE_KYC[r.group] ?? {};
  const controller = patch.controller ?? r.controller ?? "待核实";
  const equity = patch.equity ?? r.equity ?? "待核实";
  const licenseReg = patch.licenseReg ?? r.licenseReg ?? "待核实";
  const trafficRank = patch.trafficRank ?? r.trafficRank ?? r.diandian ?? "待核实";
  const verify = inferVerify(trafficRank, licenseReg, controller, patch.verify ?? r.verify);
  const subTags = resolveSceneSubTags(r.group, `${r.sceneType ?? ""} ${r.creditAttach ?? ""}`, r.subTags);
  const tags = resolveSceneTags(r.group, `${r.sceneType ?? ""} ${r.creditAttach ?? ""}`, r.tags);
  // 仅从牌照登记字段推断；派生信贷/集团名中的「银行」多为合作叙事，不计入持牌
  const licenseKinds = resolveLicenseKinds(r.licenseKinds, licenseReg);
  const orgDocNo = r.orgDocNo?.trim() || "待KYC·机构证件号";
  const institutionTypes = resolveInstitutionTypes("scene", undefined, r.institutionTypes);
  return {
    region: r.region,
    group: r.group,
    orgDocNo,
    institutionTypes,
    tags,
    subTags,
    sceneType: formatSceneTags(tags, subTags),
    apps: r.apps,
    countries: r.countries,
    languages: r.languages,
    mau: r.mau,
    registered: r.registered,
    share: r.share,
    creditAttach: r.creditAttach,
    diandian: r.diandian,
    controller,
    equity,
    licenseReg,
    licenseKinds,
    trafficRank,
    verify,
  };
}

function finalizeCredit(r: CreditDraft): CreditRow {
  const patch = CREDIT_KYC[r.group] ?? {};
  const official = OFFICIAL_LICENSE_BY_GROUP[r.group];
  const controller = patch.controller ?? official?.controller ?? r.controller ?? "待核实";
  const equity = patch.equity ?? r.equity ?? "待核实";
  const licenseReg =
    (official ? formatOfficialLicenseReg(official) : undefined) ??
    patch.licenseReg ??
    r.licenseReg ??
    r.licenses ??
    "待核实";
  const trafficRank = patch.trafficRank ?? r.trafficRank ?? r.diandian ?? "待核实";
  const verify = inferVerify(
    trafficRank,
    licenseReg,
    controller,
    patch.verify ?? (official ? ("仅监管" as const) : r.verify),
  );
  const tags = resolveCreditTags(r.group, {
    tags: r.tags,
    brands: r.brands,
    licenses: r.licenses,
    note: patch.note ?? r.note,
    diandian: r.diandian,
  });
  const leaseSubs = resolveLeaseSubTags(r.group, r.line, {
    leaseSubs: r.leaseSubs,
    brands: r.brands,
    licenses: r.licenses,
    note: patch.note ?? r.note,
    volume: r.volume,
  });
  const ecoRoles = resolveEcoRoles(r.line, {
    ecoRoles: r.ecoRoles,
    note: patch.note ?? r.note,
    brands: r.brands,
  });
  const institutionTypes = resolveInstitutionTypes(
    "credit",
    r.line,
    r.institutionTypes,
    ecoRoles,
  );
  const fundKinds = resolveFundKinds(institutionTypes, r.fundKinds);
  const trafficKinds = resolveTrafficKinds(institutionTypes, r.line, r.trafficKinds);
  const orgDocNo = r.orgDocNo?.trim() || "待KYC·机构证件号";
  // 仅监管/牌照字段；品牌与集团名不参与（避免「银行合作」误判）
  const licenseKinds = resolveLicenseKinds(r.licenseKinds, licenseReg, r.licenses);
  return {
    region: r.region,
    line: r.line,
    tier: r.tier,
    group: r.group,
    orgDocNo,
    institutionTypes,
    fundKinds,
    trafficKinds,
    brands: r.brands,
    countries: r.countries,
    languages: r.languages,
    licenses: r.licenses,
    timing: r.timing,
    founded: r.founded?.trim() || "成立待核实",
    regulators: r.regulators,
    traffic: r.traffic,
    volume: r.volume,
    users: r.users,
    employees: r.employees?.trim() || "员工待核实",
    diandian: r.diandian,
    note: patch.note ?? r.note,
    tags,
    leaseSubs,
    ecoRoles,
    controller,
    equity,
    licenseReg,
    licenseKinds,
    trafficRank,
    verify,
  };
}

const scenes: SceneRow[] = [...scenesCore, ...expandSceneSeeds(sceneCrmSeeds)].map(finalizeScene);

const creditsCore: CreditDraft[] = [
  // —— 现金贷 头部 ——
  {
    region: "east-asia",
    line: "cash",
    tier: "头部",
    group: "奇富科技/奇富借条/Qfin（奇富·CN）",
    brands: "奇富借条",
    countries: "中国",
    languages: "中文",
    licenses: "助贷撮合 + 银行/消金合作",
    timing: "原360数科路径；2025末助贷新规承压",
    regulators: "国家金融监管总局等",
    traffic: "App直获客（无自营生活场景）",
    volume: "2025撮合约RMB3271亿；在贷约1260亿",
    users: "获批额度用户约6480万",
    diandian: "CN：国内助贷App不进点点出海借贷榜 · 出海见KrediOne行",
    note: "纯信贷原生",
  },
  {
    region: "east-asia",
    line: "cash",
    tier: "头部",
    group: "FinVolution/信也（信也·CN）",
    brands: "国内多品牌；印尼AdaKami；菲JuanHand；澳Fundo",
    countries: "中国、印尼、菲律宾、澳大利亚",
    languages: "中/印尼/英等",
    licenses: "中国助贷撮合；印尼OJK LPBBTI（P2P）；菲SEC Lending Company + Recorded OLP",
    timing: "2007起；出海多年；澳2025收购",
    regulators: "中国金融监管；OJK；SEC PH",
    traffic: "App投放/渠道",
    volume: "2025交易额RMB2003亿；海外放款140亿",
    users: "累计注册约2.47亿；海外借款人约1340万",
    diandian: "ID·AdaKami：点点借贷下载头部梯队，2025H2走弱（Dec稿） | PH·JuanHand：菲现金贷领先梯队（公开/行业） | AU·Fundo：待补点点名次",
    note: "点点：AdaKami印尼现金贷头部梯队",
  },
  {
    region: "east-asia",
    line: "cash",
    tier: "头部",
    group: "Fintopia/瓴岳/洋钱罐（洋钱罐·CN）",
    brands: "洋钱罐；印尼Easycash；墨Credmex",
    countries: "中国；印尼等东南亚；拉美/非洲据点",
    languages: "中/印尼/西等",
    licenses: "中国助贷撮合；印尼OJK LPBBTI（Easycash）；墨金融公司/SOFOM等（Credmex）",
    timing: "洋钱罐2015；出海持续",
    regulators: "中国助贷规则；OJK",
    traffic: "App直获客",
    volume: "累计撮合700亿+RMB；Easycash印尼余额约20亿+（行业口述）",
    users: "全球约1.6亿+",
    diandian: "ID·Easycash：点点2025-12借贷下载#2（~78.3万，+1.3%MoM）；2025-09下载#1（~95.1万）、MAU>~200万 | MX·Credmex：2025Q4墨活跃排名约#3，Q4下载~107.7万（-26%QoQ）",
    note: "点点Dec’25：Easycash月下载约78.3万，印尼现金贷下载第二",
  },
  {
    region: "east-asia",
    line: "cash",
    tier: "腰部",
    group: "乐信/分期乐/Lexin（乐信·CN）",
    brands: "分期乐（现以信贷服务为主）",
    countries: "中国",
    languages: "中文",
    licenses: "助贷/科技赋能",
    timing: "分期电商基因弱化后偏信贷",
    regulators: "中国金融监管",
    traffic: "App + 合作",
    volume: "2025发起约RMB2050亿",
    users: "年活跃约820万；累计注册2.45亿",
    diandian: "CN：国内为主；MX·Fortaprest：点点2025Q3墨助贷约第五、MAU~71.4万——见Fortaprest详档",
    note: "2026与信用飞等一同被约谈名单出现；出海墨见Fortaprest",
  },
  {
    region: "east-asia",
    line: "cash",
    tier: "腰部",
    group: "嘉银科技/嘉银/Jiayin（嘉银·CN）",
    brands: "嘉银系；出海品牌含Soluskita等历史线",
    countries: "中国 + 出海",
    languages: "中文等",
    licenses: "助贷撮合；海外本地持牌",
    timing: "上市助贷；深化出海",
    regulators: "中国；海外本地",
    traffic: "App/渠道",
    volume: "2025撮合RMB1290亿",
    users: "未公开",
    diandian: "出海历史品牌点点位次待补；CN国内助贷不进出海榜",
    note: "中腰上市助贷",
  },
  {
    region: "east-asia",
    line: "cash",
    tier: "腰部",
    group: "信飞科技/信用飞（信用飞·CN）",
    brands: "信用飞（国内）；出海本地化平台（公开产品名待核实）",
    countries: "中国；2021印尼OJK、2023菲SEC自述",
    languages: "中文等",
    licenses: "CN：地方金融办小贷/助贷撮合；海外待按国填写",
    timing: "航旅分期起家→综合现金贷/助贷",
    regulators: "中国金融监管总局（2026约谈名单）；海外本地",
    traffic: "App/渠道；无自营电商/出行场景",
    volume: "国内在贷曾大幅波动（媒体）；海外细数待核实",
    users: "未统一公开",
    diandian: "CN：国内助贷 | 出海App名待核实后回填点点国榜",
    note: "勿与KrediOne股权简单等同（见下条）",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Xinfei Digital/KrediOne（奇富·ID）",
    brands: "KrediOne",
    countries: "印尼",
    languages: "印尼语、英语",
    licenses: "OJK LPBBTI（P2P）+ AFPI会员",
    timing: "2025-05 360Kredi更名KrediOne",
    regulators: "OJK",
    traffic: "App直获客",
    volume: "自述累计放款至2024-08约3万亿盾",
    users: "未公开",
    diandian: "ID·KrediOne：点点2025-09下载#2（~85.1万）；APP指数四星领跑段（~7488）；2025H2/Dec走弱。点点稿写作「信飞科技」",
    note: "股权：Xinfei Digital（原360 Fintech Asia）持股约85%，媒体关联奇富QFIN。点点「信飞」=Xinfei音译，勿与国内信用飞品牌简单等同",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Finplus（·ID）",
    brands: "Finplus",
    countries: "印尼",
    languages: "印尼语",
    licenses: "OJK P2P（待核最新名录）",
    timing: "点点2025-09 Top50活跃第一梯队",
    regulators: "OJK",
    traffic: "App",
    volume: "待核实",
    users: "点点2025-09 MAU~162万（与Easycash/Kredit Pintar同梯队）",
    diandian: "ID：点点2025-09借贷工具活跃第二（~162万MAU），与Easycash(~200万)、Kredit Pintar(~147万)构成第一梯队",
    note: "点点公开Top50校验通过；CRM原名单曾漏，现补入核心表",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Cairin（·ID）",
    brands: "Cairin",
    countries: "印尼",
    languages: "印尼语",
    licenses: "OJK P2P（待核）",
    timing: "点点2025-09下载环比正增长样本",
    regulators: "OJK",
    traffic: "App",
    volume: "待核实",
    users: "待核实",
    diandian: "ID：点点2025-09下载环比+13.26%（与Adapundi同属逆势增长样本）",
    note: "点点公开稿点名；非头部但校验存在",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "PinjamDuit（·ID）",
    brands: "PinjamDuit",
    countries: "印尼",
    languages: "印尼语",
    licenses: "OJK P2P（待核）",
    timing: "点点2025-09榜内",
    regulators: "OJK",
    traffic: "App",
    volume: "待核实",
    users: "待核实",
    diandian: "ID：点点2025-09下载环比约-35.51%（稿内点名下滑样本）",
    note: "点点公开稿点名；与Samir等同属存量承压腰部",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Bussan Auto Finance/BAF Mobile（BAF·ID）",
    brands: "BAF Mobile",
    countries: "印尼",
    languages: "印尼语",
    licenses: "传统金融机构数字臂（车辆分期）",
    timing: "点点2025-09",
    regulators: "OJK等",
    traffic: "App；车贷分期场景",
    volume: "细分车贷",
    users: "规模非最大但商店口碑高",
    diandian: "ID：点点2025-09借贷工具唯一五星；APP指数~10152（好评率等维度拉高）",
    note: "点点校验：非纯现金贷，偏车辆分期/多金融；与租机贷灰区不同",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Ammana（·ID）",
    brands: "Ammana",
    countries: "印尼",
    languages: "印尼语",
    licenses: "OJK LPBBTI（P2P；伊斯兰金融）",
    timing: "点点2025-09 Top50三星档",
    regulators: "OJK",
    traffic: "App；清真/伊斯兰客群",
    volume: "细分垂直",
    users: "点点2025-09约12.56万稳定用户群",
    diandian: "ID：点点2025-09 APP指数~6240（三星）；伊斯兰金融垂直样本",
    note: "点点公开校验建档·靠谱垂直玩家",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "AsetKu/Akulaku（阿卡拉克·ID）",
    brands: "AsetKu；PT Pintar Inovasi Digital",
    countries: "印尼",
    languages: "印尼语",
    licenses: "OJK LPBBTI（P2P）",
    timing: "Akulaku生态现金贷臂；2025-09与Home Credit合作稿",
    regulators: "OJK",
    traffic: "Akulaku生态+Home Credit App联合入口",
    volume: "待核实",
    users: "待核实",
    diandian: "ID：点点2025-09行业动态点名（Home Credit×AsetKu联合现金贷）；属Akulaku/BNC生态信贷臂",
    note: "点点公开校验建档；场景集团派生的现金贷产品线",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Rupiah Cepat（·ID）",
    brands: "Rupiah Cepat；摩比神奇",
    countries: "印尼",
    languages: "印尼语",
    licenses: "OJK LPBBTI（P2P）",
    timing: "多年持牌",
    regulators: "OJK",
    traffic: "App",
    volume: "历史累计下载头部梯队（点点2023–24报告）",
    users: "待核实近况",
    diandian: "ID：点点《海外现金贷2025》累计下载/月活历史TOP前四梯队；仿冒变体曾出现在非法名单对照",
    note: "点点公开校验建档·历史头部中资出海",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "UangMe（·ID）",
    brands: "UangMe",
    countries: "印尼",
    languages: "印尼语",
    licenses: "OJK LPBBTI（P2P）",
    timing: "持牌运营",
    regulators: "OJK",
    traffic: "App",
    volume: "待核实",
    users: "待核实",
    diandian: "ID：点点借贷工具榜常见中腰品牌；公开稿位次随月波动，建档待续补最新名次",
    note: "点点生态常见名·正式建档（种子升详档）",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Bank Neo Commerce/Neo Pinjam（BNC·ID）",
    brands: "Neo Pinjam；Bank Neo Commerce",
    countries: "印尼",
    languages: "印尼语",
    licenses: "数字银行大牌照产品（对照）",
    timing: "点点2025-09：限额提至1亿盾、期限至24月",
    regulators: "OJK/央行体系",
    traffic: "BNC/Akulaku生态",
    volume: "银行侧个贷扩张",
    users: "BNC自称服务超2600万客户（集团口径）",
    diandian: "ID：点点2025-09行业动态点名Neo Pinjam额度上调；属场景/数字银行派生信贷",
    note: "点点公开校验建档；大牌照银行产品，作信贷对照样本",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Surfin Meta/Surfin（Surfin·SG）",
    brands: "Surfin；印尼Ayovest等扩展产品",
    countries: "约9–10国：ID PH VN MX IN NG KE UG AU等",
    languages: "多语",
    licenses: "印尼：P2P、基金分销、汇款等；支付网关申请中",
    timing: "2017成立；2024起外部融资",
    regulators: "各国本地（印尼OJK等）",
    traffic: "社媒投放+App；信贷起家后扩支付/卡/理财",
    volume: "公司自述累计交易约$2.7B–$5.5B（时点不一）",
    users: "注册约0.6–1.07亿（公司口径演进）",
    diandian: "多国运营；点点公开国榜位次待逐国回填（ID/PH/MX/VN等）",
    note: "用户点名的腰部出海；新加坡总部，吴亚南",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Adapundi/印闪（印闪·ID）",
    brands: "Adapundi",
    countries: "印尼",
    languages: "印尼语",
    licenses: "OJK LPBBTI（P2P）",
    timing: "持牌运营中",
    regulators: "OJK",
    traffic: "App",
    volume: "点点Dec’25月下载约66.4万",
    users: "合作稿自称近3000万用户（待核实）",
    diandian: "ID：点点2025-12借贷下载#3（~66.4万，-2.6%MoM）；2025-09下载环比+5.72%",
    note: "点点东南亚财务榜写作「印闪科技」旗下；Dec’25下载前三校验通过",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "维信金科/Vcredit（维信·CN）",
    brands: "印尼Doeku（收购）",
    countries: "中国；印尼",
    languages: "中/印尼",
    licenses: "国内助贷；印尼OJK（Doeku）",
    timing: "2025收购PT Doeku约85%",
    regulators: "中国；OJK",
    traffic: "App",
    volume: "Doeku细数待核实",
    users: "待核实",
    diandian: "ID·Doeku：点点位次待补（2025收购后）",
    note: "上市助贷出海补位",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Danaku/TrustIQ（·ID）",
    brands: "Danaku；TrustIQ",
    countries: "印尼",
    languages: "印尼语",
    licenses: "OJK LPBBTI（P2P）",
    timing: "品牌升级TrustIQ→Danaku",
    regulators: "OJK",
    traffic: "App",
    volume: "点点曾报活跃环比大增（9月榜）",
    users: "待核实",
    diandian: "ID：点点2025-09 Top50，APP指数~6950（三星）；活跃环比+46.4%（品牌升级）",
    note: "本土ANS Group；非中资",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "JuanHand/FinVolution（信也·PH）",
    brands: "JuanHand",
    countries: "菲律宾",
    languages: "英语、他加禄语",
    licenses: "SEC Lending Company + Recorded OLP（MC 19 s.2019；WeFund Lending Corp.）",
    timing: "信也出海菲主力",
    regulators: "SEC PH",
    traffic: "App+社媒矩阵",
    volume: "待核实单体放款",
    users: "公司口径服务超千万级（待核）",
    diandian: "PH：点点/公开报告现金贷综合指数领先梯队（2024末TOP口径）；与AdaKami同属FinVolution出海",
    note: "点点公开校验建档；集团行见信也 FinVolution",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "MabilisCash（·PH）",
    brands: "MabilisCash",
    countries: "菲律宾",
    languages: "英/菲",
    licenses: "SEC 借贷/OLP（待核最新名录）",
    timing: "菲现金贷公开榜常见",
    regulators: "SEC PH",
    traffic: "App",
    volume: "待核实",
    users: "待核实",
    diandian: "PH：点点海外现金贷报告等公开材料中菲榜常见头部/次头部名",
    note: "点点公开校验建档·自腰部池拆出",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "FTLending（·PH）",
    brands: "FTLending",
    countries: "菲律宾",
    languages: "英/菲",
    licenses: "SEC OLP（待核）",
    timing: "商店榜腰部曾同比大升",
    regulators: "SEC PH",
    traffic: "App投放",
    volume: "待核实",
    users: "待核实",
    diandian: "PH：点点/商店榜腰部，排名曾同比大升（既有锚点升详档）",
    note: "点点相关公开监测建档·自腰部池拆出",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Mr.cash（·PH）",
    brands: "Mr.cash",
    countries: "菲律宾",
    languages: "英/菲",
    licenses: "SEC OLP（待核）",
    timing: "菲现金贷Top梯队公开口径",
    regulators: "SEC PH",
    traffic: "App",
    volume: "待核实",
    users: "待核实",
    diandian: "PH：与MabilisCash同属菲现金贷公开Top梯队口径（2025末）",
    note: "点点/公开榜建档·自腰部池拆出",
  },
  {
    region: "south-asia",
    line: "cash",
    tier: "头部",
    group: "KreditBee（KreditBee·IN）",
    brands: "KreditBee / KrazyBee NBFC",
    countries: "印度",
    languages: "英语+印度多语",
    licenses: "RBI NBFC CoR（非吸储）+ 联合放贷",
    timing: "2016起；拟IPO",
    regulators: "RBI",
    traffic: "App直获客（无自营电商场景）",
    volume: "FY口径放款/AUM千亿卢比级（报道不一）",
    users: "千万级客户量级",
    diandian: "IN：印度现金贷；点点出海东南亚/拉美国榜通常无位（印度榜另计，待补）",
    note: "用户拼写Crditbee多指此；≠中资出海CreditBee品牌（未见独立主体）",
  },
  // —— 监管官网补档（点点覆盖不足国别）——
  {
    region: "south-asia",
    line: "cash",
    tier: "腰部",
    group: "Paisayaar/JingleCred（·PK）",
    brands: "Paisayaar",
    countries: "巴基斯坦",
    languages: "乌尔都/英",
    licenses: "SECP Licensed Lending NBFC（Nano & BNPL）",
    timing: "SECP Digital Lending Apps White List（至2025-12-05）",
    regulators: "SECP",
    traffic: "App（白名单）",
    volume: "待核实",
    users: "待核实",
    diandian: "PK：点点覆盖弱；以SECP白名单建档",
    note: "监管官网建档：SECP白名单·JingleCred Digital Financial Services Limited",
  },
  {
    region: "south-asia",
    line: "cash",
    tier: "腰部",
    group: "JazzCash/JazzCash Lending（JazzCash·PK）",
    brands: "JazzCash（Android/iOS借贷工具）",
    countries: "巴基斯坦",
    languages: "乌尔都/英",
    licenses: "SECP Licensed Lending NBFC / Digital Lending Tool",
    timing: "SECP白名单（至2025-12-05）",
    regulators: "SECP",
    traffic: "钱包内嵌借贷工具",
    volume: "待核实",
    users: "JazzCash生态用户池",
    diandian: "PK：点点覆盖弱；SECP白名单建档",
    note: "监管官网建档：JazzCash Private Limited；场景钱包交叉",
  },
  {
    region: "south-asia",
    line: "cash",
    tier: "腰部",
    group: "Aitemaad/4Sight（·PK）",
    brands: "Aitemaad",
    countries: "巴基斯坦",
    languages: "乌尔都/英",
    licenses: "SECP Licensed Lending NBFC（Nano & BNPL）",
    timing: "SECP白名单（至2025-12-05）",
    regulators: "SECP",
    traffic: "App",
    volume: "待核实",
    users: "待核实",
    diandian: "PK：SECP白名单建档",
    note: "监管官网建档：4Sight Finance Services (Pvt) Limited",
  },
  {
    region: "south-asia",
    line: "cash",
    tier: "腰部",
    group: "Fauri Cash/Pakisnova（·PK）",
    brands: "Fauri Cash",
    countries: "巴基斯坦",
    languages: "乌尔都/英",
    licenses: "SECP Licensed Lending NBFC / Microfinance Company",
    timing: "SECP白名单（至2025-12-05）",
    regulators: "SECP",
    traffic: "App",
    volume: "待核实",
    users: "待核实",
    diandian: "PK：SECP白名单建档",
    note: "监管官网建档：Pakisnova Microfinance Company (Pvt) Limited",
  },
  {
    region: "south-asia",
    line: "cash",
    tier: "腰部",
    group: "PakCredit/VisionCred（·PK）",
    brands: "PakCredit",
    countries: "巴基斯坦",
    languages: "乌尔都/英",
    licenses: "SECP Licensed Lending NBFC",
    timing: "SECP白名单（至2025-12-05）",
    regulators: "SECP",
    traffic: "App",
    volume: "待核实",
    users: "待核实",
    diandian: "PK：SECP白名单建档",
    note: "监管官网建档：VisionCred Financial Services (Pvt) Limited",
  },
  {
    region: "south-asia",
    line: "cash",
    tier: "腰部",
    group: "IDLC Finance（·BD）",
    brands: "IDLC Finance PLC",
    countries: "孟加拉",
    languages: "孟加拉/英",
    licenses: "Bangladesh Bank NBFI（非银行金融机构）",
    timing: "BB公开链接名录",
    regulators: "Bangladesh Bank",
    traffic: "分支+数字渠道",
    volume: "待核实",
    users: "待核实",
    diandian: "BD：点点覆盖弱；BB NBFI名录建档",
    note: "监管官网建档：孟加拉央行非银金融公司",
  },
  {
    region: "south-asia",
    line: "cash",
    tier: "腰部",
    group: "IPDC Finance（·BD）",
    brands: "IPDC Finance Ltd",
    countries: "孟加拉",
    languages: "孟加拉/英",
    licenses: "Bangladesh Bank NBFI",
    timing: "BB公开链接名录",
    regulators: "Bangladesh Bank",
    traffic: "分支+数字",
    volume: "待核实",
    users: "待核实",
    diandian: "BD：BB NBFI名录建档",
    note: "监管官网建档",
  },
  {
    region: "south-asia",
    line: "cash",
    tier: "腰部",
    group: "LankaBangla Finance（·BD）",
    brands: "LankaBangla Finance PLC",
    countries: "孟加拉",
    languages: "孟加拉/英",
    licenses: "Bangladesh Bank NBFI",
    timing: "BB公开链接名录",
    regulators: "Bangladesh Bank",
    traffic: "分支+数字",
    volume: "待核实",
    users: "待核实",
    diandian: "BD：BB NBFI名录建档",
    note: "监管官网建档",
  },
  {
    region: "south-asia",
    line: "cash",
    tier: "腰部",
    group: "LOLC Finance（·LK）",
    brands: "LOLC Finance PLC",
    countries: "斯里兰卡",
    languages: "僧伽罗/泰米尔/英",
    licenses: "CBSL Licensed Finance Company（Finance Business Act）",
    timing: "CBSL公开授权吸储金融公司名录（至2025-12-31口径）",
    regulators: "Central Bank of Sri Lanka",
    traffic: "分支+数字",
    volume: "待核实",
    users: "待核实",
    diandian: "LK：点点覆盖弱；CBSL LFC名录建档",
    note: "监管官网建档；LFC可动员公众存款——相对「纯放贷小牌照」更接近中型非银",
  },
  {
    region: "south-asia",
    line: "cash",
    tier: "腰部",
    group: "LB Finance（·LK）",
    brands: "LB Finance PLC",
    countries: "斯里兰卡",
    languages: "僧伽罗/英",
    licenses: "CBSL Licensed Finance Company（Finance Business Act）",
    timing: "CBSL名录",
    regulators: "CBSL",
    traffic: "分支+数字",
    volume: "待核实",
    users: "待核实",
    diandian: "LK：CBSL LFC名录建档",
    note: "监管官网建档",
  },
  {
    region: "south-asia",
    line: "cash",
    tier: "腰部",
    group: "Commercial Credit & Finance（·LK）",
    brands: "Commercial Credit & Finance PLC",
    countries: "斯里兰卡",
    languages: "英等",
    licenses: "CBSL Licensed Finance Company",
    timing: "CBSL名录",
    regulators: "CBSL",
    traffic: "分支",
    volume: "待核实",
    users: "待核实",
    diandian: "LK：CBSL LFC名录建档",
    note: "监管官网建档",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Cashalo/Paloo（·PH）",
    brands: "Cashalo；Cashacart",
    countries: "菲律宾",
    languages: "英/菲",
    licenses: "SEC Financing Company + Recorded OLP（MC 19 s.2019）",
    timing: "SEC Recorded OLP名录",
    regulators: "SEC Philippines",
    traffic: "App",
    volume: "待核实",
    users: "待核实",
    diandian: "PH：点点/SEC双源；Paloo Financing, Inc.",
    note: "监管官网建档：SEC OLP",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Digido（·PH）",
    brands: "Digido",
    countries: "菲律宾",
    languages: "英/菲",
    licenses: "SEC Financing Company + Recorded OLP",
    timing: "SEC OLP名录",
    regulators: "SEC PH",
    traffic: "App",
    volume: "待核实",
    users: "待核实",
    diandian: "PH：SEC OLP建档",
    note: "监管官网建档：Digido Finance Corp.",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "FE Credit（FE·VN）",
    brands: "FE Credit",
    countries: "越南",
    languages: "越南语",
    licenses: "SBV 金融公司（Công ty tài chính）消费金融牌照",
    timing: "越南消费金融头部",
    regulators: "State Bank of Vietnam",
    traffic: "门店+App",
    volume: "市占长期头部（行业报告）",
    users: "待核实",
    diandian: "VN：点点覆盖弱；SBV金融公司口径建档",
    note: "监管官网逻辑建档：越南持牌消费金融公司",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Home Credit Vietnam（Home Credit·VN）",
    brands: "Home Credit VN",
    countries: "越南",
    languages: "越南语",
    licenses: "SBV 金融公司消费金融牌照",
    timing: "多年",
    regulators: "SBV",
    traffic: "门店+App",
    volume: "待核实",
    users: "待核实",
    diandian: "VN：SBV金融公司建档",
    note: "监管官网逻辑建档",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Shinhan Finance（新韩·VN）",
    brands: "Shinhan Finance",
    countries: "越南",
    languages: "越南语",
    licenses: "SBV 金融公司牌照",
    timing: "多年",
    regulators: "SBV",
    traffic: "门店+App",
    volume: "待核实",
    users: "待核实",
    diandian: "VN：SBV金融公司建档",
    note: "监管官网逻辑建档",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "AEON Credit Service/AEON Credit（AEON·MY）",
    brands: "AEON Credit Service (M) Berhad",
    countries: "马来西亚",
    languages: "英/马",
    licenses: "BNM 非银：Credit Card Issuer / 相关支付与信贷许可",
    timing: "BNM FSP Directory 可核",
    regulators: "Bank Negara Malaysia",
    traffic: "门店+App",
    volume: "待核实",
    users: "待核实",
    diandian: "MY：点点覆盖弱；BNM名录建档",
    note: "监管官网建档",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Easy Buy（Easy Buy·TH）",
    brands: "Easy Buy",
    countries: "泰国",
    languages: "泰/英",
    licenses: "BOT Personal Loan under Supervision（P-Loan）",
    timing: "BOT非银个贷监管口径",
    regulators: "Bank of Thailand",
    traffic: "门店+App",
    volume: "待核实",
    users: "待核实",
    diandian: "TH：点点覆盖弱；BOT P-Loan口径建档",
    note: "监管官网逻辑建档",
  },
  {
    region: "se-asia",
    line: "cash",
    tier: "腰部",
    group: "Ascend Nano/Ascend（Ascend·TH）",
    brands: "Ascend Nano",
    countries: "泰国",
    languages: "泰/英",
    licenses: "BOT Nano Finance under Supervision + P-Loan（双登记）",
    timing: "BOT License Check 可核",
    regulators: "Bank of Thailand",
    traffic: "True/Ascend生态+App",
    volume: "待核实",
    users: "待核实",
    diandian: "TH：BOT Nano/P-Loan建档",
    note: "监管官网建档：纳米金融+个贷双口径",
  },
  {
    region: "africa",
    line: "cash",
    tier: "头部",
    group: "Tala（Tala·MULTI）",

    brands: "Tala",
    countries: "肯尼亚、菲律宾、墨西哥、印度等",
    languages: "英语及本地语",
    licenses: "各国本地放贷许可",
    timing: "多年扩张",
    regulators: "各国本地",
    traffic: "App",
    volume: "累计授信准入约$70–80亿（官网）",
    users: "累计约1300万+",
    diandian: "PH/KE/MX/IN：多国现金贷；点点菲/墨国榜常见对标，精确名次待补最新月报",
    note: "美系微型现金贷；菲市场常见对标",
  },
  {
    region: "africa",
    line: "cash",
    tier: "腰部",
    group: "Branch（Branch·MULTI）",
    brands: "Branch",
    countries: "肯尼亚、尼日利亚、坦桑、印度等",
    languages: "英语及本地语",
    licenses: "各国本地",
    timing: "市场有进退",
    regulators: "各国本地",
    traffic: "App",
    volume: "未公开",
    users: "未公开",
    diandian: "KE/NG等：点点公开月报位次待补",
    note: "手机数据评分现金贷",
  },
  {
    region: "west",
    line: "cash",
    tier: "头部",
    group: "Upstart（Upstart·US）",
    brands: "Upstart",
    countries: "美国",
    languages: "英语",
    licenses: "银行伙伴放贷 + 州牌照",
    timing: "美股上市多年",
    regulators: "美国银行/州监管",
    traffic: "App + 银行渠道",
    volume: "2025发起约$110亿",
    users: "约150万笔/年",
    diandian: "US：非点点出海借贷主监测池",
    note: "AI现金贷撮合",
  },
  {
    region: "latam",
    line: "cash",
    tier: "头部",
    group: "DiDi Finanzas/DiDi（滴滴·MX）",
    brands: "DiDi Finanzas",
    countries: "墨西哥（拉美扩展）",
    languages: "西",
    licenses: "MX：SOFOM/金融公司（CNBV/SIPRES可核）+ 场景合作放贷",
    timing: "场景派生信贷产品线",
    regulators: "墨西哥本地",
    traffic: "DiDi/Food/Pay场景嵌入",
    volume: "待核实单体放款",
    users: "点点2025Q4墨 MAU均约367.5万",
    diandian: "MX：点点2025Q3助贷Top登顶；Q4 MAU~367.5万领先；App Store金融免费榜常约5–15，2025-09-21曾冲#1后复核下架",
    note: "点点校验高置信；主体仍属场景原生集团，产品行按现金贷对照列入",
  },
  {
    region: "latam",
    line: "cash",
    tier: "头部",
    group: "Tala（Tala·MX）",
    brands: "Tala",
    countries: "墨西哥等",
    languages: "西/英",
    licenses: "MX：金融公司/SOFOM等（待核SIPRES具体形态）",
    timing: "多年",
    regulators: "墨西哥本地",
    traffic: "App直获客",
    volume: "待核实",
    users: "点点2025Q3墨 MAU约88.7万量级",
    diandian: "MX：点点2025Q3助贷Top三甲（与DiDi Finanzas、Credmex）；Q3 MAU环比约+9.4%",
    note: "点点校验：Tala在MEA与MX均有榜；本行补墨市场位次",
  },
  {
    region: "latam",
    line: "cash",
    tier: "头部",
    group: "MexiCash（快牛·MX）",
    brands: "MexiCash / 快牛",
    countries: "墨西哥",
    languages: "西",
    licenses: "MX：金融公司/SOFOM等（待核SIPRES具体形态）",
    timing: "中资出海·快牛智能",
    regulators: "墨西哥本地",
    traffic: "App直获客",
    volume: "待核实",
    users: "点点2025Q3月活约72.89万",
    diandian: "MX：点点2025Q3助贷五星第四（指数~7514）；MAU~72.89万，环比约+9.8%",
    note: "点点公开校验建档·中资出海靠谱梯队",
  },
  {
    region: "latam",
    line: "cash",
    tier: "头部",
    group: "Fortaprest/Lexin（乐信·MX）",
    brands: "Fortaprest",
    countries: "墨西哥",
    languages: "西",
    licenses: "MX：金融公司/SOFOM等（待核SIPRES具体形态）",
    timing: "乐信出海墨",
    regulators: "墨西哥本地",
    traffic: "App",
    volume: "待核实",
    users: "点点2025Q3平均月活约71.4万",
    diandian: "MX：点点2025Q3助贷指数榜约第五；MAU~71.4万，环比约+18.18%",
    note: "点点公开校验建档；国内主体见乐信 Lexin",
  },
  {
    region: "latam",
    line: "cash",
    tier: "腰部",
    group: "Starpresta（·MX）",
    brands: "Starpresta",
    countries: "墨西哥",
    languages: "西",
    licenses: "MX：金融公司/SOFOM等（待核SIPRES具体形态）",
    timing: "点点2025Q3高增长样本",
    regulators: "墨西哥本地",
    traffic: "App",
    volume: "待核实",
    users: "待核实绝对值",
    diandian: "MX：点点2025Q3月活环比约+64.4%，下载约+102.7%（量质齐升样本）",
    note: "点点公开校验建档·四星高增",
  },
  {
    region: "latam",
    line: "cash",
    tier: "腰部",
    group: "MexDin（微财·MX）",
    brands: "MexDin",
    countries: "墨西哥",
    languages: "西",
    licenses: "MX：金融公司/SOFOM等（待核SIPRES具体形态）",
    timing: "微财出海墨；2025–26快速扩张",
    regulators: "墨西哥本地",
    traffic: "App",
    volume: "待核实",
    users: "点点2025Q3平均月活约74.62万；至2026-03活跃约97.9万量级（稿）",
    diandian: "MX：点点2025Q3三星但MAU逼近第一梯队；2026Q1稿称活跃自2025初约23.9万升至约97.9万",
    note: "归属微财；点点公开校验建档·规模腰部黑马",
  },
  {
    region: "latam",
    line: "cash",
    tier: "腰部",
    group: "Finanzas Ágiles/FinVolution（信也·MX）",
    brands: "Finanzas Ágiles",
    countries: "墨西哥",
    languages: "西",
    licenses: "MX：金融公司/SOFOM等（待核SIPRES具体形态）",
    timing: "信也出海墨",
    regulators: "墨西哥本地",
    traffic: "App",
    volume: "待核实",
    users: "点点2025Q3月均活跃约12.35万",
    diandian: "MX：点点2025Q3指数~6537（约第38）；MAU环比约+23.8%，下载约+46.9%",
    note: "点点公开校验建档；国内/东南亚主体见信也 FinVolution",
  },
  {
    region: "latam",
    line: "cash",
    tier: "腰部",
    group: "Baubap（·MX）",
    brands: "Baubap",
    countries: "墨西哥",
    languages: "西",
    licenses: "SOFOM等持牌（SIPRES可核）",
    timing: "本地持牌微金融",
    regulators: "墨西哥金融当局",
    traffic: "App",
    volume: "待核实",
    users: "待核实",
    diandian: "MX：点点2026Q1稿——合法机构遭冒名欺诈冲击；当季下载约-22.5%、活跃约-22.8%",
    note: "点点公开校验建档·本地持牌靠谱；合规风险来自仿冒而非自身灰产",
  },
  {
    region: "latam",
    line: "cash",
    tier: "腰部",
    group: "PopPréstamo（·MX）",
    brands: "PopPréstamo",
    countries: "墨西哥",
    languages: "西",
    licenses: "待核；有下架史",
    timing: "2025Q3仍有月活；2025-10商店下架后2026Q1暴涨复出",
    regulators: "墨西哥本地",
    traffic: "App；曾Google下架约15天",
    volume: "待核实",
    users: "2025Q3约16.5万月活；2026Q1 MAU/下载分别约+295%/+558%",
    diandian: "MX：点点2025Q3点名违规高息/催收风险并下架；2026Q1称复出后下载暴增、榜位跳升约40名",
    note: "点点公开建档·数据靠谱但合规存疑，CRM标风险观察，非默认合作推荐",
  },
  {
    region: "latam",
    line: "cash",
    tier: "头部",
    group: "Nubank（Nubank·BR）",
    brands: "Nubank",
    countries: "巴西、墨西哥、哥伦比亚",
    languages: "葡/西",
    licenses: "银行牌照",
    timing: "银行优先，信贷为核心产品",
    regulators: "BCB等",
    traffic: "银行App直获客（无电商/出行场景）",
    volume: "贷款余额近$110亿",
    users: "客户1.31亿",
    diandian: "BR/MX/CO：偏银行App；点点现金贷工具榜通常单列监测弱",
    note: "按「无生活场景、主做信贷」归信贷原生；产品含现金贷/卡循环",
  },

  // —— 消费分期 BNPL ——
  {
    region: "se-asia",
    line: "bnpl",
    tier: "头部",
    group: "Kredivo/FinAccel（Kredivo·ID）",
    brands: "Kredivo",
    countries: "印尼为主",
    languages: "印尼语、英语",
    licenses: "OJK Multifinance（融资公司/消费分期）",
    timing: "持牌多年",
    regulators: "OJK",
    traffic: "App + 电商结账嵌入（自身无电商场景）",
    volume: "点点Dec’25月下载约95万；日活均约75万",
    users: "活跃用户>11M（约2025）",
    diandian: "ID：点点2025-12借贷下载#1（~95万，+18%MoM），日活均~75万；2025-09 APP指数~7403（四星）；年末MAU口径公开稿曾引~1040万级",
    note: "点点印尼借贷下载第一；BNPL≠场景",
  },
  {
    region: "se-asia",
    line: "bnpl",
    tier: "腰部",
    group: "Atome（Atome·SEA）",
    brands: "Atome；Kredit Pintar",
    countries: "SG MY PH ID",
    languages: "英语及本地语",
    licenses: "各国BNPL/卡相关",
    timing: "2020s",
    regulators: "各国本地",
    traffic: "结账嵌入 + App",
    volume: "FY2025 GMV>$4B；年化约$6B",
    users: "PH卡>3M",
    diandian: "ID·Kredit Pintar：点点2025-09 MAU~147万（第一梯队活跃） | SG/MY/PH：国榜位次待补",
    note: "区域BNPL腰上",
  },
  {
    region: "mena",
    line: "bnpl",
    tier: "头部",
    group: "Tabby（Tabby·GCC）",
    brands: "Tabby",
    countries: "沙特、阿联酋、科威特",
    languages: "阿/英",
    licenses: "SAMA BNPL/消费金融；UAE许可",
    timing: "2025–26关键牌照节点",
    regulators: "SAMA；CBUAE",
    traffic: "结账 + App",
    volume: "与Tamara合计沙特BNPL约93–95%份额",
    users: "注册约1500–2500万",
    diandian: "SA/AE/KW：GCC BNPL；点点拉美/SEA借贷榜非主池，中东榜待补",
    note: "BNPL双寡头之一",
  },
  {
    region: "mena",
    line: "bnpl",
    tier: "头部",
    group: "Tamara（Tamara·GCC）",
    brands: "Tamara",
    countries: "GCC",
    languages: "阿/英",
    licenses: "SAMA全牌照约2025.2",
    timing: "约2025",
    regulators: "SAMA",
    traffic: "结账 + App",
    volume: "2025利润约$5150万",
    users: "未公开",
    diandian: "GCC：同上，点点国榜待补",
    note: "BNPL双寡头之一",
  },
  {
    region: "latam",
    line: "bnpl",
    tier: "头部",
    group: "Aplazo（Aplazo·MX）",
    brands: "Aplazo",
    countries: "墨西哥",
    languages: "西",
    licenses: "金融公司/BNPL",
    timing: "本地BNPL龙头梯队；获BBVA Spark授信扩展",
    regulators: "墨西哥本地",
    traffic: "商户结账+App；Walmart Cashi等嵌入",
    volume: "待核实GMV",
    users: "点点2026Q1墨借贷工具MAU约175.7万（榜眼）",
    diandian: "MX：点点2025Q4与DiDi/Credmex同列活跃前排；2026Q1现金贷TOP MAU#2~175.7万（下载-33.8%但MAU+1.3%）；BBVA授信总额约$50M",
    note: "点点公开校验建档·墨BNPL/信贷交叉头部；种子升详档",
  },
  {
    region: "latam",
    line: "bnpl",
    tier: "腰部",
    group: "Addi（Addi·CO）",
    brands: "Addi",
    countries: "哥伦比亚",
    languages: "西语",
    licenses: "融资公司",
    timing: "约2024获批",
    regulators: "SFC",
    traffic: "商户结账 + App",
    volume: "年化GMV约$13亿",
    users: "约250–300万+",
    diandian: "CO：拉美BNPL；点点国榜待补",
    note: "拉美BNPL腰部标杆",
  },
  {
    region: "west",
    line: "bnpl",
    tier: "头部",
    group: "Klarna（Klarna·EU）",
    brands: "Klarna",
    countries: "欧美澳等",
    languages: "多语",
    licenses: "瑞典银行牌照等",
    timing: "多年",
    regulators: "瑞典FI等",
    traffic: "结账网络 + App",
    volume: "GMV 2025 $1279亿",
    users: "活跃1.18亿",
    diandian: "欧美：非点点出海借贷主监测池",
    note: "全球BNPL头部；无自营电商场景",
  },
  {
    region: "west",
    line: "bnpl",
    tier: "头部",
    group: "Affirm（Affirm·US）",
    brands: "Affirm",
    countries: "美加",
    languages: "英语",
    licenses: "州牌照/银行合作",
    timing: "多年",
    regulators: "美国各州",
    traffic: "结账 + App",
    volume: "FY25 GMV约$367亿",
    users: "活跃约2300万",
    diandian: "美加：非点点出海借贷主监测池",
    note: "美国BNPL头部",
  },
  {
    region: "west",
    line: "bnpl",
    tier: "头部",
    group: "Afterpay/Block（Afterpay·US）",
    brands: "Afterpay",
    countries: "美澳英等",
    languages: "英语",
    licenses: "各国BNPL",
    timing: "并入Block后整合",
    regulators: "美/澳等",
    traffic: "结账；与Cash App协同",
    volume: "BNPL GMV约$270亿+量级",
    users: "待核实最新官方",
    diandian: "美澳英：非点点出海借贷主监测池",
    note: "消费分期产品线",
  },

  // —— 信用租赁 ——
  {
    region: "east-asia",
    line: "lease",
    tier: "头部",
    group: "爱租机（爱租机·CN）",
    brands: "爱租机",
    countries: "中国（500+城）",
    languages: "中文",
    licenses: "租赁经营；接入芝麻信用免押",
    timing: "2016起；约10年",
    regulators: "市监/租赁相关；金融灰区需区分「租机贷」",
    traffic: "租赁App/小程序；信用免押",
    volume: "全品类循环租赁（3C为主）",
    users: "自述2500–3500万+用户（口径不一）",
    diandian: "CN租赁：点点出海借贷榜不适用；国内应用商店租赁类另计",
    note: "蚂蚁战略投资口径；3C信用租赁头部",
  },
  {
    region: "east-asia",
    line: "lease",
    tier: "头部",
    group: "易鑫集团/易鑫（易鑫·CN）",
    brands: "易鑫 / Yixin",
    countries: "中国",
    languages: "中文",
    licenses: "融资租赁等（汽车金融）",
    timing: "港股上市路径；汽车金融",
    regulators: "地方金融监管等",
    traffic: "汽车经销/金融产品分发",
    volume: "汽车融资租赁/贷款服务（口径待核最新年报）",
    users: "购车金融用户（待核）",
    diandian: "CN汽车金融；点点出海借贷榜不适用",
    note: "持融资租赁牌照的汽车金融；上市公司（HKEX 路径，代码以披露为准）",
    licenseReg: "已持：融资租赁(中国)",
    licenseKinds: ["其他"],
    equity: "HKEX: 2858.HK（以最新披露为准）",
    controller: "易鑫集团",
    trafficRank: "汽车金融头部对照",
    verify: "仅监管",
  },
  {
    region: "east-asia",
    line: "lease",
    tier: "头部",
    group: "人人租（人人租·CN）",
    brands: "人人租",
    countries: "中国",
    languages: "中文",
    licenses: "租赁撮合平台",
    timing: "多年；蚂蚁云鑫等投资",
    regulators: "市监等",
    traffic: "App/小程序免押租用",
    volume: "2024 GTV约75亿；份额约27.5%（灼识/公司稿）",
    users: "注册约6100万；付费约170万",
    diandian: "CN租赁：点点出海借贷榜不适用",
    note: "全品类信用免押撮合",
  },
  {
    region: "east-asia",
    line: "lease",
    tier: "腰部",
    group: "得机/得机租赁（得机·CN）",
    brands: "得机",
    countries: "中国约250城",
    languages: "中文",
    licenses: "租赁；芝麻/支付宝生态合作自称",
    timing: "约5年深耕手机租赁",
    regulators: "市监等",
    traffic: "支付宝搜索/小程序",
    volume: "手机以租代买为主",
    users: "未公开",
    diandian: "CN租赁：点点出海借贷榜不适用",
    note: "3C租机腰部",
  },
  {
    region: "east-asia",
    line: "lease",
    tier: "新兴",
    group: "SUPEREV/超级电动（SUPEREV·CN）",
    brands: "SUPEREV；与芝麻/乐道等联名订阅",
    countries: "中国",
    languages: "中文",
    licenses: "汽车订阅/运营；信用免押",
    timing: "2025–26汽车订阅验证期",
    regulators: "汽车流通+信用服务协同",
    traffic: "订阅平台；信用免押",
    volume: "四轮电动车订阅（7日–60月）",
    users: "未公开",
    diandian: "CN汽车订阅：点点借贷榜不适用",
    note: "信用租赁上探四轮EV；对标欧洲FINN叙事",
  },
  {
    region: "africa",
    line: "lease",
    tier: "头部",
    group: "M-KOPA（M-KOPA·KE）",
    brands: "M-KOPA",
    countries: "肯尼亚、乌干达、尼日利亚等",
    languages: "英语及本地语",
    licenses: "资产融资/PAYG",
    timing: "太阳能→智能手机融资",
    regulators: "各国本地",
    traffic: "设备分期；锁机风控",
    volume: "2025尼日利亚智能手机融资放款约$1.16亿（报道）",
    users: "累计设备融资数百万级",
    diandian: "KE/NG等：设备融资；点点现金贷工具榜位次待补",
    note: "非洲设备信用融资标杆（手机/能源）",
  },
  {
    region: "africa",
    line: "lease",
    tier: "头部",
    group: "Watu/Watu Africa（Watu·KE）",
    brands: "Watu Simu 等",
    countries: "肯尼亚、乌干达、尼日利亚、卢旺达等7国",
    languages: "英语及本地语",
    licenses: "资产融资",
    timing: "车融→手机融资",
    regulators: "各国本地",
    traffic: "门店+分期；设备锁",
    volume: "累计智能手机贷约305万笔；亦做摩托/电单车",
    users: "肯尼亚活跃贷账户百万级",
    diandian: "KE等：设备/两轮融资；点点借贷工具榜位次待补",
    note: "3C到两轮出行资产的信用租赁/分期",
  },
  {
    region: "africa",
    line: "lease",
    tier: "腰部",
    group: "JiuJiu Rental/久久租机（久久·NG）",
    brands: "JiuJiu / 久久租机",
    countries: "尼日利亚等非洲；拓展南美自述",
    languages: "中/英",
    licenses: "本地租赁/分期经营",
    timing: "国内租机经验出海非洲",
    regulators: "当地",
    traffic: "门店+分期租赁",
    volume: "手机租/分期；约40%首付等方案",
    users: "未公开",
    diandian: "NG等：租机分期；点点借贷榜位次待补",
    note: "中资背景出海信用租机代表",
  },
];

function creditBrandKey(group: string): string {
  const m = group.match(/（([^）]+)）\s*$/);
  if (!m) return group.trim();
  const inner = m[1].trim();
  // 生态/监管括号多为「监管·ID」「流量服务商·…」定位标签，不能当去重键，否则同国监管会只剩第一家
  if (
    /^(监管|流量服务商|数据服务方|资金参与|风险参与|风控|支付服务|回收|权益|触达|公关|信托|会计|律师|评级)/.test(
      inner,
    )
  ) {
    const head = group.replace(/（[^）]+）\s*$/, "").trim();
    const pipes = head.split(/[｜|]/).map((s) => s.trim()).filter(Boolean);
    // Name｜Short｜Desc → 优先用简称（BI / OJK / SEC）
    if (pipes.length >= 2 && pipes[1].length <= 24) return pipes[1];
    return pipes[0] || head || group.trim();
  }
  // 玩家常见键：信也·CN
  return inner;
}

function dedupeCreditRows(rows: CreditRow[]): CreditRow[] {
  const seen = new Set<string>();
  const out: CreditRow[] = [];
  for (const r of rows) {
    // 同洲际+产品线+品牌键（括号内如 信也·CN）合并，避免「FinVolution/信也」与「信也/拍拍贷」双份
    const key = `${r.region}|${r.line}|${creditBrandKey(r.group)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

const ecoInstitutionSeeds: CreditDraft[] = [
  // —— 流量服务商·流量平台（核心平台 + 现金贷广告政策见 TRAFFIC_CORE_POLICY） ——
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Google｜Google Ads｜Alphabet（流量服务商·流量平台·US）",
    brands: "Google Ads / YouTube",
    countries: "全球（含非洲/坦桑等主要市场广告投放；当地可用性以 Google Ads 支持国为准）",
    languages: "多语",
    licenses: "广告/搜索平台；金融产品认证",
    timing: "持续",
    regulators: "广告政策自管；执法对照 CFPB/FTC 等",
    traffic: "https://ads.google.com/",
    volume: "—",
    users: "广告主",
    diandian: "公开广告政策",
    note: "流量平台·现金贷：2016 起禁美加英等 payday loan（年利率≥36%等），后扩国。合规个贷需 Google 金融认证。Partner Directory 可查，无现金贷核心代理公开名单。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["流量平台"],
    verify: "仅流量",
    licenseReg: "平台广告政策（非放贷牌）；https://support.google.com/adspolicy/answer/2464994",
    trafficRank: "B端投放",
    equity: "NASDAQ: GOOGL",
    controller: "Alphabet",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Meta｜Facebook｜Meta（流量服务商·流量平台·US）",
    brands: "Facebook / Instagram Ads",
    countries: "全球（含非洲/坦桑等主要市场广告投放；当地可用性以 Meta 广告支持国为准）",
    languages: "多语",
    licenses: "广告平台（非放贷）；金融广告预审",
    timing: "持续",
    regulators: "广告政策自管；执法对照 CFPB/FTC 等",
    traffic: "https://www.facebook.com/business",
    volume: "—",
    users: "广告主",
    diandian: "公开广告政策",
    note: "流量平台·现金贷：禁止 payday/title/pawn；贷款广告须披露 APR。无公开现金贷核心代理名单。Partner 目录：Meta Business Partners。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["流量平台"],
    verify: "仅流量",
    licenseReg: "平台广告政策（非放贷牌）；政策页见详情「流量服务政策」",
    trafficRank: "B端投放",
    equity: "NASDAQ: META",
    controller: "Meta Platforms",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "ByteDance｜TikTok｜字节跳动（流量服务商·流量平台·全球）",
    brands: "TikTok / 抖音广告",
    countries: "全球（含非洲等已开放市场；当地可用性以 TikTok Ads 支持国为准）",
    languages: "多语",
    licenses: "广告平台（非放贷）；金融服务行业准入",
    timing: "持续",
    regulators: "广告政策自管；当地金融监管另计",
    traffic: "https://www.tiktok.com/business",
    volume: "—",
    users: "广告主",
    diandian: "公开广告政策",
    note: "流量平台·现金贷：全球禁止 payday loan；持牌合规金融产品分区开放。Marketing Partners 可查，无现金贷专项代理名单。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["流量平台"],
    verify: "仅流量",
    licenseReg: "平台广告政策（非放贷牌）；政策页见详情「流量服务政策」",
    trafficRank: "B端投放",
    controller: "ByteDance",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Apple｜App Store／ASA｜Apple（流量服务商·流量平台·US）",
    brands: "App Store / Apple Search Ads",
    countries: "全球（App Store / ASA 覆盖主要市场；含非洲多国商店可用性）",
    languages: "多语",
    licenses: "应用商店/ASA；金融 App 审核",
    timing: "持续",
    regulators: "商店审核自管；当地金融监管另计",
    traffic: "https://ads.apple.com/",
    volume: "—",
    users: "开发者/广告主",
    diandian: "公开审核指南",
    note: "流量平台·现金贷：禁止掠夺性贷款应用；金融 App 审核严格。ASA Partners 可查，无现金贷专项代理名单。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["流量平台"],
    verify: "仅流量",
    licenseReg: "App Store Review Guidelines（金融/借贷条款）",
    trafficRank: "商店生态",
    equity: "NASDAQ: AAPL",
    controller: "Apple Inc.",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Snap｜Snapchat Ads｜Snap（流量服务商·流量平台·US）",
    brands: "Snapchat Ads",
    countries: "美国、加拿大、英国、欧盟、澳大利亚等（重点美欧；非洲覆盖有限）",
    languages: "多语",
    licenses: "广告平台（非放贷）",
    timing: "持续",
    regulators: "广告政策自管",
    traffic: "https://forbusiness.snapchat.com/",
    volume: "—",
    users: "广告主",
    diandian: "公开广告政策",
    note: "流量平台·现金贷：禁止 payday loan（口径近似 Meta）。无现金贷核心代理公开名单。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["流量平台"],
    verify: "仅流量",
    licenseReg: "平台广告政策（非放贷牌）",
    trafficRank: "B端投放",
    equity: "NYSE: SNAP",
    controller: "Snap Inc.",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "X｜Twitter Ads｜X Corp（流量服务商·流量平台·US）",
    brands: "X Ads / Twitter Ads",
    countries: "全球（主要市场广告投放；当地可用性以 X Ads 支持国为准）",
    languages: "多语",
    licenses: "广告平台（非放贷）",
    timing: "持续",
    regulators: "广告政策自管（政策多次修订）",
    traffic: "https://business.x.com/",
    volume: "—",
    users: "广告主",
    diandian: "公开广告政策",
    note: "流量平台·现金贷：限制高风险金融产品广告；政策多次变动。无现金贷核心代理公开名单。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["流量平台"],
    verify: "仅流量",
    licenseReg: "平台广告政策（非放贷牌）",
    trafficRank: "B端投放",
    controller: "X Corp.",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "LinkedIn｜LinkedIn Ads｜Microsoft（流量服务商·流量平台·US）",
    brands: "LinkedIn Ads",
    countries: "全球（主要市场 B2B 广告；当地可用性以 LinkedIn Ads 支持国为准）",
    languages: "多语",
    licenses: "广告平台（非放贷）",
    timing: "持续",
    regulators: "广告政策自管",
    traffic: "https://business.linkedin.com/marketing-solutions",
    volume: "—",
    users: "B2B 广告主",
    diandian: "公开广告政策",
    note: "流量平台·现金贷：禁止 payday loan；B2B 定位不适配现金贷 C 端获客。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["流量平台"],
    verify: "仅流量",
    licenseReg: "平台广告政策（非放贷牌）",
    trafficRank: "B端投放",
    equity: "NASDAQ: MSFT（Microsoft）",
    controller: "Microsoft / LinkedIn",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Taboola｜Taboola｜Taboola（流量服务商·流量平台·US）",
    brands: "Taboola",
    countries: "全球（内容推荐网络主要市场；含部分非洲媒体库存）",
    languages: "多语",
    licenses: "内容推荐/原生广告网络",
    timing: "持续",
    regulators: "广告审核自管",
    traffic: "原生推荐位",
    volume: "—",
    users: "广告主/媒体",
    diandian: "公开信息",
    note: "内容推荐网络；历史上曾有现金贷广告主使用，2020 年后审核趋严。非「核心代理」口径。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["流量平台"],
    verify: "仅流量",
    licenseReg: "平台审核政策（非放贷牌）",
    trafficRank: "B端投放",
    controller: "Taboola",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Outbrain｜Outbrain｜Outbrain（流量服务商·流量平台·US）",
    brands: "Outbrain",
    countries: "全球（内容推荐网络主要市场）",
    languages: "多语",
    licenses: "内容推荐/原生广告网络",
    timing: "持续",
    regulators: "广告审核自管",
    traffic: "原生推荐位",
    volume: "—",
    users: "广告主/媒体",
    diandian: "公开信息",
    note: "内容推荐网络；现金贷类投放审核趋严。非现金贷核心代理名单。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["流量平台"],
    verify: "仅流量",
    licenseReg: "平台审核政策（非放贷牌）",
    trafficRank: "B端投放",
    controller: "Outbrain",
  },
  // —— 流量服务商·代理商（平台授权 Reseller/Agency Partner；≠现金贷掮客） ——
  // 信源优先：STANDARD_TRAFFIC_SOURCES 官方 Partner 目录；资质动态，以目录最新为准
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "蓝色光标｜BlueFocus｜蓝色光标（流量服务商·代理商·CN）",
    brands: "蓝色光标 BlueFocus",
    countries: "中国大陆",
    languages: "中文",
    licenses: "Meta/Google/TikTok 等授权营销代理（公开合作叙事）",
    timing: "2012 起 Meta 合作叙事；A股上市",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主",
    diandian: "官方 Partner 目录 + 招股/年报对照",
    note: "授权代理：区域销售/开户/投放服务。同时覆盖 Meta/Google/TikTok 等（公开叙事）。≠现金贷流量掮客；金融客户投放仍须平台审核。信源：Meta Partners、公司披露。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "双端通过",
    licenseReg: "授权代理资质以各平台 Partner 目录动态核验",
    trafficRank: "B端代理",
    equity: "SZ: 300058",
    controller: "蓝色光标",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "飞书深诺｜Meetsocial｜飞书深诺（流量服务商·代理商·CN）",
    brands: "飞书深诺 Meetsocial",
    countries: "中国大陆、港澳台及出海",
    languages: "中文/英语",
    licenses: "出海数字营销；Meta/Google/TikTok 授权代理叙事",
    timing: "2022 港股上市叙事",
    regulators: "—",
    traffic: "https://www.tiktok.com/business/en-US/solutions/tiktok-marketing-partners",
    volume: "—",
    users: "出海广告主",
    diandian: "招股书 + Marketing Partners 对照",
    note: "授权代理/出海营销。招股书披露含金融科技客户，强调持牌机构与合规贷款产品。≠现金贷掮客。信源：港股招股书、TikTok/Meta Partners。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "双端通过",
    licenseReg: "授权代理；金融广告仍受平台与当地监管约束",
    trafficRank: "B端代理·出海",
    equity: "HKEX 路径（以披露为准）",
    controller: "飞书深诺",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "YinoLink｜易诺｜YinoLink（流量服务商·代理商·CN）",
    brands: "YinoLink 易诺",
    countries: "中国大陆",
    languages: "中文",
    licenses: "Meta 等数字营销代理（中小客户）",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "中小广告主",
    diandian: "Partner 目录/行业公开对照",
    note: "授权代理对照；中小客户为主。≠现金贷专项代理。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权代理资质以 Partner 目录为准",
    trafficRank: "B端代理",
    controller: "YinoLink",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "华扬联众｜Hylink｜华扬联众（流量服务商·代理商·CN）",
    brands: "华扬联众 Hylink",
    countries: "中国",
    languages: "中文",
    licenses: "Google 等长期合作数字营销代理",
    timing: "A股上市口径",
    regulators: "—",
    traffic: "https://www.google.com/partners/agency-search/",
    volume: "—",
    users: "广告主",
    diandian: "年报 + Google Partners 对照",
    note: "授权代理；Google 长期合作公开叙事。≠现金贷掮客。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权代理资质以 Partner 目录为准",
    trafficRank: "B端代理",
    controller: "华扬联众",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "省广集团｜GIMC｜省广集团（流量服务商·代理商·CN）",
    brands: "省广集团 GIMC",
    countries: "中国",
    languages: "中文",
    licenses: "4A/媒介代理；Google 等合作叙事",
    timing: "上市口径",
    regulators: "—",
    traffic: "https://www.google.com/partners/agency-search/",
    volume: "—",
    users: "广告主",
    diandian: "公开披露对照",
    note: "老牌 4A/媒介代理对照。≠现金贷专项渠道。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权/媒介代理",
    trafficRank: "B端代理",
    controller: "省广集团",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "Nativex｜汇量｜Mobvista（流量服务商·代理商·CN）",
    brands: "Nativex / Mobvista",
    countries: "中国/出海",
    languages: "中文/英语",
    licenses: "TikTok/出海效果广告代理叙事；ASA 亦见",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.tiktok.com/business/en-US/solutions/tiktok-marketing-partners",
    volume: "—",
    users: "游戏/工具出海广告主",
    diandian: "Marketing Partners / 公开报道",
    note: "授权/效果广告代理；工具游戏出海背景。≠现金贷掮客。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权代理资质以 Partner 目录为准",
    trafficRank: "B端代理·出海",
    controller: "Mobvista / Nativex",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "卧兔网络｜Wotokol｜卧兔（流量服务商·代理商·CN）",
    brands: "卧兔网络 Wotokol",
    countries: "中国",
    languages: "中文",
    licenses: "TikTok KOL+效果广告代理叙事",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.tiktok.com/business/en-US/solutions/tiktok-marketing-partners",
    volume: "—",
    users: "广告主",
    diandian: "行业公开对照",
    note: "TikTok 相关授权/服务代理对照。≠现金贷专项代理。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权代理资质以 Partner 目录为准",
    trafficRank: "B端代理",
    controller: "卧兔网络",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "猎豹移动｜Cheetah Mobile｜猎豹移动（流量服务商·代理商·CN）",
    brands: "猎豹移动 Cheetah Mobile",
    countries: "中国大陆、海外（近年收缩）",
    languages: "中文/英语",
    licenses: "Meta 等数字营销代理叙事；工具类出海背景",
    timing: "近年业务收缩口径",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主",
    diandian: "公开报道/年报对照",
    note: "授权代理历史对照；工具出海背景，近年收缩。≠现金贷专项代理。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权代理资质以 Partner 目录动态核验",
    trafficRank: "B端代理",
    controller: "猎豹移动",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "木瓜移动｜Papaya Mobile｜木瓜移动（流量服务商·代理商·CN）",
    brands: "木瓜移动 Papaya Mobile",
    countries: "中国大陆",
    languages: "中文",
    licenses: "跨境电商/游戏出海数字营销代理叙事",
    timing: "科创板申报后撤回等公开叙事",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "出海广告主",
    diandian: "公开披露对照",
    note: "授权代理对照；跨境电商/游戏出海为主。≠现金贷掮客。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权代理资质以 Partner 目录为准",
    trafficRank: "B端代理",
    controller: "木瓜移动",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "ADA｜Axiata Digital Advertising｜ADA（流量服务商·代理商·SEA）",
    brands: "ADA",
    countries: "马来西亚、印尼、泰国等",
    languages: "英语/本地语",
    licenses: "Meta 等授权数字营销；Axiata 集团背景",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主",
    diandian: "Partner 目录 + 集团披露",
    note: "东南亚头部数字营销集团对照；授权代理/区域销售。≠现金贷掮客。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权代理资质以 Partner 目录为准",
    trafficRank: "B端代理·SEA",
    controller: "Axiata / ADA",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "AnyMind Group｜AnyMind｜AnyMind（流量服务商·代理商·SEA）",
    brands: "AnyMind Group",
    countries: "东南亚多国、日本、印度等",
    languages: "英语/日语",
    licenses: "Meta/TikTok 等营销与创作者商业化代理叙事",
    timing: "2021 合并扩张叙事",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主/创作者",
    diandian: "公开披露 + Partners 对照",
    note: "区域授权营销服务；亦扩展 TikTok。≠现金贷专项渠道。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权代理资质以 Partner 目录为准",
    trafficRank: "B端代理·SEA",
    controller: "AnyMind Group",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "Gushcloud｜Gushcloud｜Gushcloud（流量服务商·代理商·SEA）",
    brands: "Gushcloud",
    countries: "新加坡、马来西亚、印尼、越南等",
    languages: "英语",
    licenses: "KOL+效果广告；Meta/TikTok 服务叙事",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.tiktok.com/business/en-US/solutions/tiktok-marketing-partners",
    volume: "—",
    users: "广告主",
    diandian: "行业公开对照",
    note: "SEA 创作者/效果营销代理对照。≠现金贷掮客。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权/服务代理",
    trafficRank: "B端代理·SEA",
    controller: "Gushcloud",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "Reprise Digital｜IPG｜Reprise（流量服务商·代理商·SEA）",
    brands: "Reprise Digital (IPG)",
    countries: "东南亚区域",
    languages: "英语",
    licenses: "4A 体系；Meta/Google 等媒介与效果",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "品牌广告主",
    diandian: "4A 公开网络",
    note: "IPG 旗下 4A 区域代理对照。≠现金贷专项渠道。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "4A/授权媒介代理",
    trafficRank: "B端代理·SEA",
    controller: "IPG / Reprise",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "Xaxis｜WPP｜Xaxis（流量服务商·代理商·APAC）",
    brands: "Xaxis (WPP)",
    countries: "亚太区",
    languages: "英语",
    licenses: "程序化购买为主；WPP 网络",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.google.com/partners/agency-search/",
    volume: "—",
    users: "品牌广告主",
    diandian: "4A 公开网络",
    note: "WPP 旗下程序化代理对照。≠现金贷掮客。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "4A/程序化代理",
    trafficRank: "B端代理·APAC",
    controller: "WPP / Xaxis",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "腰部",
    group: "Social Beat｜Social Beat｜Social Beat（流量服务商·代理商·IN）",
    brands: "Social Beat",
    countries: "印度",
    languages: "英语",
    licenses: "本土数字营销；Meta 等合作叙事",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主",
    diandian: "行业公开对照",
    note: "印度本土头部数字代理对照。≠现金贷专项代理。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权代理资质以 Partner 目录为准",
    trafficRank: "B端代理·IN",
    controller: "Social Beat",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "腰部",
    group: "WATConsult｜Dentsu｜WATConsult（流量服务商·代理商·IN）",
    brands: "WATConsult (Dentsu)",
    countries: "印度",
    languages: "英语",
    licenses: "4A 体系；数字营销",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主",
    diandian: "4A 公开网络",
    note: "Dentsu 印度数字代理对照。≠现金贷专项代理。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "4A/授权代理",
    trafficRank: "B端代理·IN",
    controller: "Dentsu / WATConsult",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "腰部",
    group: "Schbang｜Schbang｜Schbang（流量服务商·代理商·IN）",
    brands: "Schbang",
    countries: "印度",
    languages: "英语",
    licenses: "独立数字代理；增长较快公开叙事",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主",
    diandian: "行业公开对照",
    note: "印度独立代理对照。≠现金贷掮客。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权/数字代理",
    trafficRank: "B端代理·IN",
    controller: "Schbang",
  },
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "Aleph Group｜Aleph｜Aleph（流量服务商·代理商·新兴市场）",
    brands: "Aleph Group",
    countries: "拉美、中东、非洲及部分东南亚等（公开叙事覆盖多国）",
    languages: "西/英/阿等",
    licenses: "Meta 新兴市场核心 Reseller 叙事；亦覆盖 TikTok 等",
    timing: "2022 IPO 尝试未果等公开报道",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主",
    diandian: "Partner 目录 + 公开报道",
    note: "新兴市场授权销售代理集团对照（公开称覆盖多区域）。角色=平台接入与销售服务；≠现金贷流量掮客；金融投放仍须平台审核。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权 Reseller/Agency；以 Meta/TikTok Partners 动态核验",
    trafficRank: "B端代理·新兴市场",
    controller: "Aleph Group",
  },
  {
    region: "latam",
    line: "agent",
    tier: "腰部",
    group: "Vivabox｜Vivabox｜Vivabox（流量服务商·代理商·BR）",
    brands: "Vivabox",
    countries: "巴西",
    languages: "葡/英",
    licenses: "Meta 等区域数字营销代理叙事",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主",
    diandian: "行业公开对照",
    note: "巴西区域授权代理对照。≠现金贷专项渠道。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权代理资质以 Partner 目录为准",
    trafficRank: "B端代理·BR",
    controller: "Vivabox",
  },
  {
    region: "latam",
    line: "agent",
    tier: "腰部",
    group: "Zed｜Zed｜Zed（流量服务商·代理商·MX）",
    brands: "Zed",
    countries: "墨西哥、中美洲",
    languages: "西/英",
    licenses: "Meta 等区域数字营销代理叙事",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主",
    diandian: "行业公开对照",
    note: "墨西哥/中美洲授权代理对照。≠现金贷掮客。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权代理资质以 Partner 目录为准",
    trafficRank: "B端代理·MX",
    controller: "Zed",
  },
  {
    region: "mena",
    line: "agent",
    tier: "腰部",
    group: "Connect Ads｜Connect Ads｜Connect Ads（流量服务商·代理商·EG）",
    brands: "Connect Ads",
    countries: "埃及、中东",
    languages: "阿/英",
    licenses: "Meta 等区域数字营销代理叙事",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主",
    diandian: "行业公开对照",
    note: "中东区域授权代理对照。≠现金贷掮客。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权代理资质以 Partner 目录为准",
    trafficRank: "B端代理·MENA",
    controller: "Connect Ads",
  },
  {
    region: "mena",
    line: "agent",
    tier: "腰部",
    group: "The Online Project｜TOP｜The Online Project（流量服务商·代理商·海湾）",
    brands: "The Online Project",
    countries: "科威特/迪拜及海湾国家",
    languages: "阿/英",
    licenses: "Meta 等海湾数字营销代理叙事",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主",
    diandian: "行业公开对照",
    note: "海湾国家授权代理对照。≠现金贷专项代理。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权代理资质以 Partner 目录为准",
    trafficRank: "B端代理·海湾",
    controller: "The Online Project",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Havas Media｜Havas｜Havas Media（流量服务商·代理商·EU）",
    brands: "Havas Media",
    countries: "欧洲多国",
    languages: "多语",
    licenses: "全球 4A；Meta/Google 等媒介",
    timing: "持续",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "品牌广告主",
    diandian: "4A 公开网络",
    note: "欧洲 4A 媒介网络对照。≠现金贷专项渠道。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "4A/媒介代理",
    trafficRank: "B端·欧洲网络",
    controller: "Havas",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Dentsu｜Dentsu Aegis｜Dentsu（流量服务商·代理商·EU）",
    brands: "Dentsu / Dentsu Aegis",
    countries: "欧洲及全球",
    languages: "多语",
    licenses: "全球 4A；Google/Meta 等",
    timing: "持续",
    regulators: "—",
    traffic: "https://www.google.com/partners/agency-search/",
    volume: "—",
    users: "品牌广告主",
    diandian: "4A 公开网络",
    note: "全球 4A 网络对照（含 iProspect 等品牌）。≠现金贷掮客。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "4A/媒介代理",
    trafficRank: "B端·全球网络",
    controller: "Dentsu",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Smartly.io｜Smartly｜Smartly（流量服务商·代理商·EU）",
    brands: "Smartly.io",
    countries: "全球（欧总部）",
    languages: "英语",
    licenses: "Meta Creative/技术向官方合作伙伴叙事",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主",
    diandian: "Marketing Partners 对照",
    note: "技术导向 Meta 官方合作伙伴对照；自动化投放。≠现金贷渠道。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "官方 Creative/技术 Partner",
    trafficRank: "B端技术代理",
    controller: "Smartly.io",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "GroupM｜WPP｜GroupM（流量服务商·代理商·全球）",
    brands: "GroupM (WPP)",
    countries: "全球多国办公室",
    languages: "多语",
    licenses: "全球 4A；Google/Meta 等媒介采购",
    timing: "持续",
    regulators: "—",
    traffic: "https://www.google.com/partners/agency-search/",
    volume: "—",
    users: "品牌广告主",
    diandian: "4A 公开网络",
    note: "全球媒介集团对照；各国办公室同时服务 Google/Meta 等。≠现金贷专项代理。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "4A/媒介代理",
    trafficRank: "B端·全球网络",
    controller: "WPP / GroupM",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Meta Business Partners｜目录入口｜Meta Partners（流量服务商·代理商·全球）",
    brands: "Meta Business Partners",
    countries: "全球",
    languages: "多语",
    licenses: "官方授权代理/技术伙伴目录（标准信源）",
    timing: "持续更新",
    regulators: "—",
    traffic: "https://www.facebook.com/business/partners",
    volume: "—",
    users: "广告主选型",
    diandian: "标准可采信源",
    note: "标准信源入口：核验 Reseller/Agency/技术伙伴。不按现金贷分类；金融开户仍须广告审核。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "官方 Partner 目录（动态）",
    trafficRank: "B端目录",
    controller: "Meta Platforms",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Google Partner Directory｜认证代理｜Google Partners（流量服务商·代理商·全球）",
    brands: "Google Partners（目录入口）",
    countries: "全球",
    languages: "多语",
    licenses: "官方 Partner/Reseller 目录（标准信源）",
    timing: "持续更新",
    regulators: "—",
    traffic: "https://www.google.com/partners/agency-search/",
    volume: "—",
    users: "广告主选型",
    diandian: "标准可采信源",
    note: "标准信源入口：Premier Partner/Reseller 等动态资质。不按现金贷垂直披露。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "Google Partner 认证（动态）",
    trafficRank: "B端目录",
    controller: "Alphabet / Google Partners",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "TikTok Marketing Partners｜目录入口｜TikTok Partners（流量服务商·代理商·全球）",
    brands: "TikTok Marketing Partners",
    countries: "全球",
    languages: "多语",
    licenses: "官方 Marketing Partners 目录（标准信源）",
    timing: "持续更新",
    regulators: "—",
    traffic: "https://www.tiktok.com/business/en-US/solutions/tiktok-marketing-partners",
    volume: "—",
    users: "广告主选型",
    diandian: "标准可采信源",
    note: "标准信源入口；与 TikTok Shop Partner 体系部分重叠。≠现金贷专项名单。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "TikTok Marketing Partners（动态）",
    trafficRank: "B端目录",
    controller: "ByteDance / TikTok",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Apple Search Ads Partners｜目录入口｜ASA Partners（流量服务商·代理商·全球）",
    brands: "Apple Search Ads Partners",
    countries: "全球",
    languages: "多语",
    licenses: "官方 ASA Partners 目录（标准信源）",
    timing: "持续更新",
    regulators: "—",
    traffic: "https://searchads.apple.com/help/partners/",
    volume: "—",
    users: "开发者/广告主选型",
    diandian: "标准可采信源",
    note: "标准信源入口；代理体系相对封闭。金融 App 仍须过商店审核与广告政策。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "Apple Search Ads Partners（动态）",
    trafficRank: "B端目录",
    controller: "Apple",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "SplitMetrics｜SearchAds.com｜SplitMetrics（流量服务商·代理商·ASA）",
    brands: "SearchAds.com / SplitMetrics",
    countries: "全球",
    languages: "英语",
    licenses: "Apple Search Ads Partners；技术工具导向",
    timing: "运营中",
    regulators: "—",
    traffic: "https://searchads.apple.com/help/partners/",
    volume: "—",
    users: "开发者/增长团队",
    diandian: "ASA Partners 对照",
    note: "ASA 授权/技术伙伴对照；工具导向。≠现金贷渠道。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "Apple Search Ads Partners",
    trafficRank: "B端·ASA",
    controller: "SplitMetrics",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Mobile Action｜MobileAction｜Mobile Action（流量服务商·代理商·ASA）",
    brands: "Mobile Action",
    countries: "全球",
    languages: "英语",
    licenses: "ASA Partners；ASO+ASA 结合",
    timing: "运营中",
    regulators: "—",
    traffic: "https://searchads.apple.com/help/partners/",
    volume: "—",
    users: "开发者/增长团队",
    diandian: "ASA Partners 对照",
    note: "ASA 授权伙伴对照；ASO+ASA。≠现金贷掮客。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "Apple Search Ads Partners",
    trafficRank: "B端·ASA",
    controller: "Mobile Action",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Luna｜ironSource｜Unity（流量服务商·代理商·ASA）",
    brands: "Luna (ironSource / Unity)",
    countries: "全球",
    languages: "英语",
    licenses: "ASA Partners；游戏行业为主",
    timing: "运营中",
    regulators: "—",
    traffic: "https://searchads.apple.com/help/partners/",
    volume: "—",
    users: "游戏开发者",
    diandian: "ASA Partners 对照",
    note: "ASA 游戏向授权伙伴对照。≠现金贷专项代理。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "Apple Search Ads Partners",
    trafficRank: "B端·ASA·游戏",
    controller: "Unity / ironSource",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Tinuiti｜Tinuiti｜Tinuiti（流量服务商·代理商·US）",
    brands: "Tinuiti",
    countries: "美国/欧洲",
    languages: "英语",
    licenses: "独立效果代理；DTC/TikTok 等服务叙事",
    timing: "运营中",
    regulators: "—",
    traffic: "https://www.tiktok.com/business/en-US/solutions/tiktok-marketing-partners",
    volume: "—",
    users: "DTC 品牌",
    diandian: "行业公开对照",
    note: "美欧独立效果代理对照（含 TikTok/付费媒体）。≠现金贷专项名单。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理商"],
    verify: "仅流量",
    licenseReg: "授权/效果代理",
    trafficRank: "B端代理·US",
    controller: "Tinuiti",
  },
  // —— 流量服务商·代理运营 ——
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "点点数据｜点点｜点点数据（流量服务商·代理运营·CN）",
    brands: "点点数据",
    countries: "中国/出海监测",
    languages: "中文",
    licenses: "数据监测/情报（非放贷）",
    timing: "运营中",
    regulators: "—",
    traffic: "榜单/ASO监测订阅",
    volume: "—",
    users: "投放/产品团队",
    diandian: "公开信息",
    note: "代理运营对照；非广告投放位本身。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理运营"],
    verify: "仅流量",
    licenseReg: "数据服务",
    trafficRank: "B端工具",
    controller: "点点数据",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "七麦数据｜七麦｜七麦（流量服务商·代理运营·CN）",
    brands: "七麦数据",
    countries: "中国",
    languages: "中文",
    licenses: "ASO/ASA与应用市场监测",
    timing: "运营中",
    regulators: "—",
    traffic: "监测订阅",
    volume: "—",
    users: "投放/增长团队",
    diandian: "公开信息",
    note: "代理运营对照",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理运营"],
    verify: "仅流量",
    licenseReg: "数据服务",
    trafficRank: "B端工具",
    controller: "七麦",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "AppsFlyer｜AppsFlyer｜AppsFlyer（流量服务商·代理运营·全球）",
    brands: "AppsFlyer",
    countries: "全球",
    languages: "英语",
    licenses: "MMP 监测归因；部分 ASA 优化服务",
    timing: "运营中",
    regulators: "—",
    traffic: "归因/监测 SaaS",
    volume: "—",
    users: "投放/增长团队",
    diandian: "公开产品",
    note: "MMP 监测服务方；可协助 ASA 等优化，本身非广告销售代理。≠现金贷渠道。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理运营"],
    verify: "仅流量",
    licenseReg: "SaaS 监测",
    trafficRank: "B端工具",
    controller: "AppsFlyer",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Adjust｜Adjust｜AppLovin（流量服务商·代理运营·全球）",
    brands: "Adjust",
    countries: "全球",
    languages: "英语",
    licenses: "MMP 监测归因",
    timing: "运营中",
    regulators: "—",
    traffic: "归因/监测 SaaS",
    volume: "—",
    users: "投放/增长团队",
    diandian: "公开产品",
    note: "MMP 监测服务方。≠广告 Reseller，≠现金贷掮客。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["代理运营"],
    verify: "仅流量",
    licenseReg: "SaaS 监测",
    trafficRank: "B端工具",
    controller: "AppLovin / Adjust",
  },
  // —— 流量服务商·贷超（比价/导流；与授权代理分列） ——
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "Cermati｜Cermati｜Cermati（流量服务商·贷超·ID）",
    brands: "Cermati",
    countries: "印尼",
    languages: "印尼语",
    licenses: "线上贷超/比价导流；印尼经营贷超APP常需持牌路径",
    timing: "运营中",
    regulators: "OJK等",
    traffic: "贷超App导流",
    volume: "—",
    users: "C端借款人",
    diandian: "公开信息",
    note: "贷超对照：印尼线上贷超常需持牌。Lead gen/导流合规见 OJK 等监管详情。与平台授权广告代理分列。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["贷超"],
    verify: "仅监管",
    licenseReg: "ID：贷超/中介相关持牌路径待核",
    trafficRank: "贷超App",
    controller: "Cermati",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "LendingTree｜LendingTree｜LendingTree（流量服务商·贷超·US）",
    brands: "LendingTree",
    countries: "美国",
    languages: "英语",
    licenses: "贷款比价/导流（非 payday 主叙事）",
    timing: "上市运营",
    regulators: "CFPB/州级等",
    traffic: "比价站导流",
    volume: "—",
    users: "C端借款人",
    diandian: "公开信息",
    note: "贷款聚合/比价导流对照；受消费者金融保护与广告合规约束。与 Meta/Google 授权广告代理分列。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["贷超"],
    verify: "仅监管",
    licenseReg: "US：导流/中介合规路径（对照 CFPB）",
    trafficRank: "贷超Web",
    equity: "NASDAQ: TREE",
    controller: "LendingTree",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Credit Karma｜Credit Karma｜Intuit（流量服务商·贷超·US）",
    brands: "Credit Karma",
    countries: "美国等",
    languages: "英语",
    licenses: "信用报告+贷款推荐导流",
    timing: "运营中",
    regulators: "CFPB/FTC 等",
    traffic: "信用账户内推荐",
    volume: "—",
    users: "C端",
    diandian: "公开信息",
    note: "信用评分+产品推荐导流对照；金融产品推荐须符合消费者保护与广告披露。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["贷超"],
    verify: "仅监管",
    licenseReg: "US：导流/推荐合规（对照）",
    trafficRank: "信用账户",
    controller: "Intuit / Credit Karma",
  },
  // —— 流量服务商·贷超（线下中介/居间对照） ——
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "线下贷款经纪人｜门店中介｜线下渠道（流量服务商·贷超·CN）",
    brands: "线下门店/经纪人渠道（对照）",
    countries: "中国等",
    languages: "中文",
    licenses: "线下居间/导流（非线上贷超）",
    timing: "常见",
    regulators: "地方金融办等",
    traffic: "门店/地推/经纪人",
    volume: "—",
    users: "C端",
    diandian: "公开业态",
    note: "线下中介对照样本；SMS/外呼等触达另见触达服务机构及 TCPA 等监管口径。",
    institutionTypes: ["流量服务商"],
    trafficKinds: ["贷超"],
    verify: "待双端",
    licenseReg: "线下居间",
    trafficRank: "线下",
    controller: "待核实（渠道主体多样）",
  },
  // —— 监管（公开对照；主要市场多主体）——
  // CN
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "中国人民银行｜人行｜PBOC（监管·CN）",
    brands: "中国人民银行",
    countries: "中国",
    languages: "中文",
    licenses: "中央银行/宏观审慎与支付清算主管（对照）",
    timing: "持续",
    regulators: "国务院金融委等",
    traffic: "https://www.pbc.gov.cn/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "央行；官网可核支付机构等名录入口",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "CN：中央银行体系（对照用，非放贷牌）",
    trafficRank: "无商店榜口径",
    controller: "中国人民银行",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "国家金融监督管理总局｜金管总局｜NFRA（监管·CN）",
    brands: "国家金融监督管理总局",
    countries: "中国",
    languages: "中文",
    licenses: "银行保险等行业监管（原银保监路径）",
    timing: "持续",
    regulators: "金管总局",
    traffic: "https://www.nfra.gov.cn/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: `${REGULATORY_DIRECTORY_SOURCES.nfraBankCorp}；金融许可证查询 https://xkz.nfra.gov.cn/。现金贷：2017 年起清理整顿；无牌禁止放贷；广告/导流须对接持牌机构。`,
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg:
      "CN：银行业/保险业准入与持续监管；公开《银行业金融机构法人名单》；现金贷整顿与持牌经营要求",
    trafficRank: "无商店榜口径",
    controller: "国家金融监督管理总局",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "中国互联网金融协会｜互金协会｜NIFA（监管·CN）",
    brands: "中国互联网金融协会",
    countries: "中国",
    languages: "中文",
    licenses: "行业自律（对照）",
    timing: "持续",
    regulators: "人行指导",
    traffic: "https://www.nifa.org.cn/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业协会",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "CN：互金协会自律",
    trafficRank: "无商店榜口径",
    controller: "中国互联网金融协会",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "国家市场监督管理总局｜市监总局｜SAMR（监管·CN）",
    brands: "国家市场监督管理总局",
    countries: "中国",
    languages: "中文",
    licenses: "反垄断/市场监管（对照）",
    timing: "持续",
    regulators: "SAMR",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "反垄断",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "CN：反垄断执法",
    trafficRank: "无商店榜口径",
    controller: "国家市场监督管理总局",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "国家税务总局｜税总｜STA（监管·CN）",
    brands: "国家税务总局",
    countries: "中国",
    languages: "中文",
    licenses: "税务主管（对照）",
    timing: "持续",
    regulators: "STA",
    traffic: "税务官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "税务",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "CN：税务登记/征管对照",
    trafficRank: "无商店榜口径",
    controller: "国家税务总局",
  },
  // ID
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Bank Indonesia｜BI｜印尼央行（监管·ID）",
    brands: "Bank Indonesia",
    countries: "印度尼西亚",
    languages: "印尼语/英语",
    licenses: "中央银行/支付清算（对照）",
    timing: "持续",
    regulators: "BI",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "央行",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "ID：Bank Indonesia",
    trafficRank: "无商店榜口径",
    controller: "Bank Indonesia",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Otoritas Jasa Keuangan｜OJK｜金监局（监管·ID）",
    brands: "Otoritas Jasa Keuangan",
    countries: "印度尼西亚",
    languages: "印尼语/英语",
    licenses: "印尼金监局（P2P/多金融等名录主管）",
    timing: "持续",
    regulators: "OJK",
    traffic: "https://www.ojk.go.id/id/kanal/iknb/data-dan-statistik/direktori/fintech/default.aspx",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: `${REGULATORY_DIRECTORY_SOURCES.ojkLpbbti}；官网可交叉导入下场玩家。现金贷：须持牌；非法网贷名单与下架；贷超/导流亦受持牌与广告合规约束。`,
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "ID：OJK LPBBTI/Multifinance 等名录主管；违规现金贷 App 禁令",
    trafficRank: "无商店榜口径",
    controller: "OJK",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Asosiasi Fintech Pendanaan Bersama Indonesia｜AFPI｜印尼P2P协会（监管·ID）",
    brands: "AFPI",
    countries: "印度尼西亚",
    languages: "印尼语/英语",
    licenses: "P2P/金融科技行业自律（对照）",
    timing: "持续",
    regulators: "OJK相关",
    traffic: "协会官网/会员名录",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业协会",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "ID：AFPI 自律",
    trafficRank: "无商店榜口径",
    controller: "AFPI",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Komisi Pengawas Persaingan Usaha｜KPPU｜印尼反垄断委员会（监管·ID）",
    brands: "KPPU",
    countries: "印度尼西亚",
    languages: "印尼语/英语",
    licenses: "竞争/反垄断（对照）",
    timing: "持续",
    regulators: "KPPU",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "反垄断",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "ID：KPPU",
    trafficRank: "无商店榜口径",
    controller: "KPPU",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Direktorat Jenderal Pajak｜DGT｜印尼税总局（监管·ID）",
    brands: "DJP / DGT",
    countries: "印度尼西亚",
    languages: "印尼语/英语",
    licenses: "税务主管（对照）",
    timing: "持续",
    regulators: "DGT",
    traffic: "税务官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "税务",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "ID：DGT/DJP",
    trafficRank: "无商店榜口径",
    controller: "Direktorat Jenderal Pajak",
  },
  // IN
  {
    region: "south-asia",
    line: "agent",
    tier: "头部",
    group: "Reserve Bank of India｜RBI｜印度央行（监管·IN）",
    brands: "Reserve Bank of India",
    countries: "印度",
    languages: "英语/印地语",
    licenses: "印度央行（NBFC CoR 等）",
    timing: "持续",
    regulators: "RBI",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "央行；NBFC CoR 名录。现金贷：严格牌照；多次推动下架违规数字放贷 App；导流/广告须对接持牌主体。",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "IN：RBI NBFC 等名录；数字放贷与广告导流合规",
    trafficRank: "无商店榜口径",
    controller: "RBI",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "头部",
    group: "Digital Lenders Association of India｜DLAI｜印度数字放贷协会（监管·IN）",
    brands: "DLAI",
    countries: "印度",
    languages: "英语",
    licenses: "数字借贷行业自律（对照）",
    timing: "持续",
    regulators: "RBI相关框架",
    traffic: "协会官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业协会",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "IN：DLAI 自律",
    trafficRank: "无商店榜口径",
    controller: "DLAI",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "头部",
    group: "Competition Commission of India｜CCI｜印度竞争委员会（监管·IN）",
    brands: "CCI",
    countries: "印度",
    languages: "英语",
    licenses: "竞争/反垄断（对照）",
    timing: "持续",
    regulators: "CCI",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "反垄断",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "IN：CCI",
    trafficRank: "无商店榜口径",
    controller: "CCI",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "头部",
    group: "Central Board of Direct Taxes｜CBDT｜印度中央直接税局（监管·IN）",
    brands: "CBDT / Income Tax",
    countries: "印度",
    languages: "英语",
    licenses: "直接税主管（对照）",
    timing: "持续",
    regulators: "CBDT",
    traffic: "税务官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "税务",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "IN：CBDT/Income Tax",
    trafficRank: "无商店榜口径",
    controller: "CBDT",
  },
  // PH
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Bangko Sentral ng Pilipinas｜BSP｜菲律宾央行（监管·PH）",
    brands: "BSP",
    countries: "菲律宾",
    languages: "英语/菲律宾语",
    licenses: "中央银行/支付与银行监管；数字银行牌照（对照 PDIC 投保数字银行目录 6 家）",
    timing: "持续",
    regulators: "BSP",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: REGULATORY_DIRECTORY_SOURCES.pdicDigibank,
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "PH：BSP 数字银行/EMI/银行监管；持牌数字银行见 PDIC Directory of Insured Digital Banks",
    trafficRank: "无商店榜口径",
    controller: "BSP",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Securities and Exchange Commission｜SEC｜菲律宾证监会（监管·PH）",
    brands: "SEC Philippines",
    countries: "菲律宾",
    languages: "英语",
    licenses: "Lending/Financing/OLP 等名录主管",
    timing: "持续",
    regulators: "SEC",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业监管",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "PH：SEC OLP/Lending",
    trafficRank: "无商店榜口径",
    controller: "SEC Philippines",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Chamber of Fintech Philippines｜CFP｜菲金融科技商会（监管·PH）",
    brands: "Chamber of Fintech Philippines",
    countries: "菲律宾",
    languages: "英语",
    licenses: "金融科技行业自律（对照）",
    timing: "持续",
    regulators: "SEC/BSP相关",
    traffic: "协会官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业协会",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "PH：Fintech 商会自律",
    trafficRank: "无商店榜口径",
    controller: "Chamber of Fintech Philippines",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Philippine Competition Commission｜PCC｜菲竞争委员会（监管·PH）",
    brands: "PCC",
    countries: "菲律宾",
    languages: "英语",
    licenses: "竞争/反垄断（对照）",
    timing: "持续",
    regulators: "PCC",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "反垄断",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "PH：PCC",
    trafficRank: "无商店榜口径",
    controller: "PCC",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Bureau of Internal Revenue｜BIR｜菲国税局（监管·PH）",
    brands: "BIR",
    countries: "菲律宾",
    languages: "英语",
    licenses: "税务主管（对照）",
    timing: "持续",
    regulators: "BIR",
    traffic: "税务官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "税务",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "PH：BIR",
    trafficRank: "无商店榜口径",
    controller: "BIR",
  },
  // MX
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "Banco de México｜Banxico｜墨西哥央行（监管·MX）",
    brands: "Banxico",
    countries: "墨西哥",
    languages: "西班牙语",
    licenses: "中央银行（对照）",
    timing: "持续",
    regulators: "Banxico",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "央行",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "MX：Banxico",
    trafficRank: "无商店榜口径",
    controller: "Banco de México",
  },
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "Comisión Nacional Bancaria y de Valores｜CNBV｜墨银监（监管·MX）",
    brands: "CNBV",
    countries: "墨西哥",
    languages: "西班牙语",
    licenses: "银行/SOFOM 等监管对照",
    timing: "持续",
    regulators: "CNBV",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业监管",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "MX：CNBV/SIPRES 等",
    trafficRank: "无商店榜口径",
    controller: "CNBV",
  },
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "CONDUSEF｜Condusef｜墨金融用户保护（监管·MX）",
    brands: "CONDUSEF",
    countries: "墨西哥",
    languages: "西班牙语",
    licenses: "金融消费者保护（对照）",
    timing: "持续",
    regulators: "CONDUSEF",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业监管/消保",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "MX：CONDUSEF",
    trafficRank: "无商店榜口径",
    controller: "CONDUSEF",
  },
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "Comisión Federal de Competencia Económica｜COFECE｜墨竞争委员会（监管·MX）",
    brands: "COFECE",
    countries: "墨西哥",
    languages: "西班牙语",
    licenses: "竞争/反垄断（对照）",
    timing: "持续",
    regulators: "COFECE",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "反垄断",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "MX：COFECE",
    trafficRank: "无商店榜口径",
    controller: "COFECE",
  },
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "Servicio de Administración Tributaria｜SAT｜墨税务局（监管·MX）",
    brands: "SAT",
    countries: "墨西哥",
    languages: "西班牙语",
    licenses: "税务主管（对照）",
    timing: "持续",
    regulators: "SAT",
    traffic: "税务官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "税务",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "MX：SAT",
    trafficRank: "无商店榜口径",
    controller: "SAT",
  },
  // PK
  {
    region: "south-asia",
    line: "agent",
    tier: "头部",
    group: "State Bank of Pakistan｜SBP｜巴基斯坦央行（监管·PK）",
    brands: "SBP",
    countries: "巴基斯坦",
    languages: "英语/乌尔都语",
    licenses: "中央银行（对照）",
    timing: "持续",
    regulators: "SBP",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "央行",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "PK：SBP",
    trafficRank: "无商店榜口径",
    controller: "SBP",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "头部",
    group: "Securities and Exchange Commission of Pakistan｜SECP｜巴证监（监管·PK）",
    brands: "SECP",
    countries: "巴基斯坦",
    languages: "英语",
    licenses: "Lending NBFC 等名录主管",
    timing: "持续",
    regulators: "SECP",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业监管",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "PK：SECP Lending NBFC",
    trafficRank: "无商店榜口径",
    controller: "SECP",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "腰部",
    group: "Pakistan Fintech Association｜PFA｜巴金融科技协会（监管·PK）",
    brands: "Pakistan Fintech Association",
    countries: "巴基斯坦",
    languages: "英语",
    licenses: "金融科技行业自律（对照）",
    timing: "持续",
    regulators: "SECP/SBP相关",
    traffic: "协会官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业协会",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "PK：Fintech 协会自律",
    trafficRank: "无商店榜口径",
    controller: "Pakistan Fintech Association",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "头部",
    group: "Competition Commission of Pakistan｜CCP｜巴竞争委员会（监管·PK）",
    brands: "CCP",
    countries: "巴基斯坦",
    languages: "英语",
    licenses: "竞争/反垄断（对照）",
    timing: "持续",
    regulators: "CCP",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "反垄断",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "PK：CCP",
    trafficRank: "无商店榜口径",
    controller: "CCP",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "头部",
    group: "Federal Board of Revenue｜FBR｜巴联邦税收委员会（监管·PK）",
    brands: "FBR",
    countries: "巴基斯坦",
    languages: "英语",
    licenses: "税务主管（对照）",
    timing: "持续",
    regulators: "FBR",
    traffic: "税务官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "税务",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "PK：FBR",
    trafficRank: "无商店榜口径",
    controller: "FBR",
  },
  // VN
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "State Bank of Vietnam｜SBV｜越南央行（监管·VN）",
    brands: "SBV",
    countries: "越南",
    languages: "越南语/英语",
    licenses: "中央银行/金融公司监管（对照）",
    timing: "持续",
    regulators: "SBV",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "央行",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "VN：SBV",
    trafficRank: "无商店榜口径",
    controller: "SBV",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "Vietnam Banks Association｜VNBA｜越南银行协会（监管·VN）",
    brands: "VNBA",
    countries: "越南",
    languages: "越南语/英语",
    licenses: "银行业自律（对照）",
    timing: "持续",
    regulators: "SBV相关",
    traffic: "协会官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业协会",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "VN：VNBA 自律",
    trafficRank: "无商店榜口径",
    controller: "VNBA",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Vietnam Competition Commission｜VCC｜越南竞争委员会（监管·VN）",
    brands: "VCC",
    countries: "越南",
    languages: "越南语/英语",
    licenses: "竞争/反垄断（对照）",
    timing: "持续",
    regulators: "VCC",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "反垄断",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "VN：VCC",
    trafficRank: "无商店榜口径",
    controller: "VCC",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "General Department of Taxation｜GDT｜越南税总局（监管·VN）",
    brands: "GDT",
    countries: "越南",
    languages: "越南语/英语",
    licenses: "税务主管（对照）",
    timing: "持续",
    regulators: "GDT",
    traffic: "税务官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "税务",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "VN：GDT",
    trafficRank: "无商店榜口径",
    controller: "GDT",
  },
  // MY
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Bank Negara Malaysia｜BNM｜马来西亚央行（监管·MY）",
    brands: "BNM",
    countries: "马来西亚",
    languages: "马来语/英语",
    licenses: "中央银行（对照）",
    timing: "持续",
    regulators: "BNM",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "央行",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "MY：BNM",
    trafficRank: "无商店榜口径",
    controller: "BNM",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Securities Commission Malaysia｜SC｜马证监会（监管·MY）",
    brands: "SC Malaysia",
    countries: "马来西亚",
    languages: "英语/马来语",
    licenses: "资本市场/部分金融科技路径（对照）",
    timing: "持续",
    regulators: "SC",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业监管",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "MY：SC",
    trafficRank: "无商店榜口径",
    controller: "Securities Commission Malaysia",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "Fintech Association of Malaysia｜FAOM｜马金融科技协会（监管·MY）",
    brands: "FAOM",
    countries: "马来西亚",
    languages: "英语",
    licenses: "金融科技行业自律（对照）",
    timing: "持续",
    regulators: "BNM/SC相关",
    traffic: "协会官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业协会",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "MY：FAOM 自律",
    trafficRank: "无商店榜口径",
    controller: "FAOM",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Malaysia Competition Commission｜MyCC｜马竞争委员会（监管·MY）",
    brands: "MyCC",
    countries: "马来西亚",
    languages: "英语/马来语",
    licenses: "竞争/反垄断（对照）",
    timing: "持续",
    regulators: "MyCC",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "反垄断",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "MY：MyCC",
    trafficRank: "无商店榜口径",
    controller: "MyCC",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Lembaga Hasil Dalam Negeri｜LHDN｜马内陆税收局（监管·MY）",
    brands: "LHDN / IRB",
    countries: "马来西亚",
    languages: "马来语/英语",
    licenses: "税务主管（对照）",
    timing: "持续",
    regulators: "LHDN",
    traffic: "税务官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "税务",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "MY：LHDN",
    trafficRank: "无商店榜口径",
    controller: "LHDN",
  },
  // TH
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Bank of Thailand｜BOT｜泰国央行（监管·TH）",
    brands: "BOT",
    countries: "泰国",
    languages: "泰语/英语",
    licenses: "中央银行/P-Loan Nano 等（对照）",
    timing: "持续",
    regulators: "BOT",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "央行",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "TH：BOT",
    trafficRank: "无商店榜口径",
    controller: "BOT",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Securities and Exchange Commission Thailand｜SEC｜泰证监会（监管·TH）",
    brands: "SEC Thailand",
    countries: "泰国",
    languages: "泰语/英语",
    licenses: "资本市场监管（对照）",
    timing: "持续",
    regulators: "SEC",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业监管",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "TH：SEC",
    trafficRank: "无商店榜口径",
    controller: "SEC Thailand",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "Thai Fintech Association｜TFA｜泰金融科技协会（监管·TH）",
    brands: "Thai Fintech Association",
    countries: "泰国",
    languages: "泰语/英语",
    licenses: "金融科技行业自律（对照）",
    timing: "持续",
    regulators: "BOT相关",
    traffic: "协会官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业协会",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "TH：TFA 自律",
    trafficRank: "无商店榜口径",
    controller: "Thai Fintech Association",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Trade Competition Commission of Thailand｜TCCT｜泰贸易竞争委员会（监管·TH）",
    brands: "TCCT",
    countries: "泰国",
    languages: "泰语/英语",
    licenses: "竞争/反垄断（对照）",
    timing: "持续",
    regulators: "TCCT",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "反垄断",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "TH：TCCT",
    trafficRank: "无商店榜口径",
    controller: "TCCT",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "The Revenue Department｜RD｜泰税务局（监管·TH）",
    brands: "Revenue Department",
    countries: "泰国",
    languages: "泰语/英语",
    licenses: "税务主管（对照）",
    timing: "持续",
    regulators: "RD",
    traffic: "税务官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "税务",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "TH：Revenue Department",
    trafficRank: "无商店榜口径",
    controller: "The Revenue Department",
  },
  // BR
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "Banco Central do Brasil｜BCB｜巴西央行（监管·BR）",
    brands: "BCB",
    countries: "巴西",
    languages: "葡萄牙语",
    licenses: "中央银行/金融科技监管（对照）",
    timing: "持续",
    regulators: "BCB",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "央行",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "BR：BCB",
    trafficRank: "无商店榜口径",
    controller: "BCB",
  },
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "Comissão de Valores Mobiliários｜CVM｜巴西证监会（监管·BR）",
    brands: "CVM",
    countries: "巴西",
    languages: "葡萄牙语",
    licenses: "资本市场监管（对照）",
    timing: "持续",
    regulators: "CVM",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业监管",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "BR：CVM",
    trafficRank: "无商店榜口径",
    controller: "CVM",
  },
  {
    region: "latam",
    line: "agent",
    tier: "腰部",
    group: "ABFintechs｜ABFintechs｜巴西金融科技协会（监管·BR）",
    brands: "ABFintechs",
    countries: "巴西",
    languages: "葡萄牙语",
    licenses: "金融科技行业自律（对照）",
    timing: "持续",
    regulators: "BCB相关",
    traffic: "协会官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业协会",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "BR：ABFintechs 自律",
    trafficRank: "无商店榜口径",
    controller: "ABFintechs",
  },
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "Conselho Administrativo de Defesa Econômica｜CADE｜巴西行政经济保护委员会（监管·BR）",
    brands: "CADE",
    countries: "巴西",
    languages: "葡萄牙语",
    licenses: "竞争/反垄断（对照）",
    timing: "持续",
    regulators: "CADE",
    traffic: "监管官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "反垄断",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "BR：CADE",
    trafficRank: "无商店榜口径",
    controller: "CADE",
  },
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "Receita Federal do Brasil｜RFB｜巴西联邦税务局（监管·BR）",
    brands: "Receita Federal",
    countries: "巴西",
    languages: "葡萄牙语",
    licenses: "税务主管（对照）",
    timing: "持续",
    regulators: "RFB",
    traffic: "税务官网",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "税务",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "BR：Receita Federal",
    trafficRank: "无商店榜口径",
    controller: "Receita Federal",
  },
  // 欧美对照样本
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Financial Conduct Authority｜FCA｜英国金融行为监管局（监管·GB）",
    brands: "FCA",
    countries: "英国",
    languages: "英语",
    licenses: "行为监管对照样本",
    timing: "持续",
    regulators: "FCA",
    traffic: "https://www.fca.org.uk/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "高成本短贷利率上限（2015 起，公开口径含日利率上限约 0.8%/天等）；行业出清后持续行为监管与金融广告披露要求。Register 可核持牌主体。",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "UK：FCA；高成本短贷利率上限与广告行为监管",
    trafficRank: "无商店榜口径",
    controller: "FCA",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "中国证券监督管理委员会｜证监会｜CSRC（监管·CN）",
    brands: "中国证监会",
    countries: "中国",
    languages: "中文",
    licenses: "证券期货监管（对照）",
    timing: "持续",
    regulators: "CSRC",
    traffic: "https://www.csrc.gov.cn/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "证券监管；官网可核名录/公告",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "CN：证监会",
    trafficRank: "无商店榜口径",
    controller: "中国证监会",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Monetary Authority of Singapore｜MAS｜新加坡金管局（监管·SG）",
    brands: "MAS",
    countries: "新加坡",
    languages: "英语",
    licenses: "综合金融监管（对照）",
    timing: "持续",
    regulators: "MAS",
    traffic: "https://www.mas.gov.sg/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "持牌金融机构名录见 MAS Financial Institutions Directory",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "SG：MAS",
    trafficRank: "无商店榜口径",
    controller: "MAS",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "Hong Kong Monetary Authority｜HKMA｜香港金管局（监管·HK）",
    brands: "HKMA",
    countries: "中国香港",
    languages: "中/英",
    licenses: "银行/支付等监管（对照）",
    timing: "持续",
    regulators: "HKMA",
    traffic: "https://www.hkma.gov.hk/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "官网可查认可机构名录",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "HK：HKMA",
    trafficRank: "无商店榜口径",
    controller: "HKMA",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "Financial Services Agency｜FSA｜日本金融厅（监管·JP）",
    brands: "FSA Japan",
    countries: "日本",
    languages: "日/英",
    licenses: "金融厅监管（对照）",
    timing: "持续",
    regulators: "FSA",
    traffic: "https://www.fsa.go.jp/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "官网可查牌照/注册金融业者",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "JP：FSA",
    trafficRank: "无商店榜口径",
    controller: "FSA",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "Financial Supervisory Service｜FSS｜韩国金融监督院（监管·KR）",
    brands: "FSS",
    countries: "韩国",
    languages: "韩/英",
    licenses: "金融监督（对照）",
    timing: "持续",
    regulators: "FSS",
    traffic: "https://www.fss.or.kr/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "官网可查金融公司注册信息",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "KR：FSS",
    trafficRank: "无商店榜口径",
    controller: "FSS",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Consumer Financial Protection Bureau｜CFPB｜美国消费者金融保护局（监管·US）",
    brands: "CFPB",
    countries: "美国",
    languages: "英语",
    licenses: "消费者金融保护/投诉库（对照）",
    timing: "持续",
    regulators: "CFPB",
    traffic: "https://www.consumerfinance.gov/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "Consumer Complaint Database / 公司检索。现金贷监管：payday loan 消费者保护与执法；部分州禁止或严限；与 FTC 协同打击欺诈获客；Military Lending Act 等利率上限（公开口径常引 36% APR）。",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "US：CFPB；payday loan / 高成本短贷消费者保护规则与投诉库",
    trafficRank: "无商店榜口径",
    controller: "CFPB",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Federal Trade Commission｜FTC｜美国联邦贸易委员会（监管·US）",
    brands: "FTC",
    countries: "美国",
    languages: "英语",
    licenses: "反欺诈/虚假广告/Lead gen 执法（对照）",
    timing: "持续",
    regulators: "FTC",
    traffic: "https://www.ftc.gov/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "现金贷相关：欺骗性 lead generation、虚假贷款广告执法；金融广告不得误导 APR/费用/资格。",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "US：FTC；虚假获客与金融广告欺诈执法",
    trafficRank: "无商店榜口径",
    controller: "FTC",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Federal Reserve｜Fed｜美联储（监管·US）",
    brands: "Federal Reserve",
    countries: "美国",
    languages: "英语",
    licenses: "央行/银行控股监管（对照）",
    timing: "持续",
    regulators: "Fed",
    traffic: "https://www.federalreserve.gov/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "官网可查监管公告与银行结构",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "US：Fed",
    trafficRank: "无商店榜口径",
    controller: "Federal Reserve",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Office of the Comptroller of the Currency｜OCC｜美国货币监理署（监管·US）",
    brands: "OCC",
    countries: "美国",
    languages: "英语",
    licenses: "国民银行牌照监管（对照）",
    timing: "持续",
    regulators: "OCC",
    traffic: "https://www.occ.gov/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "Institution Search",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "US：OCC",
    trafficRank: "无商店榜口径",
    controller: "OCC",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Securities and Exchange Commission｜SEC｜美国证监会（监管·US）",
    brands: "SEC US",
    countries: "美国",
    languages: "英语",
    licenses: "证券监管/EDGAR（对照）",
    timing: "持续",
    regulators: "SEC",
    traffic: "https://www.sec.gov/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "EDGAR 披露检索；上市公司主体交叉",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "US：SEC",
    trafficRank: "无商店榜口径",
    controller: "SEC",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Bundesanstalt für Finanzdienstleistungsaufsicht｜BaFin｜德国金监局（监管·DE）",
    brands: "BaFin",
    countries: "德国",
    languages: "德/英",
    licenses: "金融监管（对照）",
    timing: "持续",
    regulators: "BaFin",
    traffic: "https://www.bafin.de/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "Company database / 牌照查询",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "DE：BaFin",
    trafficRank: "无商店榜口径",
    controller: "BaFin",
  },
  {
    region: "mena",
    line: "agent",
    tier: "头部",
    group: "Saudi Central Bank｜SAMA｜沙特央行（监管·SA）",
    brands: "SAMA",
    countries: "沙特",
    languages: "阿/英",
    licenses: "央行/金融公司监管（对照）",
    timing: "持续",
    regulators: "SAMA",
    traffic: "https://www.sama.gov.sa/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "金融科技/金融公司许可名录",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "SA：SAMA",
    trafficRank: "无商店榜口径",
    controller: "SAMA",
  },
  {
    region: "africa",
    line: "agent",
    tier: "头部",
    group: "Financial Sector Conduct Authority｜FSCA｜南非金融行业行为监管局（监管·ZA）",
    brands: "FSCA",
    countries: "南非",
    languages: "英语",
    licenses: "行为监管（对照）",
    timing: "持续",
    regulators: "FSCA",
    traffic: "https://www.fsca.co.za/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "FSPs 名录检索",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "ZA：FSCA",
    trafficRank: "无商店榜口径",
    controller: "FSCA",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "头部",
    group: "Central Bank of Sri Lanka｜CBSL｜斯里兰卡央行（监管·LK）",
    brands: "CBSL",
    countries: "斯里兰卡",
    languages: "英/僧",
    licenses: "LFC 等非银监管（对照）",
    timing: "持续",
    regulators: "CBSL",
    traffic: "https://www.cbsl.gov.lk/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "Licensed Finance Companies 名录",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "LK：CBSL LFC",
    trafficRank: "无商店榜口径",
    controller: "CBSL",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "头部",
    group: "Bangladesh Bank｜BB｜孟加拉央行（监管·BD）",
    brands: "Bangladesh Bank",
    countries: "孟加拉",
    languages: "英/孟",
    licenses: "NBFI 等监管（对照）",
    timing: "持续",
    regulators: "BB",
    traffic: "https://www.bb.org.bd/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "NBFI 名录",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "BD：BB NBFI",
    trafficRank: "无商店榜口径",
    controller: "Bangladesh Bank",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Australian Securities and Investments Commission｜ASIC｜澳证监（监管·AU）",
    brands: "ASIC",
    countries: "澳大利亚",
    languages: "英语",
    licenses: "公司/金融服务牌照（对照）",
    timing: "持续",
    regulators: "ASIC",
    traffic: "https://asic.gov.au/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "Professional registers / AFSL",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "AU：ASIC",
    trafficRank: "无商店榜口径",
    controller: "ASIC",
  },
  // —— 监管扩充：空白市场央行/金监/证监/协会对照 ——
  // TW
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "Financial Supervisory Commission｜FSC｜台湾金管会（监管·TW）",
    brands: "FSC Taiwan",
    countries: "中国台湾",
    languages: "中文/英语",
    licenses: "银行保险证券期货等综合监管（对照）",
    timing: "持续",
    regulators: "FSC",
    traffic: "https://www.fsc.gov.tw/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照；电子支付/银行名录可交叉",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "TW：FSC",
    trafficRank: "无商店榜口径",
    controller: "金融监督管理委员会",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "Central Bank of the Republic of China｜CBC｜台湾央行（监管·TW）",
    brands: "CBC",
    countries: "中国台湾",
    languages: "中文/英语",
    licenses: "央行/支付清算（对照）",
    timing: "持续",
    regulators: "CBC",
    traffic: "https://www.cbc.gov.tw/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "TW：CBC",
    trafficRank: "无商店榜口径",
    controller: "中央银行",
  },
  // CN 补档
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "国家外汇管理局｜外管局｜SAFE（监管·CN）",
    brands: "SAFE",
    countries: "中国",
    languages: "中文",
    licenses: "外汇/跨境资金（对照）",
    timing: "持续",
    regulators: "SAFE",
    traffic: "https://www.safe.gov.cn/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "跨境支付/外汇合规对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "CN：SAFE",
    trafficRank: "无商店榜口径",
    controller: "国家外汇管理局",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "中国支付清算协会｜支付清算协会｜PCAC（监管·CN）",
    brands: "PCAC",
    countries: "中国",
    languages: "中文",
    licenses: "支付清算行业自律（对照）",
    timing: "持续",
    regulators: "人行指导",
    traffic: "https://www.pcac.org.cn/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "支付机构自律对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "CN：支付清算协会",
    trafficRank: "无商店榜口径",
    controller: "中国支付清算协会",
  },
  // HK / JP / KR 补档
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "Securities and Futures Commission｜SFC｜香港证监会（监管·HK）",
    brands: "SFC",
    countries: "中国香港",
    languages: "中/英",
    licenses: "证券期货牌照（对照）",
    timing: "持续",
    regulators: "SFC",
    traffic: "https://www.sfc.hk/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "持牌人公众登记册",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "HK：SFC",
    trafficRank: "无商店榜口径",
    controller: "SFC",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "Bank of Japan｜BOJ｜日本银行（监管·JP）",
    brands: "BOJ",
    countries: "日本",
    languages: "日/英",
    licenses: "央行（对照）",
    timing: "持续",
    regulators: "BOJ",
    traffic: "https://www.boj.or.jp/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "JP：BOJ",
    trafficRank: "无商店榜口径",
    controller: "日本银行",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "Financial Services Commission｜FSC｜韩国金融服务委员会（监管·KR）",
    brands: "FSC Korea",
    countries: "韩国",
    languages: "韩/英",
    licenses: "金融政策与立法（对照）",
    timing: "持续",
    regulators: "FSC",
    traffic: "https://www.fsc.go.kr/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "与 FSS 分工：政策 vs 检查执行",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "KR：FSC",
    trafficRank: "无商店榜口径",
    controller: "FSC",
  },
  // SG 补档
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "Singapore FinTech Association｜SFA｜新加坡金融科技协会（监管·SG）",
    brands: "SFA",
    countries: "新加坡",
    languages: "英语",
    licenses: "行业自律（对照）",
    timing: "持续",
    regulators: "MAS相关生态",
    traffic: "https://singaporefintech.org/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "行业协会对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "SG：FinTech协会",
    trafficRank: "无商店榜口径",
    controller: "Singapore FinTech Association",
  },
  // IN 补档
  {
    region: "south-asia",
    line: "agent",
    tier: "头部",
    group: "Securities and Exchange Board of India｜SEBI｜印度证监会（监管·IN）",
    brands: "SEBI",
    countries: "印度",
    languages: "英语",
    licenses: "证券市场监管（对照）",
    timing: "持续",
    regulators: "SEBI",
    traffic: "https://www.sebi.gov.in/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开登记与通告",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "IN：SEBI",
    trafficRank: "无商店榜口径",
    controller: "SEBI",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "腰部",
    group: "National Housing Bank｜NHB｜印度国家住房银行（监管·IN）",
    brands: "NHB",
    countries: "印度",
    languages: "英语",
    licenses: "住房金融公司监管（对照）",
    timing: "持续",
    regulators: "NHB",
    traffic: "https://nhb.org.in/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "HFC 名录对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "IN：NHB",
    trafficRank: "无商店榜口径",
    controller: "NHB",
  },
  // VN / PH / TH 补档
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "State Securities Commission of Vietnam｜SSC｜越南证监会（监管·VN）",
    brands: "SSC Vietnam",
    countries: "越南",
    languages: "越/英",
    licenses: "证券市场监管（对照）",
    timing: "持续",
    regulators: "SSC",
    traffic: "https://ssc.gov.vn/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "VN：SSC",
    trafficRank: "无商店榜口径",
    controller: "SSC",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "Insurance Commission｜IC｜菲律宾保险委员会（监管·PH）",
    brands: "IC Philippines",
    countries: "菲律宾",
    languages: "英语",
    licenses: "保险业监管（对照）",
    timing: "持续",
    regulators: "IC",
    traffic: "https://www.insurance.gov.ph/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "保险公司名录对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "PH：IC",
    trafficRank: "无商店榜口径",
    controller: "Insurance Commission",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "Office of Insurance Commission｜OIC｜泰国保险委员会办公室（监管·TH）",
    brands: "OIC Thailand",
    countries: "泰国",
    languages: "泰/英",
    licenses: "保险业监管（对照）",
    timing: "持续",
    regulators: "OIC",
    traffic: "https://www.oic.or.th/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "TH：OIC",
    trafficRank: "无商店榜口径",
    controller: "OIC",
  },
  // Central Asia
  {
    region: "central-asia",
    line: "agent",
    tier: "头部",
    group: "National Bank of Kazakhstan｜NBK｜哈萨克斯坦央行（监管·KZ）",
    brands: "NBK",
    countries: "哈萨克斯坦",
    languages: "俄/英/哈",
    licenses: "央行/支付（对照）",
    timing: "持续",
    regulators: "NBK",
    traffic: "https://www.nationalbank.kz/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "KZ：NBK",
    trafficRank: "无商店榜口径",
    controller: "NBK",
  },
  {
    region: "central-asia",
    line: "agent",
    tier: "头部",
    group: "Agency for Regulation and Development of Financial Market｜ARDFM｜哈金融监管发展署（监管·KZ）",
    brands: "ARDFM",
    countries: "哈萨克斯坦",
    languages: "俄/英/哈",
    licenses: "银行/非银金融监管（对照）",
    timing: "持续",
    regulators: "ARDFM",
    traffic: "https://www.gov.kz/memleket/entities/ardfm",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "KZ：ARDFM",
    trafficRank: "无商店榜口径",
    controller: "ARDFM",
  },
  {
    region: "central-asia",
    line: "agent",
    tier: "腰部",
    group: "Central Bank of Uzbekistan｜CBU｜乌兹别克斯坦央行（监管·UZ）",
    brands: "CBU",
    countries: "乌兹别克斯坦",
    languages: "乌/俄/英",
    licenses: "央行/银行监管（对照）",
    timing: "持续",
    regulators: "CBU",
    traffic: "https://cbu.uz/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "UZ：CBU",
    trafficRank: "无商店榜口径",
    controller: "CBU",
  },
  // LatAm 补档
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "Banco de la República｜Banrep｜哥伦比亚央行（监管·CO）",
    brands: "Banrep",
    countries: "哥伦比亚",
    languages: "西/英",
    licenses: "央行（对照）",
    timing: "持续",
    regulators: "Banrep",
    traffic: "https://www.banrep.gov.co/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "CO：Banrep",
    trafficRank: "无商店榜口径",
    controller: "Banrep",
  },
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "Superintendencia Financiera de Colombia｜SFC｜哥伦比亚金融监管局（监管·CO）",
    brands: "SFC Colombia",
    countries: "哥伦比亚",
    languages: "西/英",
    licenses: "银行/非银金融监管（对照）",
    timing: "持续",
    regulators: "SFC",
    traffic: "https://www.superfinanciera.gov.co/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "受监管实体名录",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "CO：SFC",
    trafficRank: "无商店榜口径",
    controller: "SFC",
  },
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "Banco Central de la República Argentina｜BCRA｜阿根廷央行（监管·AR）",
    brands: "BCRA",
    countries: "阿根廷",
    languages: "西/英",
    licenses: "央行/金融公司（对照）",
    timing: "持续",
    regulators: "BCRA",
    traffic: "https://www.bcra.gob.ar/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "AR：BCRA",
    trafficRank: "无商店榜口径",
    controller: "BCRA",
  },
  {
    region: "latam",
    line: "agent",
    tier: "腰部",
    group: "Superintendencia de Banca, Seguros y AFP｜SBS｜秘鲁银保监（监管·PE）",
    brands: "SBS Peru",
    countries: "秘鲁",
    languages: "西/英",
    licenses: "银行保险养老金监管（对照）",
    timing: "持续",
    regulators: "SBS",
    traffic: "https://www.sbs.gob.pe/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "PE：SBS",
    trafficRank: "无商店榜口径",
    controller: "SBS",
  },
  {
    region: "latam",
    line: "agent",
    tier: "腰部",
    group: "Comisión para el Mercado Financiero｜CMF｜智利金融市场委员会（监管·CL）",
    brands: "CMF Chile",
    countries: "智利",
    languages: "西/英",
    licenses: "银行证券保险综合监管（对照）",
    timing: "持续",
    regulators: "CMF",
    traffic: "https://www.cmfchile.cl/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "CL：CMF",
    trafficRank: "无商店榜口径",
    controller: "CMF",
  },
  {
    region: "latam",
    line: "agent",
    tier: "腰部",
    group: "Superintendência de Seguros Privados｜SUSEP｜巴西私保监（监管·BR）",
    brands: "SUSEP",
    countries: "巴西",
    languages: "葡/英",
    licenses: "私营保险监管（对照）",
    timing: "持续",
    regulators: "SUSEP",
    traffic: "https://www.gov.br/susep/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "BR：SUSEP",
    trafficRank: "无商店榜口径",
    controller: "SUSEP",
  },
  // MEA
  {
    region: "mena",
    line: "agent",
    tier: "头部",
    group: "Central Bank of the UAE｜CBUAE｜阿联酋央行（监管·AE）",
    brands: "CBUAE",
    countries: "阿联酋",
    languages: "阿/英",
    licenses: "央行/银行与支付（对照）",
    timing: "持续",
    regulators: "CBUAE",
    traffic: "https://www.centralbank.ae/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开许可名录对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "AE：CBUAE",
    trafficRank: "无商店榜口径",
    controller: "CBUAE",
  },
  {
    region: "mena",
    line: "agent",
    tier: "腰部",
    group: "Dubai Financial Services Authority｜DFSA｜迪拜金融服务管理局（监管·AE）",
    brands: "DFSA",
    countries: "阿联酋",
    languages: "英语",
    licenses: "DIFC 金融服务监管（对照）",
    timing: "持续",
    regulators: "DFSA",
    traffic: "https://www.dfsa.ae/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "Public Register",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "AE：DFSA",
    trafficRank: "无商店榜口径",
    controller: "DFSA",
  },
  {
    region: "africa",
    line: "agent",
    tier: "头部",
    group: "Central Bank of Egypt｜CBE｜埃及央行（监管·EG）",
    brands: "CBE",
    countries: "埃及",
    languages: "阿/英",
    licenses: "央行/银行与支付（对照）",
    timing: "持续",
    regulators: "CBE",
    traffic: "https://www.cbe.org.eg/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "EG：CBE",
    trafficRank: "无商店榜口径",
    controller: "CBE",
  },
  {
    region: "africa",
    line: "agent",
    tier: "头部",
    group: "Central Bank of Nigeria｜CBN｜尼日利亚央行（监管·NG）",
    brands: "CBN",
    countries: "尼日利亚",
    languages: "英语",
    licenses: "央行/支付与银行（对照）",
    timing: "持续",
    regulators: "CBN",
    traffic: "https://www.cbn.gov.ng/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "支付服务商/银行名录对照。现金贷：近年加强数字贷款与消费者保护；协同整治掠夺性数字贷与不当催收。",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "NG：CBN；数字贷款监管与消费者保护",
    trafficRank: "无商店榜口径",
    controller: "CBN",
  },
  {
    region: "africa",
    line: "agent",
    tier: "腰部",
    group: "Central Bank of Kenya｜CBK｜肯尼亚央行（监管·KE）",
    brands: "CBK",
    countries: "肯尼亚",
    languages: "英/斯瓦希里",
    licenses: "央行/支付与银行（对照）",
    timing: "持续",
    regulators: "CBK",
    traffic: "https://www.centralbank.go.ke/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "KE：CBK",
    trafficRank: "无商店榜口径",
    controller: "CBK",
  },
  {
    region: "africa",
    line: "agent",
    tier: "腰部",
    group: "Bank of Ghana｜BoG｜加纳央行（监管·GH）",
    brands: "BoG",
    countries: "加纳",
    languages: "英语",
    licenses: "央行/支付与银行（对照）",
    timing: "持续",
    regulators: "BoG",
    traffic: "https://www.bog.gov.gh/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "GH：BoG",
    trafficRank: "无商店榜口径",
    controller: "BoG",
  },
  {
    region: "mena",
    line: "agent",
    tier: "头部",
    group: "Banking Regulation and Supervision Agency｜BDDK｜土耳其银监局（监管·TR）",
    brands: "BDDK",
    countries: "土耳其",
    languages: "土/英",
    licenses: "银行监管（对照）",
    timing: "持续",
    regulators: "BDDK",
    traffic: "https://www.bddk.org.tr/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "TR：BDDK",
    trafficRank: "无商店榜口径",
    controller: "BDDK",
  },
  {
    region: "mena",
    line: "agent",
    tier: "腰部",
    group: "Central Bank of the Republic of Türkiye｜CBRT｜土耳其央行（监管·TR）",
    brands: "CBRT",
    countries: "土耳其",
    languages: "土/英",
    licenses: "央行/支付（对照）",
    timing: "持续",
    regulators: "CBRT",
    traffic: "https://www.tcmb.gov.tr/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "TR：CBRT",
    trafficRank: "无商店榜口径",
    controller: "CBRT",
  },
  {
    region: "africa",
    line: "agent",
    tier: "腰部",
    group: "South African Reserve Bank｜SARB｜南非储备银行（监管·ZA）",
    brands: "SARB",
    countries: "南非",
    languages: "英语",
    licenses: "央行/审慎监管（对照）",
    timing: "持续",
    regulators: "SARB",
    traffic: "https://www.resbank.co.za/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "与 FSCA 行为监管分工",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "ZA：SARB",
    trafficRank: "无商店榜口径",
    controller: "SARB",
  },
  // West / EU / NA / AU 补档
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "European Central Bank｜ECB｜欧洲央行（监管·EU）",
    brands: "ECB",
    countries: "德国",
    languages: "多语/英语",
    licenses: "欧元区银行单一监管机制（对照）",
    timing: "持续",
    regulators: "ECB",
    traffic: "https://www.ecb.europa.eu/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "SSM；国别记德国便于筛选，实际覆盖欧元区",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "EU：ECB/SSM",
    trafficRank: "无商店榜口径",
    controller: "ECB",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Prudential Regulation Authority｜PRA｜英国审慎监管局（监管·GB）",
    brands: "PRA",
    countries: "英国",
    languages: "英语",
    licenses: "银行保险审慎监管（对照）",
    timing: "持续",
    regulators: "BoE/PRA",
    traffic: "https://www.bankofengland.co.uk/prudential-regulation",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "与 FCA 分工",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "GB：PRA",
    trafficRank: "无商店榜口径",
    controller: "PRA",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Autorité de Contrôle Prudentiel et de Résolution｜ACPR｜法国审慎监管局（监管·FR）",
    brands: "ACPR",
    countries: "法国",
    languages: "法/英",
    licenses: "银行保险审慎监管（对照）",
    timing: "持续",
    regulators: "ACPR",
    traffic: "https://acpr.banque-france.fr/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开登记对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "FR：ACPR",
    trafficRank: "无商店榜口径",
    controller: "ACPR",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Autorité des Marchés Financiers｜AMF｜法国金融市场管理局（监管·FR）",
    brands: "AMF France",
    countries: "法国",
    languages: "法/英",
    licenses: "证券市场监管（对照）",
    timing: "持续",
    regulators: "AMF",
    traffic: "https://www.amf-france.org/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "FR：AMF",
    trafficRank: "无商店榜口径",
    controller: "AMF",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "De Nederlandsche Bank｜DNB｜荷兰央行（监管·NL）",
    brands: "DNB",
    countries: "荷兰",
    languages: "荷/英",
    licenses: "央行/审慎监管（对照）",
    timing: "持续",
    regulators: "DNB",
    traffic: "https://www.dnb.nl/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "NL：DNB",
    trafficRank: "无商店榜口径",
    controller: "DNB",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Autoriteit Financiële Markten｜AFM｜荷兰金融市场管理局（监管·NL）",
    brands: "AFM",
    countries: "荷兰",
    languages: "荷/英",
    licenses: "行为监管/市场（对照）",
    timing: "持续",
    regulators: "AFM",
    traffic: "https://www.afm.nl/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "NL：AFM",
    trafficRank: "无商店榜口径",
    controller: "AFM",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Banco de España｜BdE｜西班牙央行（监管·ES）",
    brands: "BdE",
    countries: "西班牙",
    languages: "西/英",
    licenses: "央行/银行监管（对照）",
    timing: "持续",
    regulators: "BdE",
    traffic: "https://www.bde.es/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "ES：BdE",
    trafficRank: "无商店榜口径",
    controller: "BdE",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Banca d'Italia｜BdI｜意大利央行（监管·IT）",
    brands: "Banca d'Italia",
    countries: "意大利",
    languages: "意/英",
    licenses: "央行/银行监管（对照）",
    timing: "持续",
    regulators: "BdI",
    traffic: "https://www.bancaditalia.it/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "IT：BdI",
    trafficRank: "无商店榜口径",
    controller: "Banca d'Italia",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Office of the Superintendent of Financial Institutions｜OSFI｜加拿大金融机构监管署（监管·CA）",
    brands: "OSFI",
    countries: "加拿大",
    languages: "英/法",
    licenses: "联邦金融机构审慎监管（对照）",
    timing: "持续",
    regulators: "OSFI",
    traffic: "https://www.osfi-bsif.gc.ca/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "CA：OSFI",
    trafficRank: "无商店榜口径",
    controller: "OSFI",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Federal Deposit Insurance Corporation｜FDIC｜美国联邦存款保险公司（监管·US）",
    brands: "FDIC",
    countries: "美国",
    languages: "英语",
    licenses: "存款保险/州银行监管（对照）",
    timing: "持续",
    regulators: "FDIC",
    traffic: "https://www.fdic.gov/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "BankFind Suite",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "US：FDIC",
    trafficRank: "无商店榜口径",
    controller: "FDIC",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Financial Crimes Enforcement Network｜FinCEN｜美国金融犯罪执法网络（监管·US）",
    brands: "FinCEN",
    countries: "美国",
    languages: "英语",
    licenses: "反洗钱/MSB 登记（对照）",
    timing: "持续",
    regulators: "FinCEN",
    traffic: "https://www.fincen.gov/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "MSB 注册检索对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "US：FinCEN",
    trafficRank: "无商店榜口径",
    controller: "FinCEN",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Australian Prudential Regulation Authority｜APRA｜澳审慎监管局（监管·AU）",
    brands: "APRA",
    countries: "澳大利亚",
    languages: "英语",
    licenses: "银行保险养老金审慎监管（对照）",
    timing: "持续",
    regulators: "APRA",
    traffic: "https://www.apra.gov.au/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "与 ASIC 分工",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "AU：APRA",
    trafficRank: "无商店榜口径",
    controller: "APRA",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Reserve Bank of Australia｜RBA｜澳大利亚储备银行（监管·AU）",
    brands: "RBA",
    countries: "澳大利亚",
    languages: "英语",
    licenses: "央行/支付系统（对照）",
    timing: "持续",
    regulators: "RBA",
    traffic: "https://www.rba.gov.au/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "AU：RBA",
    trafficRank: "无商店榜口径",
    controller: "RBA",
  },
  // —— 数据服务方 ——
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "百行征信｜百行｜百行征信（数据服务方·CN）",
    brands: "百行征信",
    countries: "中国",
    languages: "中文",
    licenses: "个人征信牌照（公开披露口径）",
    timing: "持牌运营",
    regulators: "中国人民银行",
    traffic: "B端机构接入",
    volume: "—",
    users: "机构客户",
    diandian: "监管+公开新闻",
    note: "公开信息建档·征信数据服务",
    institutionTypes: ["数据服务方"],
    verify: "仅监管",
    licenseReg: "CN：个人征信机构",
    trafficRank: "B端非C端商店榜",
    controller: "百行征信有限公司",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "头部",
    group: "TransUnion CIBIL｜CIBIL｜TransUnion（数据服务方·IN）",
    brands: "CIBIL",
    countries: "印度",
    languages: "英语",
    licenses: "印度征信局（公开）",
    timing: "多年",
    regulators: "RBI相关框架",
    traffic: "B端",
    volume: "—",
    users: "机构/消费者查询",
    diandian: "公开信息",
    note: "公开信息建档",
    institutionTypes: ["数据服务方"],
    verify: "仅监管",
    licenseReg: "IN：征信局",
    trafficRank: "B端",
    controller: "TransUnion CIBIL",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "PEFINDO Biro Kredit｜PEFINDO｜PEFINDO（数据服务方·ID）",
    brands: "PEFINDO Biro Kredit",
    countries: "印尼",
    languages: "印尼语/英语",
    licenses: "印尼征信相关",
    timing: "运营中",
    regulators: "OJK相关",
    traffic: "B端",
    volume: "—",
    users: "机构",
    diandian: "公开信息",
    note: "公开信息建档",
    institutionTypes: ["数据服务方"],
    verify: "仅监管",
    licenseReg: "ID：征信/信用信息",
    trafficRank: "B端",
    controller: "PEFINDO",
  },
  // —— 支付服务机构 ——
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "Xendit｜Xendit｜Xendit（支付服务机构·SEA）",
    brands: "Xendit",
    countries: "印尼/菲/越等",
    languages: "英语/当地语",
    licenses: "多国支付/电子货币路径",
    timing: "运营中",
    regulators: "各国支付监管",
    traffic: "商户API/SDK",
    volume: "公开融资与业务扩张叙事",
    users: "商户",
    diandian: "公开信息",
    note: "公开信息建档·支付服务",
    institutionTypes: ["支付服务机构"],
    verify: "仅监管",
    licenseReg: "SEA：支付/e-money 分国主体",
    trafficRank: "偏B端",
    controller: "Xendit",
  },
  {
    region: "south-asia",
    line: "agent",
    tier: "头部",
    group: "Razorpay｜Razorpay｜Razorpay（支付服务机构·IN）",
    brands: "Razorpay",
    countries: "印度",
    languages: "英语",
    licenses: "印度支付聚合等路径",
    timing: "运营中",
    regulators: "RBI相关",
    traffic: "商户接入",
    volume: "—",
    users: "商户",
    diandian: "公开信息",
    note: "公开信息建档",
    institutionTypes: ["支付服务机构"],
    verify: "仅监管",
    licenseReg: "IN：支付聚合等",
    trafficRank: "偏B端",
    controller: "Razorpay",
  },
  {
    region: "latam",
    line: "agent",
    tier: "头部",
    group: "dLocal｜dLocal｜dLocal（支付服务机构·LATAM）",
    brands: "dLocal",
    countries: "拉美等多国",
    languages: "英语/西语",
    licenses: "跨境支付/本地收单路径",
    timing: "上市主体口径",
    regulators: "多国",
    traffic: "商户",
    volume: "公开财报口径",
    users: "商户",
    diandian: "公开信息",
    note: "公开信息建档",
    institutionTypes: ["支付服务机构"],
    verify: "仅监管",
    licenseReg: "多国支付路径",
    trafficRank: "偏B端",
    equity: "NASDAQ: DLO",
    controller: "dLocal",
  },
  // —— 资金参与机构 ——
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "招商银行｜招行｜招商银行（资金参与机构·本地银行·CN）",
    brands: "招商银行",
    countries: "中国",
    languages: "中文",
    licenses: "商业银行（亦可作助贷/联合贷资金方）",
    timing: "持续",
    regulators: "国家金融监督管理总局/人行",
    traffic: "对公/零售",
    volume: "—",
    users: "—",
    diandian: "公开信息",
    note: "公开信息：本地银行资金方对照；亦关联招联发起方",
    institutionTypes: ["资金参与机构"],
    fundKinds: ["本地银行"],
    verify: "仅监管",
    licenseReg: "CN：商业银行",
    trafficRank: "银行App另计",
    controller: "招商银行",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "Bank Jago｜Jago｜Bank Jago（资金参与机构·本地银行·ID）",
    brands: "Bank Jago",
    countries: "印尼",
    languages: "印尼语",
    licenses: "数字银行；可合作放贷资金",
    timing: "运营中",
    regulators: "OJK/BI",
    traffic: "App/合作",
    volume: "—",
    users: "—",
    diandian: "公开信息",
    note: "公开信息建档·本地银行",
    institutionTypes: ["资金参与机构"],
    fundKinds: ["本地银行"],
    verify: "仅监管",
    licenseReg: "ID：银行牌照",
    trafficRank: "银行App",
    controller: "Bank Jago",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "某银行助贷通道｜联合贷代理｜银行合作通道（资金参与机构·本地银行代理·CN）",
    brands: "银行助贷/联合贷代理通道（对照）",
    countries: "中国",
    languages: "中文",
    licenses: "银行合作通道/代理放款路径",
    timing: "常见",
    regulators: "金融监管相关",
    traffic: "B端对接",
    volume: "—",
    users: "平台/助贷方",
    diandian: "公开业态",
    note: "公开业态对照·本地银行代理（非自有吸储银行主体）",
    institutionTypes: ["资金参与机构"],
    fundKinds: ["本地银行代理"],
    verify: "待双端",
    licenseReg: "银行合作通道",
    trafficRank: "B端",
    controller: "待核实（通道/代理主体）",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "中金公司｜中金｜中金（资金参与机构·结构化服务商·CN）",
    brands: "中金",
    countries: "中国",
    languages: "中文",
    licenses: "证券/投行；ABS与结构化安排对照",
    timing: "持续",
    regulators: "证监会等",
    traffic: "机构",
    volume: "—",
    users: "机构",
    diandian: "公开信息",
    note: "公开信息建档·结构化服务商对照",
    institutionTypes: ["资金参与机构"],
    fundKinds: ["结构化服务商"],
    verify: "仅监管",
    licenseReg: "CN：证券/投行",
    trafficRank: "B端",
    controller: "中金公司",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "BlackRock｜贝莱德｜BlackRock（资金参与机构·优先投资人·US）",
    brands: "BlackRock",
    countries: "全球",
    languages: "英语",
    licenses: "资管；优先层/固收类投资对照",
    timing: "持续",
    regulators: "SEC等",
    traffic: "机构",
    volume: "公开AUM口径",
    users: "机构",
    diandian: "公开信息",
    note: "公开信息建档·优先投资人对照样本",
    institutionTypes: ["资金参与机构"],
    fundKinds: ["优先投资人"],
    verify: "仅监管",
    licenseReg: "资管/投资顾问",
    trafficRank: "B端",
    equity: "NYSE: BLK",
    controller: "BlackRock",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Apollo｜Apollo｜Apollo（资金参与机构·夹层投资人·US）",
    brands: "Apollo",
    countries: "全球",
    languages: "英语",
    licenses: "另类/私募信贷；夹层对照",
    timing: "持续",
    regulators: "SEC等",
    traffic: "机构",
    volume: "—",
    users: "机构",
    diandian: "公开信息",
    note: "公开信息建档·夹层投资人对照样本",
    institutionTypes: ["资金参与机构"],
    fundKinds: ["夹层投资人"],
    verify: "仅监管",
    licenseReg: "另类投资",
    trafficRank: "B端",
    equity: "NYSE: APO",
    controller: "Apollo Global Management",
  },
  // —— 风险参与机构 ——
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "中国平安｜平安｜平安（风险参与机构·CN）",
    brands: "中国平安",
    countries: "中国",
    languages: "中文",
    licenses: "保险等；信贷增信/风险分担对照",
    timing: "持续",
    regulators: "金融监管总局",
    traffic: "保险/综合金融",
    volume: "—",
    users: "—",
    diandian: "公开信息",
    note: "公开信息建档·风险参与/保险",
    institutionTypes: ["风险参与机构"],
    verify: "仅监管",
    licenseReg: "CN：保险等牌照",
    trafficRank: "综合金融App",
    controller: "中国平安",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "AIA｜AIA｜AIA（风险参与机构·SEA）",
    brands: "AIA",
    countries: "东南亚多国",
    languages: "英语/当地语",
    licenses: "保险",
    timing: "持续",
    regulators: "各国保险监管",
    traffic: "保险渠道",
    volume: "—",
    users: "—",
    diandian: "公开信息",
    note: "公开信息建档",
    institutionTypes: ["风险参与机构"],
    verify: "仅监管",
    licenseReg: "SEA：保险牌照分国",
    trafficRank: "保险App",
    controller: "AIA Group",
  },
  // —— 风控服务方 ——
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "同盾科技｜同盾｜同盾（风控服务方·CN）",
    brands: "同盾",
    countries: "中国及出海客户",
    languages: "中文/英语",
    licenses: "风控技术服务（非放贷）",
    timing: "运营中",
    regulators: "—",
    traffic: "B端SDK/API",
    volume: "—",
    users: "金融机构客户",
    diandian: "公开信息",
    note: "B 端反欺诈/设备指纹/风险决策；公开信息建档·风控服务方（非线上场景 To C 词条）",
    institutionTypes: ["风控服务方"],
    verify: "仅流量",
    licenseReg: "技术服务；各国合规以客户落地为准",
    trafficRank: "B端·反欺诈",
    controller: "同盾科技",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "FICO｜FICO｜FICO（风控服务方·US）",
    brands: "FICO",
    countries: "美国等",
    languages: "英语",
    licenses: "信用评分/决策服务（B 端）",
    timing: "多年",
    regulators: "—",
    traffic: "B端",
    volume: "公开上市口径",
    users: "机构",
    diandian: "公开信息",
    note: "信用评分与决策引擎；归风控服务方，不作 To C「信用管理」场景词条",
    institutionTypes: ["风控服务方"],
    verify: "仅监管",
    licenseReg: "评分服务商（非放贷牌）",
    trafficRank: "B端·评分",
    equity: "NYSE: FICO",
    controller: "Fair Isaac",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "百融云创｜百融｜Bairong（风控服务方·CN）",
    brands: "百融云创 / Bairong",
    countries: "中国；服务机构客户为主",
    languages: "中文/英语",
    licenses: "风控/反欺诈/智能决策与AI Agent技术服务（非放贷）",
    timing: "2014成立；2021港交所上市",
    regulators: "—",
    traffic: "B端API/RaaS",
    volume: "服务机构客户8000+（公开口径）",
    users: "金融机构及泛行业机构客户",
    diandian: "公开信息/投资者关系",
    note: "授信评分与反欺诈、智能风控中台；港股 6608.HK；生态角色·风控服务方",
    institutionTypes: ["风控服务方"],
    verify: "仅监管",
    licenseReg: "技术服务；各国合规以客户落地为准",
    trafficRank: "B端·评分/反欺诈",
    equity: "HKEX: 6608.HK",
    controller: "百融云创（Bairong Inc.）",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "头部",
    group: "ADVANCE.AI｜Advance AI｜Advance Intelligence（风控服务方·SG）",
    brands: "ADVANCE.AI",
    countries: "新加坡总部；东南亚/南亚/大中华等",
    languages: "英语/多本地语",
    licenses: "数字身份核验/KYC·KYB、反欺诈、风险管理SaaS（非放贷）",
    timing: "2016新加坡成立",
    regulators: "—",
    traffic: "B端SaaS/Open API",
    volume: "企业客户500+（公开口径）",
    users: "银行/金融科技/支付/电商等机构客户",
    diandian: "公开信息",
    note: "eKYC 与反欺诈/风控决策；出海信贷栈常见；归风控服务方",
    institutionTypes: ["风控服务方"],
    verify: "仅流量",
    licenseReg: "技术服务；各国合规以客户落地为准",
    trafficRank: "B端·KYC/反欺诈",
    equity: "私营（集团融资轮次公开）",
    controller: "Advance Intelligence Group",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "数美科技｜数美｜Shumei（风控服务方·CN）",
    brands: "数美科技",
    countries: "中国及出海客户",
    languages: "中文/英语",
    licenses: "内容安全/反欺诈/风控技术服务（非放贷）",
    timing: "运营中",
    regulators: "—",
    traffic: "B端SDK/API",
    volume: "—",
    users: "金融机构/互联网客户",
    diandian: "公开信息",
    note: "反欺诈与内容风控；生态角色·风控服务方",
    institutionTypes: ["风控服务方"],
    verify: "仅流量",
    licenseReg: "技术服务",
    trafficRank: "B端·反欺诈",
    controller: "数美科技",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Sift｜Sift｜Sift（风控服务方·US）",
    brands: "Sift",
    countries: "美国/全球机构客户",
    languages: "英语",
    licenses: "数字信任/反欺诈平台（B 端）",
    timing: "运营中",
    regulators: "—",
    traffic: "B端SaaS",
    volume: "—",
    users: "电商/金融等机构",
    diandian: "公开信息",
    note: "交易与账户反欺诈；归风控服务方，非 To C 场景",
    institutionTypes: ["风控服务方"],
    verify: "仅流量",
    licenseReg: "技术服务",
    trafficRank: "B端·反欺诈",
    controller: "Sift",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Forter｜Forter｜Forter（风控服务方·US）",
    brands: "Forter",
    countries: "美国/全球机构客户",
    languages: "英语",
    licenses: "电商欺诈决策（B 端）",
    timing: "运营中",
    regulators: "—",
    traffic: "B端SaaS",
    volume: "—",
    users: "电商/支付机构",
    diandian: "公开信息",
    note: "支付与电商反欺诈决策；生态角色·风控服务方",
    institutionTypes: ["风控服务方"],
    verify: "仅流量",
    licenseReg: "技术服务",
    trafficRank: "B端·反欺诈",
    controller: "Forter",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "SHIELD｜SHIELD｜SHIELD（风控服务方·SEA）",
    brands: "SHIELD",
    countries: "东南亚等",
    languages: "英语",
    licenses: "设备指纹/反欺诈（B 端）",
    timing: "运营中",
    regulators: "—",
    traffic: "B端SDK/API",
    volume: "—",
    users: "金融/出行等机构",
    diandian: "公开信息",
    note: "设备与账号反欺诈；归风控服务方",
    institutionTypes: ["风控服务方"],
    verify: "仅流量",
    licenseReg: "技术服务",
    trafficRank: "B端·反欺诈",
    controller: "SHIELD",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Feedzai｜Feedzai｜Feedzai（风控服务方·EU）",
    brands: "Feedzai",
    countries: "欧洲/全球机构客户",
    languages: "英语",
    licenses: "金融犯罪/反欺诈 AI（B 端）",
    timing: "运营中",
    regulators: "—",
    traffic: "B端平台",
    volume: "—",
    users: "银行/支付机构",
    diandian: "公开信息",
    note: "金融犯罪与交易反欺诈；生态角色·风控服务方",
    institutionTypes: ["风控服务方"],
    verify: "仅流量",
    licenseReg: "技术服务",
    trafficRank: "B端·反欺诈",
    controller: "Feedzai",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "微众科技｜微众科技香港｜WeBank Tech（风控服务方·HK）",
    brands: "微众科技 / WeBank Technology",
    countries: "中国香港；对外输出金融科技能力",
    languages: "中文/英语",
    licenses: "金融科技/风控与数字化能力输出（非本地吸储银行展业主体）",
    timing: "微众银行关联科技输出臂",
    regulators: "—",
    traffic: "B端科技输出/合作",
    volume: "—",
    users: "金融机构及合作伙伴",
    diandian: "公开信息",
    note: "微众银行科技能力对外输出常用「微众科技/香港」口径；与微众银行持牌银行主体区分",
    institutionTypes: ["风控服务方"],
    verify: "待双端",
    licenseReg: "技术服务主体；银行牌照在微众银行等持牌实体",
    trafficRank: "B端",
    equity: "微众银行关联",
    controller: "微众银行/腾讯系关联生态（公开叙事）",
  },
  // —— 回收机构 ——
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "东方资产｜东方资产｜东方资产（回收机构·CN）",
    brands: "中国东方资产管理",
    countries: "中国",
    languages: "中文",
    licenses: "资产管理公司（不良/回收对照）",
    timing: "持续",
    regulators: "金融监管总局等",
    traffic: "对公资产",
    volume: "—",
    users: "—",
    diandian: "公开信息",
    note: "公开信息建档·回收/不良资产对照",
    institutionTypes: ["回收机构"],
    verify: "仅监管",
    licenseReg: "CN：AMC",
    trafficRank: "非C端借贷榜",
    controller: "中国东方资产管理股份有限公司",
  },
  {
    region: "se-asia",
    line: "agent",
    tier: "腰部",
    group: "Collectius｜Collectius｜Collectius（回收机构·SEA）",
    brands: "Collectius",
    countries: "东南亚",
    languages: "英语",
    licenses: "债收/资产管理服务（公开叙事）",
    timing: "运营中",
    regulators: "分国",
    traffic: "B端委外",
    volume: "—",
    users: "机构委托",
    diandian: "公开信息",
    note: "公开信息建档",
    institutionTypes: ["回收机构"],
    verify: "仅流量",
    licenseReg: "分国债收合规待核",
    trafficRank: "B端",
    controller: "Collectius",
  },
  // —— 权益服务商 ——
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "樊登读书合作权益包｜樊登｜樊登（权益服务商·CN）",
    brands: "权益包/会员（对照样本）",
    countries: "中国",
    languages: "中文",
    licenses: "内容/会员权益供给（非放贷）",
    timing: "常见搭售",
    regulators: "—",
    traffic: "信贷App权益中心",
    volume: "—",
    users: "借款人侧权益",
    diandian: "公开业态",
    note: "公开业态对照·信贷搭售权益",
    institutionTypes: ["权益服务商"],
    verify: "待双端",
    licenseReg: "非金融放贷牌",
    trafficRank: "随宿主App",
    controller: "待核实（权益供给方多样）",
  },
  {
    region: "west",
    line: "agent",
    tier: "腰部",
    group: "Loyalty｜Points｜Loyalty（权益服务商·US）",
    brands: "积分/返现权益平台（对照）",
    countries: "美国等",
    languages: "英语",
    licenses: "营销权益",
    timing: "常见",
    regulators: "—",
    traffic: "发卡/贷款产品搭售",
    volume: "—",
    users: "C端",
    diandian: "公开业态",
    note: "公开业态对照样本",
    institutionTypes: ["权益服务商"],
    verify: "待双端",
    licenseReg: "非放贷",
    trafficRank: "—",
    controller: "待核实",
  },
  // —— 触达服务机构 ——
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Twilio｜Twilio｜Twilio（触达服务机构·US）",
    brands: "Twilio",
    countries: "全球",
    languages: "英语",
    licenses: "通讯云（短信/语音等）",
    timing: "上市",
    regulators: "各国通讯合规",
    traffic: "API",
    volume: "公开财报",
    users: "企业客户",
    diandian: "公开信息",
    note: "公开信息建档·信贷触达常用基础设施",
    institutionTypes: ["触达服务机构"],
    verify: "仅监管",
    licenseReg: "通讯服务商",
    trafficRank: "B端",
    equity: "NYSE: TWLO",
    controller: "Twilio Inc.",
  },
  {
    region: "mena",
    line: "agent",
    tier: "腰部",
    group: "Central Bank of Bahrain｜CBB｜巴林央行（监管·BH）",
    brands: "CBB",
    countries: "巴林",
    languages: "阿/英",
    licenses: "央行/银行与金融公司监管（对照）",
    timing: "持续",
    regulators: "CBB",
    traffic: "https://www.cbb.gov.bh/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "BH：CBB",
    trafficRank: "无商店榜口径",
    controller: "CBB",
  },
  {
    region: "mena",
    line: "agent",
    tier: "腰部",
    group: "Qatar Central Bank｜QCB｜卡塔尔央行（监管·QA）",
    brands: "QCB",
    countries: "卡塔尔",
    languages: "阿/英",
    licenses: "央行/银行与金融监管（对照）",
    timing: "持续",
    regulators: "QCB",
    traffic: "https://www.qcb.gov.qa/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "QA：QCB",
    trafficRank: "无商店榜口径",
    controller: "QCB",
  },
  {
    region: "mena",
    line: "agent",
    tier: "腰部",
    group: "Central Bank of Kuwait｜CBK｜科威特央行（监管·KW）",
    brands: "CBK Kuwait",
    countries: "科威特",
    languages: "阿/英",
    licenses: "央行/银行监管（对照）",
    timing: "持续",
    regulators: "CBK",
    traffic: "https://www.cbk.gov.kw/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照；与肯尼亚 CBK 缩写同形，以国别区分",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "KW：Central Bank of Kuwait",
    trafficRank: "无商店榜口径",
    controller: "Central Bank of Kuwait",
  },
  {
    region: "mena",
    line: "agent",
    tier: "腰部",
    group: "Central Bank of Oman｜CBO｜阿曼央行（监管·OM）",
    brands: "CBO",
    countries: "阿曼",
    languages: "阿/英",
    licenses: "央行/银行监管（对照）",
    timing: "持续",
    regulators: "CBO",
    traffic: "https://cbo.gov.om/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "OM：CBO",
    trafficRank: "无商店榜口径",
    controller: "CBO",
  },
  {
    region: "mena",
    line: "agent",
    tier: "腰部",
    group: "Bank Al-Maghrib｜BAM｜摩洛哥央行（监管·MA）",
    brands: "Bank Al-Maghrib",
    countries: "摩洛哥",
    languages: "阿/法/英",
    licenses: "央行/信贷机构监管（对照）",
    timing: "持续",
    regulators: "BAM",
    traffic: "https://www.bkam.ma/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "MA：Bank Al-Maghrib",
    trafficRank: "无商店榜口径",
    controller: "Bank Al-Maghrib",
  },
  {
    region: "mena",
    line: "agent",
    tier: "腰部",
    group: "Central Bank of Jordan｜CBJ｜约旦央行（监管·JO）",
    brands: "CBJ",
    countries: "约旦",
    languages: "阿/英",
    licenses: "央行/银行监管（对照）",
    timing: "持续",
    regulators: "CBJ",
    traffic: "https://www.cbj.gov.jo/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "JO：CBJ",
    trafficRank: "无商店榜口径",
    controller: "CBJ",
  },
  {
    region: "africa",
    line: "agent",
    tier: "腰部",
    group: "Bank of Tanzania｜BoT｜坦桑尼亚央行（监管·TZ）",
    brands: "BoT",
    countries: "坦桑尼亚",
    languages: "斯瓦希里/英语",
    licenses: "央行/微金融与支付（对照）",
    timing: "持续",
    regulators: "BoT",
    traffic: "https://www.bot.go.tz/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "TZ：BoT",
    trafficRank: "无商店榜口径",
    controller: "BoT",
  },
  {
    region: "africa",
    line: "agent",
    tier: "腰部",
    group: "Bank of Uganda｜BoU｜乌干达央行（监管·UG）",
    brands: "BoU",
    countries: "乌干达",
    languages: "英语",
    licenses: "央行/微金融与支付（对照）",
    timing: "持续",
    regulators: "BoU",
    traffic: "https://www.bou.or.ug/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "UG：BoU",
    trafficRank: "无商店榜口径",
    controller: "BoU",
  },
  {
    region: "africa",
    line: "agent",
    tier: "腰部",
    group: "National Bank of Rwanda｜BNR｜卢旺达央行（监管·RW）",
    brands: "BNR",
    countries: "卢旺达",
    languages: "英/法/卢旺达语",
    licenses: "央行/支付与银行（对照）",
    timing: "持续",
    regulators: "BNR",
    traffic: "https://www.bnr.rw/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "RW：BNR",
    trafficRank: "无商店榜口径",
    controller: "BNR",
  },
  {
    region: "africa",
    line: "agent",
    tier: "腰部",
    group: "National Bank of Ethiopia｜NBE｜埃塞俄比亚央行（监管·ET）",
    brands: "NBE",
    countries: "埃塞俄比亚",
    languages: "阿姆哈拉语/英语",
    licenses: "央行/银行与支付（对照）",
    timing: "持续",
    regulators: "NBE",
    traffic: "https://nbe.gov.et/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "公开对照",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "ET：NBE",
    trafficRank: "无商店榜口径",
    controller: "NBE",
  },
  {
    region: "africa",
    line: "agent",
    tier: "腰部",
    group: "Banque Centrale des États de l'Afrique de l'Ouest｜BCEAO｜西非央行（监管·CI）",
    brands: "BCEAO",
    countries: "科特迪瓦等西非经货联盟",
    languages: "法语",
    licenses: "区域央行/银行与支付（对照）",
    timing: "持续",
    regulators: "BCEAO",
    traffic: "https://www.bceao.int/",
    volume: "—",
    users: "—",
    diandian: "监管源",
    note: "覆盖 CI/SN/BJ/BF/ML 等 WAEMU；国别筛选以 CI 等为代表",
    institutionTypes: ["监管"],
    verify: "仅监管",
    licenseReg: "CI/WAEMU：BCEAO",
    trafficRank: "无商店榜口径",
    controller: "BCEAO",
  },
  {
    region: "africa",
    line: "agent",
    tier: "腰部",
    group: "Infobip｜Infobip｜Infobip（触达服务机构·全球）",
    brands: "Infobip",
    countries: "全球/新兴市场",
    languages: "英语",
    licenses: "CPaaS 触达",
    timing: "运营中",
    regulators: "各国",
    traffic: "API/WhatsApp等",
    volume: "—",
    users: "企业",
    diandian: "公开信息",
    note: "公开信息建档",
    institutionTypes: ["触达服务机构"],
    verify: "仅流量",
    licenseReg: "CPaaS",
    trafficRank: "B端",
    controller: "Infobip",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "梦网科技｜梦网｜梦网（触达服务机构·CN）",
    brands: "梦网",
    countries: "中国",
    languages: "中文",
    licenses: "短信等触达服务",
    timing: "上市口径",
    regulators: "工信相关",
    traffic: "企业短信",
    volume: "—",
    users: "企业",
    diandian: "公开信息",
    note: "公开信息建档·国内触达",
    institutionTypes: ["触达服务机构"],
    verify: "仅监管",
    licenseReg: "短信服务",
    trafficRank: "B端",
    controller: "梦网科技",
  },
  // —— 公关服务机构 ——
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Edelman｜Edelman｜Edelman（公关服务机构·US）",
    brands: "Edelman",
    countries: "全球",
    languages: "英语等",
    licenses: "公关咨询",
    timing: "运营中",
    regulators: "—",
    traffic: "B端顾问",
    volume: "—",
    users: "企业",
    diandian: "公开信息",
    note: "公开信息建档·金融品牌/危机公关常见服务方",
    institutionTypes: ["公关服务机构"],
    verify: "仅流量",
    licenseReg: "非金融牌照",
    trafficRank: "B端",
    controller: "Edelman",
  },
  // —— 信托服务机构 ——
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "中信信托｜中信信托｜中信（信托服务机构·CN）",
    brands: "中信信托",
    countries: "中国",
    languages: "中文",
    licenses: "信托牌照",
    timing: "运营中",
    regulators: "国家金融监督管理总局等",
    traffic: "机构/高净值",
    volume: "—",
    users: "机构与合格投资者",
    diandian: "公开信息",
    note: "公开信息建档·信托/ABS受托对照",
    institutionTypes: ["信托服务机构"],
    verify: "仅监管",
    licenseReg: "信托公司",
    trafficRank: "B端",
    controller: "中信集团相关",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "平安信托｜平安信托｜平安（信托服务机构·CN）",
    brands: "平安信托",
    countries: "中国",
    languages: "中文",
    licenses: "信托牌照",
    timing: "运营中",
    regulators: "国家金融监督管理总局等",
    traffic: "机构",
    volume: "—",
    users: "机构与合格投资者",
    diandian: "公开信息",
    note: "公开信息建档",
    institutionTypes: ["信托服务机构"],
    verify: "仅监管",
    licenseReg: "信托公司",
    trafficRank: "B端",
    controller: "中国平安",
  },
  // —— 会计师事务所 ——
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "PwC｜普华永道｜PwC（会计师事务所·全球）",
    brands: "普华永道",
    countries: "全球",
    languages: "英语等",
    licenses: "审计/咨询执业",
    timing: "运营中",
    regulators: "各国会计监管",
    traffic: "B端",
    volume: "—",
    users: "企业",
    diandian: "公开信息",
    note: "公开信息建档·审计与财务尽调对照",
    institutionTypes: ["会计师事务所"],
    verify: "仅监管",
    licenseReg: "会计师事务所",
    trafficRank: "B端",
    controller: "PwC network",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "立信会计师事务所｜立信｜立信（会计师事务所·CN）",
    brands: "立信",
    countries: "中国",
    languages: "中文",
    licenses: "审计执业",
    timing: "运营中",
    regulators: "财政部/中注协等",
    traffic: "B端",
    volume: "—",
    users: "企业",
    diandian: "公开信息",
    note: "公开信息建档·国内审计对照",
    institutionTypes: ["会计师事务所"],
    verify: "仅监管",
    licenseReg: "会计师事务所",
    trafficRank: "B端",
    controller: "立信",
  },
  // —— 律师事务所 ——
  {
    region: "east-asia",
    line: "agent",
    tier: "头部",
    group: "金杜律师事务所｜金杜｜金杜（律师事务所·CN）",
    brands: "金杜",
    countries: "中国/跨境",
    languages: "中文/英语",
    licenses: "律师执业",
    timing: "运营中",
    regulators: "司法行政/律协",
    traffic: "B端",
    volume: "—",
    users: "企业",
    diandian: "公开信息",
    note: "公开信息建档·金融法务/合规对照",
    institutionTypes: ["律师事务所"],
    verify: "仅监管",
    licenseReg: "律师事务所",
    trafficRank: "B端",
    controller: "金杜",
  },
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Clifford Chance｜高伟绅｜Clifford Chance（律师事务所·全球）",
    brands: "Clifford Chance",
    countries: "全球",
    languages: "英语等",
    licenses: "律师执业",
    timing: "运营中",
    regulators: "各国律协",
    traffic: "B端",
    volume: "—",
    users: "企业",
    diandian: "公开信息",
    note: "公开信息建档·跨境金融法务对照",
    institutionTypes: ["律师事务所"],
    verify: "仅监管",
    licenseReg: "律师事务所",
    trafficRank: "B端",
    controller: "Clifford Chance",
  },
  // —— 评级机构 ——
  {
    region: "west",
    line: "agent",
    tier: "头部",
    group: "Moody's｜穆迪｜Moody's（评级机构·US）",
    brands: "Moody's",
    countries: "全球",
    languages: "英语",
    licenses: "信用评级机构",
    timing: "上市",
    regulators: "SEC等",
    traffic: "机构订阅",
    volume: "—",
    users: "机构投资者",
    diandian: "公开信息",
    note: "公开信息建档·主体/债项评级对照",
    institutionTypes: ["评级机构"],
    verify: "仅监管",
    licenseReg: "NRSRO等",
    trafficRank: "B端",
    equity: "NYSE: MCO",
    controller: "Moody's Corporation",
  },
  {
    region: "east-asia",
    line: "agent",
    tier: "腰部",
    group: "中诚信｜中诚信｜中诚信（评级机构·CN）",
    brands: "中诚信",
    countries: "中国",
    languages: "中文",
    licenses: "信用评级",
    timing: "运营中",
    regulators: "中国人民银行等",
    traffic: "机构",
    volume: "—",
    users: "机构",
    diandian: "公开信息",
    note: "公开信息建档·国内评级对照",
    institutionTypes: ["评级机构"],
    verify: "仅监管",
    licenseReg: "信用评级机构",
    trafficRank: "B端",
    controller: "中诚信",
  },
];

const credits: CreditRow[] = dedupeCreditRows(
  [
    ...creditsCore,
    ...expandCreditSeeds(creditCrmSeeds, "crm"),
    ...expandCreditSeeds(luffyCreditSeeds, "luffy"),
    ...ecoInstitutionSeeds,
  ].map(finalizeCredit),
);

type VerifyFilter = "all" | VerifyStatus; // 仅用于信源核实展示态，不作筛选标签

function verifyTone(v: VerifyStatus): "success" | "warning" | "info" | "deleted" | "neutral" {
  if (v === "双端通过") return "success";
  if (v === "冲突观察") return "deleted";
  if (v === "仅流量" || v === "仅监管") return "warning";
  if (v === "待双端") return "neutral";
  return "info";
}

function filterScenes(
  region: Region,
  country: CountryCode,
  sceneTag: SceneTag | "all",
  sceneSub: SceneSubTag | "all",
  licenseKind: LicenseKind | "all",
): SceneRow[] {
  return scenes.filter((r) => {
    if (region !== "all" && r.region !== region) return false;
    if (!matchesCountry(r.group, r.countries, country)) return false;
    if (sceneTag !== "all" && !r.tags.includes(sceneTag)) return false;
    if (sceneSub !== "all" && !r.subTags.includes(sceneSub)) return false;
    if (licenseKind !== "all" && !r.licenseKinds.includes(licenseKind)) return false;
    return true;
  });
}

function filterCredits(
  region: Region,
  country: CountryCode,
  creditL1: CreditProdL1,
  creditL2: CreditProdL2,
  creditL3: CreditProdL3,
  sceneTag: SceneTag | "all",
  licenseKind: LicenseKind | "all",
): CreditRow[] {
  return credits.filter((r) => {
    if (region !== "all" && r.region !== region) return false;
    if (!matchesCountry(r.group, r.countries, country)) return false;
    if (!matchesCreditProductTree(r, creditL1, creditL2, creditL3)) return false;
    // 信贷原生玩家也可按「涉足场景」筛：目前多数无场景标签，仅信用管理横切可命中（映射信贷「信用卡」标签）
    if (sceneTag !== "all") {
      if (sceneTag === "信用管理") {
        if (!r.tags.includes("信用卡")) return false;
      } else {
        return false;
      }
    }
    if (licenseKind !== "all" && !r.licenseKinds.includes(licenseKind)) return false;
    return true;
  });
}

/** 关键词检索：空格分词全命中；统一中文拼音首字母模糊（smy→萨摩耶、kn→快牛）+ 品牌别名 */
const BRAND_SEARCH_ALIASES: Record<string, string[]> = {
  快牛: ["kn", "kuaniu", "kua niu", "mexicash"],
  萨摩耶: ["smy", "samoye", "sa mo ye"],
  奇富: ["qf", "qfin", "360数科"],
  乐信: ["lx", "lexin", "fortaprest"],
  信也: ["xy", "finvolution", "ppdai", "拍拍贷"],
  马上: ["ms", "msxf"],
  度小满: ["dxm"],
  蚂蚁: ["my", "ant", "alipay"],
  美团: ["mt", "meituan"],
  京东: ["jd"],
  滴滴: ["dd", "didi"],
  易鑫: ["yx", "yixin"],
  爱租机: ["azj"],
  人人租: ["rrz"],
  招联: ["zl"],
  数禾: ["sh", "还呗", "hb"],
  中科金: ["zkj"],
};

/** 压缩表：汉字+首字母交替；覆盖本图谱全部用字 */
const CJK_PINYIN_PACK =
  "一y丁d七q万w三s上s下x不b与y专z且q世s业y东d两l严y个g中z串c为w主z丽l举j久j么m义y之z乌w乎h乐l也y习x书s买m了l争z事s二e于y云y互h五w亚y交j亦y产c享x京j亲q人r亿y仅j今j介j仍r从c仓c他t付f代d以y件j价j任r份f仿f企q伊y众z优y伙h会h伟w传c伦l估g伴b伽g但d位w低d住z体t余y作z你n佳j使s例l供g依y侧c侨q便b俗s保b信x借j债z值z偏p做z停t健j储c催c像x僧s元y充c先x光g克k免m兑d入r全q公g六l兰l共g关g兴x其q具j典d兹z兼j内n册c再z冒m写x农n冲c决j况k净j准z凭p出c击j刀d分f切q划h列l则z创c初c判p利l别b到d制z券q前q剩s力l办b功g加j务w动d助z励l劳l势s募m勿w包b化h北b匹p区q医y十s千q升s半b华h协x单d卖m南n占z卡k卢l印y危w即j厅t历l压y原y去q参c叉c及j双s反f发f取q受s变b叙x叠d口k古g另l只z叫j叮d可k台t史s右y叶y号h司s吃c各g合h吉j吊d同t名m后h向x否f吧b含h听t启q吴w吸x告g呗b员y呢n呼h命m和h咚d咨z品p哈h哥g售s唯w商s啰l善s喜x嗒d嘀d嘉j器q四s回h因y团t园y固g国g图t土t在z地d场c均j坊f块k坛t坡p坦t垂c垄l型x埃a城c域y培p基j堂t塔t填t境j增z墨m士s壳k壹y处c备b复f外w多d大d天t太t央y头t夹j奇q奈n契q奖j套t好h如r始s委w威w娱y婚h媒m子z字z存c孟m季j学x宁n宇y安a完w宏h官g宙z定d宜y宝b实s审s客k宣x家j容r宽k宾b宿s密m富f察c寡g对d寺s导d寿s射s将j小x少s尔e尚s尼n尽j尾w局j层c居j屋w展z属s山s岳y岸a峰f崩b嵌q州z工g巨j巩g已y巴b币b市s布b师s希x帐z带d席x帮b常c幅f干g平p年n并b幻h广g序x库k应y店d府f度d康k廊l廷t建j开k异y式s引y张z弱r强q归g当d录l形x影y征z径j待d律l得d循x微w德d心x必b快k忽h态t思s性x总z恋l恒h息x悦y情q想x意y慎s慢m戏x成c我w或h战z截j户h房f所s手s打d托t执z扩k批p找z承c技j把b投t抖d抗k折z护h报b披p抵d押y担d拆c拉l拍p拓t招z拟n择z括k拼p拿n持c挂g指z按a挑t挖w换h据j捷j授s掉d排p探t接j控k推t描m提t揭j搜s搭d携x摘z摩m播b撮c操c支z收s改g放f政z教j数s整z文w斗d料l断d斯s新x方f施s旅l旗q无w既j日r旦d旧j早z时s旺w明m易y星x映y是s显x普p景j晰x智z暂z暴b更g曹c曼m曾c替t最z月y有y服f期q木m未w末m本b术s朴p机j权q杆g材c村c杜d束s杠g条t来l板b极j构g析x林l枚m果g枝z架j某m查c标b栈z栏l树s校x样y核h根g格g框k案a桑s桔j档d桥q梦m梯t检j榜b樊f模m横h次c欧o欺q款k止z正z此c段d母m比b民m水s永y求q汇h汉h池c汽q沃w沙s法f泛f泡p波b注z泰t洁j洋y洲z活h派p流l测c济j浏l海h消x涉s润r涨z淆x淘t深s混h添t清q渠q港g游y湖h湾w溃k源y溢y滑h满m滤l滴d漏l演y澳a灣w火h灰h灼z点d然r照z熟s爱a片p版b牌p牙y牛n物w特t状z独d狮s猪z猫m猿y率l王w玛m玩w环h现x珍z班b球q理l瑞r瓣b瓦w瓴l生s用y由y甲j申s电d画h留l略l疆j疑y疗l病b登d白b百b的d益y盐y监j盒h盖g盘p盟m目m直z相x盾d看k真z眼y着z督d知z矩j短d石s矿k码m研y础c硬y确q碑b示s礼l社s神s票p禁j禄l离l禾h私s种z科k秘m租z积j称c移y稀x程c税s稳w稿g穆m空k穿c突t立l站z竞j端d笔b第d等d策c筛s签q简j算s管g米m类l粉f粗c粘z精j糖t系x素s索s累l红h约y级j纪j纯c纳n线x练l组z绅s细x经j结j给g络l绝j统t继j续x维w综z缓h编b缘y缩s缺q罐g网w罗l置z署s美m群q耀y考k者z而e耕g耳e耶y聆l职z联l聚j股g肯k育y胀z背b能n脉m脏z腰y腾t臂b自z至z航h般b良l色s艺y节j芝z花h苏s若r英y苹p范f草c荐j荔l荣r药y荷h莱l获h菜c菱l菲f萄t营y萨s落l葡p蒙m蓄x蓝l藏c虎h虚x蚁y蚂m蜂f融r行h衍y补b表b衰s被b装z西x要y覆f见j观g规g视s览l角j解j触c言y話h计j订d认r训x议y讯x记j许x论l设s证z评p识s诈z诉s诊z词c译y试s诚c询x详x语y误w说s请q读d课k调d谈t谱p豆d贝b负f财c责z账z货h质z贬b购g贴t贷d贸m费f赁l资z赋f赏s赚z赛s赢y赤c走z赶g起q超c越y趣q足z跃y跌d跑p跟g跨k路l跳t身s车c转z轮l软r轻q载z辅f辆l辑j输s达d迁q过g运y近j返f还h进j违w连l迪d述s追z退t送s适s逆n选x逊x逐z途t通t速s逻l逼b道d遭z避b邦b邮y邻l部b都d酋q配p酒j酷k采c里l重z量l金j鑫x钉d钥y钱q银y铺p链l销x锁s锋f锚m锥z键j长z门m闪s闭b问w闲x间j闻w阅y队d阳y阵z阿a附f际j陆l陌m降j限x院y除c险x陪p随s隐y隶l雄x雅y集j零l需x露l青q静j非f靠k韩h音y页y顶d项x顺s须x顾g预y领l频p额e风f飞f餐c饮y饱b饿e首s香x马m驱q驾j验y高g魔m鱼y鲁l鲜x鸟n鹅e麦m麻m黑h默m齐q龙l龥y";

const CJK_PINYIN_INITIAL: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (let i = 0; i < CJK_PINYIN_PACK.length; i += 2) {
    m[CJK_PINYIN_PACK[i]] = CJK_PINYIN_PACK[i + 1];
  }
  return m;
})();

function cjkInitials(text: string): string {
  let out = "";
  for (const ch of text) {
    if (/[a-zA-Z0-9]/.test(ch)) {
      out += ch.toLowerCase();
      continue;
    }
    const ini = CJK_PINYIN_INITIAL[ch];
    if (ini) out += ini;
  }
  return out;
}

function extractSearchableCnRuns(blob: string): string[] {
  const out: string[] = [];
  for (const seg of blob.match(/[\u4e00-\u9fff][\u4e00-\u9fffa-zA-Z0-9]{0,15}/g) ?? []) {
    if (/[\u4e00-\u9fff]/.test(seg)) out.push(seg);
  }
  return out;
}

function extractCnBrandTokens(...fields: (string | undefined | null)[]): string[] {
  const blob = fields.filter(Boolean).join("\n");
  const out: string[] = [];
  const parenRe = /[（(]([^）)]+)[）)]/g;
  let m: RegExpExecArray | null;
  while ((m = parenRe.exec(blob)) !== null) {
    const head = m[1].split(/[·・/|/]/)[0].trim();
    if (/[\u4e00-\u9fff]/.test(head)) out.push(head);
  }
  for (const brand of Object.keys(BRAND_SEARCH_ALIASES)) {
    if (blob.includes(brand)) out.push(brand);
  }
  out.push(...extractSearchableCnRuns(blob));
  return [...new Set(out.filter((x) => x.length >= 2))];
}

function buildSearchHaystack(...fields: (string | undefined | null)[]): string {
  const base = fields.filter(Boolean).join("\n").toLowerCase();
  const extras: string[] = [];
  const initials: string[] = [];
  for (const brand of extractCnBrandTokens(...fields)) {
    extras.push(brand.toLowerCase());
    const ini = cjkInitials(brand);
    if (ini.length >= 2) {
      extras.push(ini);
      initials.push(ini);
    }
    const aliases = BRAND_SEARCH_ALIASES[brand];
    if (aliases) extras.push(...aliases.map((a) => a.toLowerCase()));
  }
  for (const w of base.match(/[a-z][a-z0-9._-]{1,24}/g) ?? []) extras.push(w);
  extras.push(`__ini__:${initials.join("|")}`);
  return `${base}\n${extras.join("\n")}`;
}

function matchesKeyword(q: string, ...fields: (string | undefined | null)[]): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const tokens = needle.split(/\s+/).filter(Boolean);
  const hay = buildSearchHaystack(...fields);
  const iniBag = (hay.match(/__ini__:(.*)/)?.[1] ?? "").split("|").filter(Boolean);
  return tokens.every((t) => {
    if (hay.includes(t)) return true;
    // 纯字母：按拼音首字母全等或前缀（smy / sm → 萨摩耶）
    if (/^[a-z]{1,12}$/.test(t)) {
      return iniBag.some((ini) => ini === t || ini.startsWith(t));
    }
    return false;
  });
}

function sceneMatchesKeyword(r: SceneRow, q: string): boolean {
  return matchesKeyword(
    q,
    r.group,
    r.apps,
    r.sceneType,
    r.licenseReg,
    r.equity,
    r.controller,
    r.trafficRank,
    r.countries,
    r.creditAttach,
    r.diandian,
    ...r.tags,
  );
}

function creditMatchesKeyword(r: CreditRow, q: string): boolean {
  return matchesKeyword(
    q,
    r.group,
    r.brands,
    r.licenses,
    r.licenseReg,
    r.note,
    r.equity,
    r.controller,
    r.diandian,
    r.volume,
    r.regulators,
    r.countries,
    r.line,
    ...r.tags,
    ...r.institutionTypes.map((t) => INSTITUTION_TYPE_LABEL[t]),
  );
}

/** 创设玩家导入附件（Cursor 式 Composer 附件条） */
type ComposerAttach = {
  id: string;
  kind: "link" | "doc" | "image" | "text";
  label: string;
};

function looksLikeCreatePlayerIntent(text: string): boolean {
  return /创设|创建|新建|录入|建档|添加玩家|新增玩家|想要创设/.test(text.trim());
}

function extractCreatedPlayerName(text: string): string {
  const t = text.trim();
  const patterns = [
    /[-—–]\s*([^\s，,。；;（(/]{2,40})/,
    /(?:叫|名为|名称[是为]?)\s*([^\s，,。；;（(]{2,40})/,
    /公司[：:\s]*([^\s，,。；;（(]{2,40})/,
    /(?:创设|创建|新建|录入|建档)[^，,]{0,24}?([一-龥A-Za-z0-9·]{2,24}(?:集团|公司|科技|控股|金服|金融)?)/,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m?.[1]) {
      let name = m[1].replace(/[的了呢吧]$/u, "").trim();
      name = name.replace(/^(一个|一家|一名)/, "");
      if (name.length >= 2 && !/融资租赁|汽车金融|上市公司|持有/.test(name)) return name;
    }
  }
  return "";
}

function draftFromComposerCreate(
  text: string,
  attachments: ComposerAttach[],
): CreditDraft | null {
  if (!looksLikeCreatePlayerIntent(text)) return null;
  const name = extractCreatedPlayerName(text);
  if (!name) return null;

  const blob = `${text} ${attachments.map((a) => a.label).join(" ")}`;
  const inChina = /中国|CN\b|内地/.test(blob);
  const region: Exclude<Region, "all"> = inChina
    ? "east-asia"
    : /印尼|东南亚|菲律宾|越南|马来|泰国|新加坡/.test(blob)
      ? "se-asia"
      : /印度/.test(blob)
        ? "south-asia"
        : /巴西|墨西哥|拉美/.test(blob)
          ? "latam"
          : "east-asia";
  const countries = inChina
    ? "中国"
    : /印尼|印度尼西亚/.test(blob)
      ? "印度尼西亚"
      : "待核实";
  const line: CreditRow["line"] = /融资租赁|信用租赁|租机|汽车金融|车贷|租赁/.test(blob)
    ? "lease"
    : /分期|BNPL|消费贷/.test(blob)
      ? "bnpl"
      : /超市|导流|助贷平台/.test(blob)
        ? "agent"
        : "cash";
  const listed = /上市|HKEX|港股|A股|NYSE|NASDAQ|股票/.test(blob);
  const leaseLic = /融资租赁/.test(blob);
  const short = name.replace(/(集团|公司|控股)$/u, "") || name;
  const group = `${name}/${short}（${short}·${inChina ? "CN" : "XX"}）`;
  const attNote = attachments.length
    ? `；附件：${attachments.map((a) => `${a.kind}:${a.label}`).join(" | ")}`
    : "";

  return {
    region,
    line,
    tier: "腰部",
    group,
    brands: short,
    countries,
    languages: inChina ? "中文" : "待核实",
    licenses: leaseLic ? "融资租赁牌照（录入自述）" : "牌照待核实（录入自述）",
    timing: "人工创设",
    regulators: inChina ? "地方金融监管/银保监路径待核" : "待核实",
    traffic: "待核实",
    volume: "待核实",
    users: "待核实",
    diandian: "人工创设·待双端核实",
    note: `Composer 创设：${text.trim().slice(0, 180)}${attNote}`,
    institutionTypes: ["玩家"],
    licenseReg: leaseLic
      ? `已持：融资租赁(${countries === "中国" ? "中国" : countries})`
      : "牌照：待核实",
    licenseKinds: leaseLic ? ["其他"] : [],
    equity: listed ? "上市公司（录入自述；代码待核）" : "待核实",
    controller: name,
    trafficRank: "人工创设",
    verify: "待双端",
  };
}

type SpeechRecLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onend: (() => void) | null;
};

let activeSpeechRec: SpeechRecLike | null = null;

function pickLocalFiles(
  accept: string,
  onPick: (files: { name: string; size: number }[]) => void,
): string | null {
  try {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = true;
    input.onchange = () => {
      onPick(Array.from(input.files ?? []).map((f) => ({ name: f.name, size: f.size })));
    };
    input.click();
    return null;
  } catch {
    return "无法打开文件选择器，请改用粘贴链接";
  }
}

function toggleVoiceDictation(
  onChunk: (text: string) => void,
  setListening: (v: boolean) => void,
): string | null {
  const g = globalThis as unknown as {
    SpeechRecognition?: new () => SpeechRecLike;
    webkitSpeechRecognition?: new () => SpeechRecLike;
  };
  const SR = g.SpeechRecognition ?? g.webkitSpeechRecognition;
  if (!SR) {
    setListening(false);
    return "当前环境不支持语音录入";
  }
  if (activeSpeechRec) {
    try {
      activeSpeechRec.stop();
    } catch {
      /* ignore */
    }
    activeSpeechRec = null;
    setListening(false);
    return null;
  }
  const rec = new SR();
  rec.lang = "zh-CN";
  rec.continuous = true;
  rec.interimResults = true;
  rec.onresult = (ev) => {
    const t = ev.results[ev.results.length - 1]?.[0]?.transcript?.trim();
    if (t) onChunk(t);
  };
  rec.onerror = () => {
    activeSpeechRec = null;
    setListening(false);
  };
  rec.onend = () => {
    activeSpeechRec = null;
    setListening(false);
  };
  activeSpeechRec = rec;
  setListening(true);
  try {
    rec.start();
  } catch {
    activeSpeechRec = null;
    setListening(false);
    return "无法启动麦克风";
  }
  return null;
}

/**
 * Cursor Composer 风格输入条：
 * + 附件｜主输入｜Auto(暂不可用)｜语音｜发送
 * 用于首页关键词检索，附件作为创设玩家信息导入。
 */
function CursorStyleComposer({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  /** 返回状态文案；由上层决定检索或创设 */
  onSubmit: (payload: { text: string; attachments: ComposerAttach[] }) => string;
}) {
  const theme = useHostTheme();
  const [menuOpen, setMenuOpen] = useCanvasState("cPlus1", false);
  const [linkVal, setLinkVal] = useCanvasState("cLink1", "");
  const [atts, setAtts] = useCanvasState<ComposerAttach[]>("cAtt1", []);
  const [listening, setListening] = useCanvasState("cVoice1", false);
  const [status, setStatus] = useCanvasState("cStat1", "");

  function pushAtt(kind: ComposerAttach["kind"], label: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setAtts((prev) => [{ id, kind, label }, ...prev].slice(0, 20));
  }

  const createHint = looksLikeCreatePlayerIntent(value);

  return (
    <Stack gap={8}>
      {atts.length ? (
        <Row gap={6} wrap>
          {atts.map((a) => (
            <Pill
              size="sm"
              active
              onClick={() => setAtts((prev) => prev.filter((x) => x.id !== a.id))}
            >
              {a.kind === "link"
                ? "链接"
                : a.kind === "doc"
                  ? "文档"
                  : a.kind === "image"
                    ? "图片"
                    : "文本"}
              · {a.label.length > 28 ? `${a.label.slice(0, 28)}…` : a.label} ×
            </Pill>
          ))}
        </Row>
      ) : null}

      <div
        style={mergeStyle({
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: 10,
          borderRadius: 16,
          background: theme.bg.elevated,
          border: `1px solid ${theme.stroke.tertiary}`,
          width: "100%",
          boxSizing: "border-box",
        })}
      >
        <TextInput
          value={value}
          onChange={onChange}
          placeholder="搜索机构；或写「创设…玩家名」建档（可附链接/文档/图片）"
          type="search"
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
          }}
        />

        <Row gap={6} align="center">
          <IconButton
            title="添加附件"
            variant="circle"
            size="md"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 2.5v9M2.5 7h9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </IconButton>

          <div style={{ flex: 1 }} />

          <Text size="small" tone="tertiary">
            Auto
          </Text>

          <IconButton
            title={listening ? "停止语音" : "语音录入"}
            variant="circle"
            size="md"
            onClick={() => {
              const err = toggleVoiceDictation((t) => onChange(t), setListening);
              setStatus(err ?? (listening ? "" : "聆听中…再点麦克风结束"));
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <rect
                x="5"
                y="1.5"
                width="4"
                height="7"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M3 7a4 4 0 0 0 8 0M7 11v1.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </IconButton>

          <IconButton
            title={listening ? "停止" : createHint ? "创设玩家" : "搜索"}
            variant="circle"
            size="md"
            onClick={() => {
              if (listening) {
                toggleVoiceDictation(() => {}, setListening);
                setStatus("");
                return;
              }
              const msg = onSubmit({ text: value, attachments: atts });
              setStatus(msg);
              if (looksLikeCreatePlayerIntent(value) && msg.startsWith("已创设")) {
                setAtts([]);
              }
            }}
          >
            {listening ? (
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                <rect x="2" y="2" width="6" height="6" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M3 7h7.5M7.2 3.8 10.5 7 7.2 10.2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </IconButton>
        </Row>
      </div>

      {menuOpen ? (
        <div
          style={mergeStyle({
            padding: 12,
            borderRadius: 12,
            background: theme.bg.elevated,
            border: `1px solid ${theme.stroke.tertiary}`,
          })}
        >
          <Stack gap={10}>
            <Text size="small" weight="medium">
              添加上下文 · 创设玩家导入
            </Text>
            <Text size="small" tone="secondary">
              对齐 Cursor Composer：先挂链接/文档/图片，再在输入框描述或检索。移动端可用语音。
            </Text>
            <Row gap={8} wrap>
              <div style={{ flex: 1, minWidth: 160 }}>
                <TextInput
                  value={linkVal}
                  onChange={setLinkVal}
                  placeholder="粘贴链接 https://…"
                  type="url"
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  const u = linkVal.trim();
                  if (!u) {
                    setStatus("请先粘贴链接");
                    return;
                  }
                  pushAtt("link", u);
                  setLinkVal("");
                  setStatus("已添加链接");
                }}
              >
                添加链接
              </Button>
            </Row>
            <Row gap={8} wrap>
              <Button
                variant="secondary"
                onClick={() => {
                  const err = pickLocalFiles(".pdf,.doc,.docx,.txt,.md,.csv", (files) => {
                    for (const f of files) pushAtt("doc", f.name);
                    setStatus(files.length ? `已添加 ${files.length} 个文档` : "");
                  });
                  if (err) setStatus(err);
                }}
              >
                文档
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const err = pickLocalFiles("image/*", (files) => {
                    for (const f of files) pushAtt("image", f.name);
                    setStatus(files.length ? `已添加 ${files.length} 张图片` : "");
                  });
                  if (err) setStatus(err);
                }}
              >
                图片
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (!value.trim()) {
                    setStatus("先在输入框写下线索");
                    return;
                  }
                  pushAtt("text", value.trim().slice(0, 60));
                  setStatus("已收录文本线索");
                }}
              >
                收录当前输入
              </Button>
            </Row>
          </Stack>
        </div>
      ) : null}

      {status ? (
        <Text size="small" tone="tertiary">
          {status}
        </Text>
      ) : null}
    </Stack>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="small" tone="tertiary" weight="medium">
        {label}
      </Text>
      <Text size="small">{value}</Text>
    </Stack>
  );
}

/** 可点选角标：已选且 clearable 时再点可清除 */

type WideMarket =
  | "中国"
  | "美国"
  | "东南亚"
  | "印度"
  | "拉美"
  | "中东与北非"
  | "非洲"
  | "欧洲"
  | "日韩";

const WIDE_MARKET_ORDER: WideMarket[] = [
  "中国",
  "美国",
  "东南亚",
  "印度",
  "拉美",
  "中东与北非",
  "非洲",
  "欧洲",
  "日韩",
];
const WIDE_MARKET_LABEL: Record<WideMarket, string> = Object.fromEntries(
  WIDE_MARKET_ORDER.map((m) => [m, m]),
) as Record<WideMarket, string>;

/** 全球线上数字化经营场景大宽表（代表平台参考；CRM 仍以信贷派生为准） */
const SCENE_WIDE_TABLE: { l1: SceneTag; l2: SceneSubTag; cells: Record<WideMarket, string> }[] = [
  {
    l1: "电商" as const,
    l2: "综合电商" as const,
    cells: {
      "中国": "淘宝、京东、拼多多",
      "美国": "Amazon、Walmart、Target",
      "东南亚": "Shopee、Lazada、Tokopedia",
      "印度": "Flipkart、Amazon India、Meesho",
      "拉美": "Mercado Libre、Amazon Brazil、Americanas",
      "中东与北非": "Noon、Amazon UAE、Trendyol",
      "非洲": "Jumia、Takealot",
      "欧洲": "Amazon、Zalando、Allegro",
      "日韩": "Rakuten、Yahoo Shopping",
    },
  },
  {
    l1: "电商" as const,
    l2: "垂直电商" as const,
    cells: {
      "中国": "唯品会、得物、寺库",
      "美国": "Chewy、Wayfair、Etsy",
      "东南亚": "iPrice、Sociolla、Orami",
      "印度": "Nykaa、FirstCry、Lenskart",
      "拉美": "Dafiti、Netshoes、Linio",
      "中东与北非": "Namshi、Golden Scent、Sprii",
      "非洲": "Kilimall、Jumia Fashion",
      "欧洲": "ASOS、Boohoo、About You",
      "日韩": "Zozotown、Qoo10",
    },
  },
  {
    l1: "电商" as const,
    l2: "社交电商" as const,
    cells: {
      "中国": "小红书、抖音商城、快手小店",
      "美国": "Poshmark、Depop、Whatnot",
      "东南亚": "TikTok Shop、Shopee Live、Tokopedia Mitra",
      "印度": "Meesho、GlowRoad、Shop101",
      "拉美": "Facily、Vopero、Elenas",
      "中东与北非": "The List、YallaHub、Sary",
      "非洲": "Kapu、Copia、Wasoko",
      "欧洲": "Vinted、Wallapop、Shpock",
      "日韩": "LINE Shopping、Mercari",
    },
  },
  {
    l1: "电商" as const,
    l2: "跨境电商" as const,
    cells: {
      "中国": "速卖通、SHEIN、Temu",
      "美国": "Amazon Global、eBay",
      "东南亚": "Shopee Cross-border、Lazada Global",
      "印度": "Amazon Global Store、Flipkart Wholesale",
      "拉美": "Mercado Libre International、Shopee Brazil",
      "中东与北非": "Amazon.sa、Noon、AliExpress",
      "非洲": "Jumia Global、Kilimall",
      "欧洲": "Zalando、ASOS、Cdiscount",
      "日韩": "Qoo10 Japan、Rakuten Global",
    },
  },
  {
    l1: "电商" as const,
    l2: "二手/闲置" as const,
    cells: {
      "中国": "闲鱼、转转、爱回收",
      "美国": "eBay、ThredUp、OfferUp",
      "东南亚": "Carousell、OLX（东南亚）",
      "印度": "OLX India、Cashify、Quikr",
      "拉美": "OLX Brasil、Enjoei、Rebag",
      "中东与北非": "Melltoo、OpenSooq",
      "非洲": "Jiji、OLX Africa",
      "欧洲": "Back Market、Vinted、Wallapop",
      "日韩": "Mercari、Rakuma",
    },
  },
  {
    l1: "出行" as const,
    l2: "网约车" as const,
    cells: {
      "中国": "滴滴、曹操出行、T3出行",
      "美国": "Uber、Lyft",
      "东南亚": "Grab、Gojek、Bolt",
      "印度": "Ola、Uber India、Namma Yatri",
      "拉美": "99、Cabify、Beat",
      "中东与北非": "Careem、Uber MENA、Jeeny",
      "非洲": "Bolt、Uber、Little",
      "欧洲": "Bolt、Free Now、BlaBlaCar",
      "日韩": "Kakao T、Go Taxi",
    },
  },
  {
    l1: "出行" as const,
    l2: "顺风车/拼车" as const,
    cells: {
      "中国": "嘀嗒出行、哈啰顺风车",
      "美国": "UberPool、Lyft Shared、Waze Carpool",
      "东南亚": "GrabHitch、BlaBlaCar SEA",
      "印度": "Ola Share、Quick Ride",
      "拉美": "BlaBlaCar Brasil",
      "中东与北非": "Carpool Arabia",
      "非洲": "Treepz、BlaBlaCar Africa",
      "欧洲": "BlaBlaCar、Fahrgemeinschaft",
      "日韩": "Line Carpool、Nori Nori",
    },
  },
  {
    l1: "出行" as const,
    l2: "共享单车/电单车" as const,
    cells: {
      "中国": "美团单车、哈啰单车、青桔",
      "美国": "Lime、Bird、Citi Bike",
      "东南亚": "Anywheel、Beam、Neuron",
      "印度": "Yulu、Bounce、Vogo",
      "拉美": "Grin、Yellow（已整合）、Movo",
      "中东与北非": "Careem Bike、Lime MENA",
      "非洲": "SafeBoda、Bolt Bikes",
      "欧洲": "Lime、Tier、Voi",
      "日韩": "Hello Cycling、Luup",
    },
  },
  {
    l1: "出行" as const,
    l2: "地图/导航" as const,
    cells: {
      "中国": "高德地图、百度地图",
      "美国": "Google Maps、Waze、MapQuest",
      "东南亚": "Google Maps、Waze、HERE WeGo",
      "印度": "Google Maps、MapmyIndia",
      "拉美": "Google Maps、Waze",
      "中东与北非": "Google Maps、Waze",
      "非洲": "Google Maps、Waze",
      "欧洲": "Google Maps、Maps.me",
      "日韩": "Google Maps、TomTom",
    },
  },
  {
    l1: "出行" as const,
    l2: "代驾" as const,
    cells: {
      "中国": "e代驾、滴滴代驾",
      "美国": "Uber（整合）、Designated Drivers",
      "东南亚": "极少独立平台",
      "印度": "极少独立平台",
      "拉美": "极少独立平台",
      "中东与北非": "Careem（整合）",
      "非洲": "极少",
      "欧洲": "极少独立平台",
      "日韩": "极少独立平台",
    },
  },
  {
    l1: "外卖" as const,
    l2: "餐饮外卖" as const,
    cells: {
      "中国": "美团外卖、饿了么",
      "美国": "DoorDash、Uber Eats、Grubhub",
      "东南亚": "GrabFood、GoFood（双寡头主市场）；ShopeeFood追赶、Foodpanda收缩",
      "印度": "Swiggy、Zomato、Dunzo",
      "拉美": "Rappi、iFood、Uber Eats",
      "中东与北非": "Talabat、Careem Now、Jahez",
      "非洲": "Glovo、Jumia Food、Bolt Food",
      "欧洲": "Deliveroo、Just Eat Takeaway、Wolt",
      "日韩": "Uber Eats Japan、Demae-can、Baedal Minjok",
    },
  },
  {
    l1: "外卖" as const,
    l2: "即时零售/闪购" as const,
    cells: {
      "中国": "美团闪购、京东到家、蜂鸟即配",
      "美国": "Instacart、Gopuff、Jokr（已关闭）",
      "东南亚": "GrabMart、HappyFresh、AirAsia Fresh",
      "印度": "Blinkit（原Grofers）、Zepto、Dunzo",
      "拉美": "Rappi Turbo、Cornershop（Uber）",
      "中东与北非": "Talabat Mart、Careem Quik",
      "非洲": "Glovo、Jumia、Wasoko",
      "欧洲": "Getir、Gorillas（整合中）、Flink",
      "日韩": "Rakuten Seiyu Netsuper、Amazon Fresh",
    },
  },
  {
    l1: "外卖" as const,
    l2: "生鲜电商" as const,
    cells: {
      "中国": "叮咚买菜、朴朴、盒马",
      "美国": "Amazon Fresh、Whole Foods、Thrive Market",
      "东南亚": "HappyFresh、Sayurbox、TaniHub",
      "印度": "BigBasket、FreshToHome、Licious",
      "拉美": "JOKR（已退出）、Frubana（重组）",
      "中东与北非": "El Grocer、Kibsons、Farmbox",
      "非洲": "Wasoko、Twiga Foods、ChopChop",
      "欧洲": "Ocado、Getir、Flink",
      "日韩": "Oisix、Radish、Amazon Fresh Japan",
    },
  },
  {
    l1: "外卖" as const,
    l2: "药品配送" as const,
    cells: {
      "中国": "美团买药、京东健康、叮当快药",
      "美国": "CVS、Walgreens、Amazon Pharmacy",
      "东南亚": "1mg（Tata）、PharmEasy、Netmeds",
      "印度": "1mg、PharmEasy、Apollo 24",
      "拉美": "待补",
      "中东与北非": "Rappi（含药品）、Farmacity",
      "非洲": "1mg（中东）、Altibbi、Vezeeta",
      "欧洲": "MyDawa、Livia、Pharmacy M",
      "日韩": "Zur Rose、Shop Apotheke、Medino",
    },
  },
  {
    l1: "社交" as const,
    l2: "即时通讯" as const,
    cells: {
      "中国": "微信、QQ",
      "美国": "WhatsApp、Messenger、iMessage",
      "东南亚": "WhatsApp、LINE、Zalo",
      "印度": "WhatsApp、Telegram、JioChat",
      "拉美": "WhatsApp、Telegram",
      "中东与北非": "WhatsApp、Telegram、Botim",
      "非洲": "WhatsApp、Telegram",
      "欧洲": "WhatsApp、Telegram、Signal",
      "日韩": "LINE、KakaoTalk",
    },
  },
  {
    l1: "社交" as const,
    l2: "社区/论坛" as const,
    cells: {
      "中国": "豆瓣、知乎、小红书（社区）",
      "美国": "Reddit、Quora、Discord",
      "东南亚": "Reddit、Discord、Kaskus",
      "印度": "Reddit、Discord、Indiabix",
      "拉美": "Reddit、Discord、Taringa",
      "中东与北非": "Reddit、Discord",
      "非洲": "Reddit、Nairaland",
      "欧洲": "Reddit、Discord、Mumsnet",
      "日韩": "Reddit、5ch、Naver Cafe",
    },
  },
  {
    l1: "社交" as const,
    l2: "陌生人社交" as const,
    cells: {
      "中国": "陌陌、Soul、探探",
      "美国": "Tinder、Bumble、Hinge",
      "东南亚": "Tinder、Bumble、Paktor",
      "印度": "Tinder、Bumble、Aisle",
      "拉美": "Tinder、Bumble、Badoo",
      "中东与北非": "Tinder、Bumble、Hayat",
      "非洲": "Tinder、Bumble",
      "欧洲": "Tinder、Bumble、Happn",
      "日韩": "Tinder、Pairs、Omiai",
    },
  },
  {
    l1: "社交" as const,
    l2: "职场社交" as const,
    cells: {
      "中国": "脉脉、领英中国（已调整）",
      "美国": "LinkedIn、Indeed、Glassdoor",
      "东南亚": "LinkedIn、Glints、JobStreet",
      "印度": "LinkedIn、Naukri、Apna",
      "拉美": "LinkedIn、Vagas.com、Catho",
      "中东与北非": "LinkedIn、Bayt、GulfTalent",
      "非洲": "LinkedIn、Bayt、Naukrigulf",
      "欧洲": "LinkedIn、Jobberman",
      "日韩": "LinkedIn、Xing、StepStone",
    },
  },
  {
    l1: "社交" as const,
    l2: "婚恋/相亲" as const,
    cells: {
      "中国": "珍爱网、百合网、世纪佳缘",
      "美国": "Match.com、eHarmony、Hinge",
      "东南亚": "Paktor、Lunch Actually、Noonswoon",
      "印度": "Shaadi.com、BharatMatrimony、Jeevansathi",
      "拉美": "ParPerfeito、AmoCasar、Match LATAM",
      "中东与北非": "Hawaya（已关闭）、Harmonica（已整合）",
      "非洲": "极少",
      "欧洲": "Match.com、Parship、ElitePartner",
      "日韩": "Omiai、Pairs、Zexy Enmusubi",
    },
  },
  {
    l1: "支付钱包" as const,
    l2: "移动支付" as const,
    cells: {
      "中国": "支付宝、微信支付",
      "美国": "Apple Pay、Google Pay、Venmo",
      "东南亚": "GrabPay、GoPay、Touch 'n Go、Maya",
      "印度": "Paytm、PhonePe、Google Pay",
      "拉美": "Mercado Pago、PicPay、Nubank",
      "中东与北非": "STC Pay、Apple Pay、Careem Pay",
      "非洲": "M-Pesa、Opay、Chipper Cash",
      "欧洲": "Apple Pay、Google Pay、PayPal",
      "日韩": "PayPay、LINE Pay、KakaoPay",
    },
  },
  {
    l1: "支付钱包" as const,
    l2: "跨境支付/汇款" as const,
    cells: {
      "中国": "万里汇、连连支付、PingPong",
      "美国": "Wise、Remitly、Western Union",
      "东南亚": "Wise、Remitly、Singtel Dash",
      "印度": "Wise、Remitly、InstaReM",
      "拉美": "Wise、Remitly、Banco do Brasil",
      "中东与北非": "Wise、Remitly、Al Fardan Exchange",
      "非洲": "Wise、Remitly、WorldRemit",
      "欧洲": "Wise、Remitly、TransferGo",
      "日韩": "Wise、Remitly、Seven Bank",
    },
  },
  {
    l1: "支付钱包" as const,
    l2: "数字银行/虚拟账户" as const,
    cells: {
      "中国": "微众银行、网商银行、百信银行",
      "美国": "Chime、Varo、SoFi",
      "东南亚": "Tonik、UNObank、Maya Bank",
      "印度": "Jupiter、Fi、Niyo",
      "拉美": "Nubank、Inter、C6 Bank",
      "中东与北非": "Liv.、YAP、Nymcard",
      "非洲": "Kuda、Sparkle、FairMoney",
      "欧洲": "Revolut、N26、Monzo",
      "日韩": "Sony Bank、SBI Sumishin Net Bank",
    },
  },
  {
    l1: "支付钱包" as const,
    l2: "预付卡/储值" as const,
    cells: {
      "中国": "美团礼品卡、京东E卡",
      "美国": "Starbucks Card、Amazon Gift Card",
      "东南亚": "GrabGift、ShopeePay礼品卡",
      "印度": "Amazon Pay Gift Card、Flipkart Gift Card",
      "拉美": "iFood Gift Card、Uber Gift Card",
      "中东与北非": "Careem Pay、Noon Gift Card",
      "非洲": "M-Pesa（含储蓄功能）、Opay",
      "欧洲": "Amazon Gift Card、Paysafecard",
      "日韩": "Suica、PASMO、nanaco",
    },
  },
  {
    l1: "支付钱包" as const,
    l2: "聚合支付" as const,
    cells: {
      "中国": "拉卡拉、汇付天下、银联商务",
      "美国": "Stripe、Square、Adyen",
      "东南亚": "2C2P、Omise、Xendit",
      "印度": "Razorpay、PayU、CCAvenue",
      "拉美": "Mercado Pago、PagSeguro、Cielo",
      "中东与北非": "Telr、Checkout.com、PayFort",
      "非洲": "Flutterwave、Paystack、DPO Group",
      "欧洲": "Stripe、Adyen、Checkout.com",
      "日韩": "Stripe Japan、Komoju、GMO Payment",
    },
  },
  {
    l1: "游戏" as const,
    l2: "手游" as const,
    cells: {
      "中国": "王者荣耀、和平精英、原神",
      "美国": "Candy Crush、PUBG Mobile、Roblox",
      "东南亚": "Free Fire、Mobile Legends、Genshin Impact",
      "印度": "Ludo King、Free Fire、Battlegrounds Mobile",
      "拉美": "Free Fire、PUBG Mobile、Garena games",
      "中东与北非": "PUBG Mobile、FIFA Mobile、Call of Duty Mobile",
      "非洲": "Candy Crush、PUBG Mobile、Free Fire",
      "欧洲": "Candy Crush、PUBG Mobile、Coin Master",
      "日韩": "Monster Strike、Fate/Grand Order、Puzzle & Dragons",
    },
  },
  {
    l1: "游戏" as const,
    l2: "端游/页游" as const,
    cells: {
      "中国": "英雄联盟、穿越火线、梦幻西游",
      "美国": "League of Legends、Valorant、World of Warcraft",
      "东南亚": "Dota 2、CS:GO、PUBG PC",
      "印度": "Dota 2、Valorant、BGMI PC",
      "拉美": "League of Legends、Valorant、FIFA",
      "中东与北非": "Dota 2、CS:GO、Fortnite",
      "非洲": "Dota 2、CS:GO",
      "欧洲": "League of Legends、FIFA、Fortnite",
      "日韩": "League of Legends、Final Fantasy XIV、Black Desert",
    },
  },
  {
    l1: "游戏" as const,
    l2: "云游戏" as const,
    cells: {
      "中国": "网易云游戏、腾讯START",
      "美国": "Xbox Cloud Gaming、NVIDIA GeForce NOW",
      "东南亚": "极少",
      "印度": "极少",
      "拉美": "极少",
      "中东与北非": "极少",
      "非洲": "极少",
      "欧洲": "Xbox Cloud Gaming、Boosteroid",
      "日韩": "极少",
    },
  },
  {
    l1: "游戏" as const,
    l2: "游戏平台/分发" as const,
    cells: {
      "中国": "Steam（中国版）、TapTap、WeGame",
      "美国": "Steam、Epic Games Store、itch.io",
      "东南亚": "Steam、Garena、TapTap SEA",
      "印度": "Steam、Epic Games Store",
      "拉美": "Steam、Epic Games Store",
      "中东与北非": "Steam、Epic Games Store",
      "非洲": "Steam、Epic Games Store",
      "欧洲": "Steam、Epic Games Store、GOG",
      "日韩": "Steam、DMM Games、Fanza",
    },
  },
  {
    l1: "游戏" as const,
    l2: "电竞/赛事" as const,
    cells: {
      "中国": "腾讯电竞、英雄体育VSPO",
      "美国": "ESL Gaming、Riot Games、Blizzard",
      "东南亚": "MPL、Garena、ESL One SEA",
      "印度": "MPL India、BGIS、Upthrust Esports",
      "拉美": "Liga Master Flow、Free Fire League",
      "中东与北非": "PUBG Mobile Pro League MENA",
      "非洲": "极少",
      "欧洲": "ESL、LEC、BLAST Premier",
      "日韩": "LJL、LCK、RAGE",
    },
  },
  {
    l1: "直播" as const,
    l2: "娱乐直播" as const,
    cells: {
      "中国": "抖音直播、快手直播、YY直播",
      "美国": "Twitch、YouTube Live、TikTok Live",
      "东南亚": "Bigo Live、Mico、Uplive",
      "印度": "Loco、Rooter、StreamKar",
      "拉美": "Bigo Live、Tango Live、LiveMe",
      "中东与北非": "Tango Live、Bigo Live、StreamKar",
      "非洲": "Bigo Live、StreamKar、Tango Live",
      "欧洲": "Twitch、YouTube Live、Stripchat",
      "日韩": "17LIVE、Pococha、ShowRoom",
    },
  },
  {
    l1: "直播" as const,
    l2: "游戏直播" as const,
    cells: {
      "中国": "斗鱼、虎牙、B站直播",
      "美国": "Twitch、YouTube Gaming、Facebook Gaming",
      "东南亚": "Nimo TV、Facebook Gaming",
      "印度": "Loco、YouTube Gaming",
      "拉美": "Nimo TV、Facebook Gaming",
      "中东与北非": "Nimo TV、Facebook Gaming",
      "非洲": "Facebook Gaming、YouTube Gaming",
      "欧洲": "Twitch、YouTube Gaming、Kick",
      "日韩": "Mildom、OPENREC、Mirrativ",
    },
  },
  {
    l1: "直播" as const,
    l2: "电商直播/带货" as const,
    cells: {
      "中国": "淘宝直播、抖音电商、快手电商",
      "美国": "Amazon Live、YouTube Shopping、TikTok Shop",
      "东南亚": "Shopee Live、LazLive、Tokopedia Play",
      "印度": "Flipkart Live、Myntra Live、Meesho Live",
      "拉美": "Mercado Libre Live、Shopee Live、Magalu Live",
      "中东与北非": "Noon Live、Amazon.sa Live",
      "非洲": "Jumia Live、Kilimall Live",
      "欧洲": "Amazon Live、Zalando Live、Livescale",
      "日韩": "Qoo10 Live、Rakuten Live、BASE Live",
    },
  },
  {
    l1: "直播" as const,
    l2: "教育直播" as const,
    cells: {
      "中国": "猿辅导、作业帮、高途课堂",
      "美国": "Coursera、Udemy、MasterClass",
      "东南亚": "Ruangguru、Zenius、Pahamify",
      "印度": "BYJU'S、Unacademy、Vedantu",
      "拉美": "Descomplica、Provi、EBAC",
      "中东与北非": "Noon Academy、Abwaab、Alison",
      "非洲": "uLesson、Eneza Education、Shupavu291",
      "欧洲": "FutureLearn、OpenClassrooms、Domestika",
      "日韩": "RareJob、Schoo、N High School",
    },
  },
  {
    l1: "直播" as const,
    l2: "企业直播/会议" as const,
    cells: {
      "中国": "腾讯会议、钉钉、企业微信",
      "美国": "Zoom、Microsoft Teams、Webex",
      "东南亚": "Zoom、Google Meet、Microsoft Teams",
      "印度": "Zoom、Microsoft Teams、Google Meet",
      "拉美": "Zoom、Microsoft Teams、Google Meet",
      "中东与北非": "Zoom、Microsoft Teams、Google Meet",
      "非洲": "Zoom、Microsoft Teams、Google Meet",
      "欧洲": "Zoom、Microsoft Teams、Google Meet",
      "日韩": "Zoom、Microsoft Teams、Google Meet",
    },
  },
  {
    l1: "信用管理" as const,
    l2: "征信查询" as const,
    cells: {
      "中国": "央行征信、百行征信、朴道征信",
      "美国": "Experian、Equifax、TransUnion",
      "东南亚": "CIC（菲律宾）、BI Checking（印尼）",
      "印度": "CIBIL、Experian India、Equifax India",
      "拉美": "Serasa Experian、Boa Vista SCPC",
      "中东与北非": "Al Etihad Credit Bureau（阿联酋）",
      "非洲": "Creditinfo、TransUnion Africa",
      "欧洲": "Schufa、Experian、Equifax",
      "日韩": "KSCIC、CIC、NICE",
    },
  },
  {
    l1: "信用管理" as const,
    l2: "债务管理/催收" as const,
    cells: {
      "中国": "永雄集团（已调整）、资易通",
      "美国": "TrueAccord、Encore Capital、Portfolio Recovery",
      "东南亚": "极少",
      "印度": "极少",
      "拉美": "极少",
      "中东与北非": "极少",
      "非洲": "极少",
      "欧洲": "Intrum、Hoist Finance、Arrow Global",
      "日韩": "极少",
    },
  },
  {
    l1: "内容资讯" as const,
    l2: "短视频" as const,
    cells: {
      "中国": "抖音、快手、视频号",
      "美国": "TikTok、YouTube Shorts、Instagram Reels",
      "东南亚": "TikTok、SnackVideo、Likee",
      "印度": "Moj、Josh、Takatak（MX TakaTak）",
      "拉美": "TikTok、Kwai、Instagram Reels",
      "中东与北非": "TikTok、Instagram Reels",
      "非洲": "TikTok、SnackVideo",
      "欧洲": "TikTok、Instagram Reels、Triller",
      "日韩": "TikTok、LINE Voom、MixChannel",
    },
  },
  {
    l1: "内容资讯" as const,
    l2: "中长视频/流媒体" as const,
    cells: {
      "中国": "爱奇艺、腾讯视频、优酷",
      "美国": "Netflix、YouTube、Hulu",
      "东南亚": "Netflix、Disney+ Hotstar、Viu",
      "印度": "Disney+ Hotstar、SonyLIV、ZEE5",
      "拉美": "Netflix、Amazon Prime Video、Globoplay",
      "中东与北非": "Netflix、Shahid、Starzplay",
      "非洲": "Netflix、Showmax、Amazon Prime Video",
      "欧洲": "Netflix、Amazon Prime Video、Disney+",
      "日韩": "Netflix、U-NEXT、Hulu Japan",
    },
  },
  {
    l1: "内容资讯" as const,
    l2: "新闻资讯/聚合" as const,
    cells: {
      "中国": "今日头条、腾讯新闻、网易新闻",
      "美国": "Google News、Apple News、Flipboard",
      "东南亚": "Google News、Detik、Kompas",
      "印度": "Dailyhunt、Inshorts、NewsDog",
      "拉美": "Google News、G1、Infobae",
      "中东与北非": "Google News、Al Jazeera、Gulf News",
      "非洲": "Google News、Pulse Nigeria、News24",
      "欧洲": "Google News、SmartNews、Upday",
      "日韩": "SmartNews、Gunosy、LINE News",
    },
  },
  {
    l1: "内容资讯" as const,
    l2: "知识付费/专栏" as const,
    cells: {
      "中国": "得到、知乎盐选、喜马拉雅",
      "美国": "Substack、Patreon、Medium",
      "东南亚": "极少",
      "印度": "极少",
      "拉美": "极少",
      "中东与北非": "极少",
      "非洲": "极少",
      "欧洲": "Substack、Patreon、Medium",
      "日韩": "note、Stand FM、Voicy",
    },
  },
  {
    l1: "内容资讯" as const,
    l2: "播客/音频" as const,
    cells: {
      "中国": "喜马拉雅、荔枝、小宇宙",
      "美国": "Spotify、Apple Podcasts、Audible",
      "东南亚": "Spotify、Noice、Resso",
      "印度": "Spotify、Gaana、JioSaavn",
      "拉美": "Spotify、Deezer、Podcast Addict",
      "中东与北非": "Anghami、Spotify",
      "非洲": "Spotify、Audiomack",
      "欧洲": "Spotify、Deezer、Podimo",
      "日韩": "Spotify、Audible、Voicy",
    },
  },
  {
    l1: "企业服务" as const,
    l2: "企业通讯/协同" as const,
    cells: {
      "中国": "钉钉、企业微信、飞书",
      "美国": "Slack、Microsoft Teams、Discord",
      "东南亚": "Lark、Slack、Microsoft Teams",
      "印度": "Slack、Microsoft Teams、Zoho Cliq",
      "拉美": "Slack、Microsoft Teams、Google Workspace",
      "中东与北非": "Slack、Microsoft Teams、Google Workspace",
      "非洲": "Slack、Microsoft Teams、Google Workspace",
      "欧洲": "Slack、Microsoft Teams、Google Workspace",
      "日韩": "Slack、LINE Works、Chatwork",
    },
  },
  {
    l1: "企业服务" as const,
    l2: "项目管理" as const,
    cells: {
      "中国": "Teambition、Tower、蓝湖",
      "美国": "Asana、Monday.com、Notion",
      "东南亚": "Asana、Notion、Trello",
      "印度": "Asana、Notion、Jira",
      "拉美": "Asana、Notion、Trello",
      "中东与北非": "Asana、Notion、Trello",
      "非洲": "Asana、Notion、Trello",
      "欧洲": "Asana、Notion、ClickUp",
      "日韩": "Asana、Notion、Backlog",
    },
  },
  {
    l1: "企业服务" as const,
    l2: "云存储/云服务" as const,
    cells: {
      "中国": "阿里云、腾讯云、华为云",
      "美国": "AWS、Google Cloud、Microsoft Azure",
      "东南亚": "AWS、Google Cloud、Alibaba Cloud",
      "印度": "AWS、Google Cloud、Microsoft Azure",
      "拉美": "AWS、Google Cloud、Microsoft Azure",
      "中东与北非": "AWS、Google Cloud、Microsoft Azure",
      "非洲": "AWS、Google Cloud、Microsoft Azure",
      "欧洲": "AWS、Google Cloud、Microsoft Azure",
      "日韩": "AWS、Google Cloud、Microsoft Azure",
    },
  },
  {
    l1: "企业服务" as const,
    l2: "在线文档/表格" as const,
    cells: {
      "中国": "腾讯文档、石墨文档、金山文档",
      "美国": "Google Docs、Notion、Coda",
      "东南亚": "Google Docs、Notion、Quip",
      "印度": "Google Docs、Notion、Zoho Writer",
      "拉美": "Google Docs、Notion、Coda",
      "中东与北非": "Google Docs、Notion、Coda",
      "非洲": "Google Docs、Notion、Coda",
      "欧洲": "Google Docs、Notion、Coda",
      "日韩": "Google Docs、Notion、Coda",
    },
  },
  {
    l1: "法律服务" as const,
    l2: "电子签章" as const,
    cells: {
      "中国": "e签宝、法大大、上上签",
      "美国": "DocuSign、Adobe Sign、HelloSign",
      "东南亚": "DocuSign、SignNow、HelloSign",
      "印度": "DocuSign、Zoho Sign、Leegality",
      "拉美": "DocuSign、ClickSign、SignNow",
      "中东与北非": "DocuSign、Adobe Sign",
      "非洲": "DocuSign、SignNow",
      "欧洲": "DocuSign、Yousign、Signable",
      "日韩": "DocuSign、CloudSign、GMO Sign",
    },
  },
  {
    l1: "法律服务" as const,
    l2: "电子合同" as const,
    cells: {
      "中国": "契约锁、法大大、律师管家合同",
      "美国": "DocuSign CLM、Ironclad、Conga",
      "东南亚": "DocuSign、Pandadoc、Contractbook",
      "印度": "Legistify、SpotDraft、DocuSign",
      "拉美": "DocuSign、D4Sign、ClickSign",
      "中东与北非": "DocuSign、Adobe Sign",
      "非洲": "DocuSign、Contractbook",
      "欧洲": "DocuSign、Legito、Contractbook",
      "日韩": "CloudSign、GMO Sign、DocuSign",
    },
  },
  {
    l1: "法律服务" as const,
    l2: "在线公证/存证" as const,
    cells: {
      "中国": "蚂蚁链存证、至信链、公证云",
      "美国": "Notarize、NotaryCam、Proof",
      "东南亚": "极少独立平台；多嵌签约产品",
      "印度": "eMudhra、NSDL e-Sign 相关路径",
      "拉美": "极少",
      "中东与北非": "极少",
      "非洲": "极少",
      "欧洲": "Scrive、Yousign（含电子公证路径）",
      "日韩": "极少",
    },
  },
  {
    l1: "法律服务" as const,
    l2: "法律咨询/智能法务" as const,
    cells: {
      "中国": "华律网、无讼、法狗狗",
      "美国": "LegalZoom、Rocket Lawyer、DoNotPay",
      "东南亚": "LawPath、Lawyerment",
      "印度": "Vakilsearch、LawRato、MyAdvo",
      "拉美": "LegalTech 分散；少头部",
      "中东与北非": "极少",
      "非洲": "极少",
      "欧洲": "Rocket Lawyer EU、LegalZoom 对照",
      "日韩": "极少独立 To C 平台",
    },
  },
  {
    l1: "本地生活" as const,
    l2: "到店团购" as const,
    cells: {
      "中国": "美团、大众点评、口碑",
      "美国": "Groupon、LivingSocial（已衰退）",
      "东南亚": "Fave、Eatigo、Burpple",
      "印度": "Nearbuy、Littleapp、Dineout",
      "拉美": "Groupon、Peixe Urbano、Cuponatic",
      "中东与北非": "The Entertainer、Cobone",
      "非洲": "极少",
      "欧洲": "Groupon、Wowcher、Travelzoo",
      "日韩": "Hot Pepper、Tabelog、Gurunavi",
    },
  },
  {
    l1: "本地生活" as const,
    l2: "酒店/民宿预订" as const,
    cells: {
      "中国": "携程、美团酒店、飞猪",
      "美国": "Booking.com、Airbnb、Expedia",
      "东南亚": "Agoda、Traveloka、Airbnb",
      "印度": "MakeMyTrip、Goibibo、Oyo",
      "拉美": "Booking.com、Airbnb、Decolar",
      "中东与北非": "Booking.com、Airbnb、Musafir",
      "非洲": "Booking.com、Airbnb、Jumia Travel",
      "欧洲": "Booking.com、Airbnb、Holidu",
      "日韩": "Booking.com、Airbnb、Jalan",
    },
  },
  {
    l1: "本地生活" as const,
    l2: "票务/电影/演出" as const,
    cells: {
      "中国": "猫眼、大麦、淘票票",
      "美国": "Ticketmaster、Fandango、Eventbrite",
      "东南亚": "BookMyShow、Ticketmelon、Peatix",
      "印度": "BookMyShow、Paytm Insider、Townscript",
      "拉美": "Ingresso、Sympla、Ticket360",
      "中东与北非": "Platinumlist、BookMyShow UAE",
      "非洲": "Quicket、Ticketpro",
      "欧洲": "Ticketmaster、Eventim、Dice",
      "日韩": "eplus、Lawson Ticket、Pia",
    },
  },
  {
    l1: "本地生活" as const,
    l2: "家政/保洁服务" as const,
    cells: {
      "中国": "天鹅到家、58到家、京东家政",
      "美国": "TaskRabbit、Handy、Thumbtack",
      "东南亚": "Helpling、Sendhelper、Klean",
      "印度": "Urban Company、Housejoy、Bro4u",
      "拉美": "极少",
      "中东与北非": "Justmop、Matic、ServiceMarket",
      "非洲": "极少",
      "欧洲": "Helpling、Wecasa、Hassle.com",
      "日韩": "极少",
    },
  },
  {
    l1: "本地生活" as const,
    l2: "美容/美发预约" as const,
    cells: {
      "中国": "美团丽人、大众点评",
      "美国": "StyleSeat、Booksy、Treatwell",
      "东南亚": "Vaniday、Klook（含美容）、BeautyBook",
      "印度": "Urban Company、Be U Salons、Zooty",
      "拉美": "极少",
      "中东与北非": "Vaniday、Shedul",
      "非洲": "极少",
      "欧洲": "Treatwell、Fresha、Planity",
      "日韩": "Hot Pepper Beauty、Minimo",
    },
  },
  {
    l1: "在线教育" as const,
    l2: "K12学科辅导" as const,
    cells: {
      "中国": "学而思网校、作业帮、猿辅导",
      "美国": "Khan Academy、IXL、Chegg",
      "东南亚": "Ruangguru、Zenius、Pahamify",
      "印度": "BYJU'S、Vedantu、Unacademy",
      "拉美": "Descomplica、Provi、Me Salva!",
      "中东与北非": "Noon Academy、Abwaab、Alison",
      "非洲": "uLesson、Eneza Education",
      "欧洲": "Photomath、Babbel、Busuu",
      "日韩": "RISU、Z-kai、Sapix",
    },
  },
  {
    l1: "在线教育" as const,
    l2: "语言学习" as const,
    cells: {
      "中国": "流利说、多邻国（中国运营）、英语流利说",
      "美国": "Duolingo、Babbel、Rosetta Stone",
      "东南亚": "Duolingo、Cake、Elsa Speak",
      "印度": "Duolingo、British Council、EnglishScore",
      "拉美": "Duolingo、Babbel、Busuu",
      "中东与北非": "Duolingo、Cambly、Preply",
      "非洲": "Duolingo、Babbel",
      "欧洲": "Duolingo、Babbel、Busuu",
      "日韩": "Duolingo、RareJob、DMM英会話",
    },
  },
  {
    l1: "在线教育" as const,
    l2: "职业教育/考证" as const,
    cells: {
      "中国": "中公教育、华图教育、粉笔",
      "美国": "Coursera、Udacity、LinkedIn Learning",
      "东南亚": "Coursera、Udemy、Alison",
      "印度": "UpGrad、Simplilearn、Great Learning",
      "拉美": "Coursera、Udemy、Digital House",
      "中东与北非": "Coursera、Udemy、LinkedIn Learning",
      "非洲": "Coursera、Udemy、ALX",
      "欧洲": "Coursera、Udemy、FutureLearn",
      "日韩": "Coursera、Udemy、Schoo",
    },
  },
  {
    l1: "在线教育" as const,
    l2: "兴趣/素质教育" as const,
    cells: {
      "中国": "美术宝、编程猫、VIP陪练",
      "美国": "MasterClass、Skillshare、Outschool",
      "东南亚": "极少",
      "印度": "极少",
      "拉美": "极少",
      "中东与北非": "极少",
      "非洲": "极少",
      "欧洲": "MasterClass、Skillshare、Domestika",
      "日韩": "极少",
    },
  },
  {
    l1: "在线教育" as const,
    l2: "企业培训/SaaS化" as const,
    cells: {
      "中国": "云学堂、酷学院、魔学院",
      "美国": "LinkedIn Learning、Udemy Business、Coursera for Business",
      "东南亚": "LinkedIn Learning、Udemy Business",
      "印度": "LinkedIn Learning、Udemy Business、Simplilearn",
      "拉美": "LinkedIn Learning、Udemy Business",
      "中东与北非": "LinkedIn Learning、Udemy Business",
      "非洲": "LinkedIn Learning、Udemy Business",
      "欧洲": "LinkedIn Learning、Udemy Business",
      "日韩": "LinkedIn Learning、Udemy Business",
    },
  },
  {
    l1: "在线医疗" as const,
    l2: "在线问诊" as const,
    cells: {
      "中国": "平安好医生、微医、丁香医生",
      "美国": "Teladoc、Amwell、Doctor on Demand",
      "东南亚": "Halodoc、Alodokter、MyDoc",
      "印度": "Practo、DocsApp、mfine",
      "拉美": "Dr.Consulta、Conexa、Memed",
      "中东与北非": "Vezeeta、Altibbi、Aster Online",
      "非洲": "Helium Health、MyDawa、Livia",
      "欧洲": "Babylon Health（已调整）、Kry、Livi",
      "日韩": "极少",
    },
  },
  {
    l1: "在线医疗" as const,
    l2: "药品电商/配送" as const,
    cells: {
      "中国": "京东健康、阿里健康、叮当快药",
      "美国": "Amazon Pharmacy、CVS、Walgreens",
      "东南亚": "1mg（Tata）、PharmEasy、Netmeds",
      "印度": "1mg、PharmEasy、Apollo 24",
      "拉美": "待补",
      "中东与北非": "Farmacity、Pague Menos、Drogasil",
      "非洲": "1mg（中东）、Altibbi、Vezeeta",
      "欧洲": "MyDawa、Livia、Pharmacy M",
      "日韩": "Zur Rose、Shop Apotheke、Medino",
    },
  },
  {
    l1: "在线医疗" as const,
    l2: "健康管理/慢病" as const,
    cells: {
      "中国": "智云健康、微脉、糖护士",
      "美国": "Livongo（Teladoc）、Omada Health、Noom",
      "东南亚": "极少",
      "印度": "Phable、BeatO、Wellthy",
      "拉美": "极少",
      "中东与北非": "极少",
      "非洲": "极少",
      "欧洲": "MySugr、Ada Health、Kry",
      "日韩": "极少",
    },
  },
  {
    l1: "在线医疗" as const,
    l2: "心理咨询" as const,
    cells: {
      "中国": "壹心理、简单心理、KnowYourself",
      "美国": "BetterHelp、Talkspace、Calm",
      "东南亚": "极少",
      "印度": "YourDOST、InnerHour、Wysa",
      "拉美": "极少",
      "中东与北非": "极少",
      "非洲": "极少",
      "欧洲": "BetterHelp（欧洲）、Kry、Livi",
      "日韩": "极少",
    },
  },
  {
    l1: "在线医疗" as const,
    l2: "体检预约" as const,
    cells: {
      "中国": "美年大健康、爱康国宾、善诊",
      "美国": "LabCorp、Quest Diagnostics、Zocdoc",
      "东南亚": "极少",
      "印度": "Healthians、Thyrocare、1mg",
      "拉美": "极少",
      "中东与北非": "极少",
      "非洲": "极少",
      "欧洲": "极少",
      "日韩": "极少",
    },
  },
];

type Web3WideMarket =
  | "中国"
  | "美国"
  | "印尼"
  | "越南"
  | "巴西"
  | "墨西哥"
  | "印度"
  | "菲律宾"
  | "泰国"
  | "尼日利亚"
  | "阿根廷"
  | "土耳其"
  | "韩国"
  | "日本";

const WEB3_WIDE_MARKET_ORDER: Web3WideMarket[] = [
  "中国",
  "美国",
  "印尼",
  "越南",
  "巴西",
  "墨西哥",
  "印度",
  "菲律宾",
  "泰国",
  "尼日利亚",
  "阿根廷",
  "土耳其",
  "韩国",
  "日本",
];

/** Web3 To C：二级场景 → 用户核心行为 */
const WEB3_USER_BEHAVIOR: Partial<Record<SceneSubTag, string>> = {
  "中心化交易所（CEX）": "注册、KYC、法币入金、币币交易、合约杠杆",
  "去中心化交易所（DEX）": "连接钱包、代币兑换、流动性提供",
  "NFT交易市场": "浏览、出价、购买、挂单、版税收取",
  "自托管钱包": "创建钱包、备份助记词、签名交易",
  "托管钱包": "注册账户、平台代管私钥、便捷交易",
  "硬件钱包": "购买设备、离线存储、物理确认",
  "借贷协议": "抵押资产借款、管理清算风险",
  "稳定币兑换/持有": "兑换USDT/USDC、跨境转账、储蓄",
  "质押生息": "锁仓代币获奖励、流动性质押",
  "流动性挖矿": "提供代币对、赚取手续费和奖励",
  "链游玩赚": "购买游戏NFT、游戏内赚取代币",
  "游戏资产交易": "买卖租赁游戏装备、土地、角色",
  "游戏公会参与": "加入公会、获奖学金、分成收益",
  "去中心化社交": "创建身份、发布内容、积累社交图谱",
  "创作者代币": "购买KOL代币、进入专属社群",
  "内容打赏": "加密货币打赏、订阅付费内容",
  "PFP头像/身份": "购买头像类NFT、展示社交身份",
  "音乐/艺术收藏": "收藏数字艺术品、参与版税分成",
  "品牌会员/权益": "购买品牌NFT、享受线下权益",
  "票务/入场凭证": "购买活动NFT门票、转售",
  "稳定币汇款": "法币换稳定币、跨境转账、本地出金",
  "加密货币支付": "直接用BTC/ETH支付商品服务",
  "抗通胀储蓄": "收入换稳定币/比特币、对抗本币贬值",
};

/** Web2 线上场景：用户行为/目的（词条统一口径：词条名 → 行为/目的 → 玩家名单） */
const SCENE_USER_BEHAVIOR: Partial<Record<SceneSubTag, string>> = {
  综合电商: "浏览选品、下单支付、物流履约与售后",
  垂直电商: "在品类垂类站选购、比价、复购",
  社交电商: "通过内容/社交关系发现商品并成交",
  跨境电商: "跨境选品、跨境支付与清关履约",
  "二手/闲置": "发布/淘闲置、议价成交、回收换新",
  网约车: "叫车出行、行程支付与评价",
  "顺风车/拼车": "匹配同行、分摊费用、完成行程",
  "共享单车/电单车": "扫码开锁、短途骑行、按次/按时计费",
  "地图/导航": "查地点、规划路线、导航到达",
  代驾: "预约代驾、接送与支付",
  餐饮外卖: "点餐下单、配送到家、评价复购",
  "即时零售/闪购": "附近商品分钟级下单配送",
  生鲜电商: "选购生鲜、冷链配送到家",
  药品配送: "购药下单、合规配送到家",
  即时通讯: "聊天沟通、群组协作、文件往来",
  "社区/论坛": "发帖讨论、关注话题、积累社区关系",
  陌生人社交: "发现附近/匹配用户、破冰社交",
  职场社交: "建联职场人脉、求职招聘、内容互动",
  "婚恋/相亲": "匹配对象、沟通约会、关系推进",
  移动支付: "扫码/转账支付、账单管理、绑卡",
  "跨境支付/汇款": "跨境汇款、换汇、到账收款",
  "数字银行/虚拟账户": "开立数字账户、存取转、基础理财入口",
  "预付卡/储值": "充值储值、刷卡/码消费",
  聚合支付: "商户一码接入多通道收款与对账",
  手游: "下载游玩、内购、社交对战",
  "端游/页游": "安装/网页进入、付费成长、社交公会",
  云游戏: "免安装串流开玩、按时长/会员付费",
  "游戏平台/分发": "发现游戏、下载分发、社区与成就",
  "电竞/赛事": "观赛、竞猜互动、赛事门票/周边",
  娱乐直播: "观看直播、打赏互动、关注主播",
  游戏直播: "观看游戏解说、打赏、社群互动",
  "电商直播/带货": "边看边买、下单转化、主播种草",
  教育直播: "听课互动、打卡作业、续费课程",
  "企业直播/会议": "开会协作、投屏演示、录播回看",
  征信查询: "查询本人征信报告、了解信用记录",
  "债务管理/催收": "管理还款计划、协商债务；委外催收触达多归回收机构",
  短视频: "刷短视频、互动创作、关注创作者",
  "中长视频/流媒体": "点播/追剧、会员订阅、续看",
  "新闻资讯/聚合": "阅读新闻、关注栏目、推送订阅",
  "知识付费/专栏": "购买课程/专栏、学习打卡",
  "播客/音频": "收听播客、订阅更新、付费节目",
  "企业通讯/协同": "团队沟通、审批协同、组织通讯",
  项目管理: "拆解任务、跟踪进度、协作交付",
  "云存储/云服务": "存储同步文件、协作共享、算力订阅",
  "在线文档/表格": "多人编辑文档表格、评论修订",
  电子签章: "在线签署文件、加盖电子章、完成法律效力签署",
  电子合同: "在线起草/审批/签署电子合同、归档履约",
  "在线公证/存证": "电子数据存证、在线公证、证据固证",
  "法律咨询/智能法务": "咨询法律问题、生成文书、对接律师服务",
  到店团购: "选团购、到店核销、评价返利",
  "酒店/民宿预订": "搜房比价、预订入住、取消改期",
  "票务/电影/演出": "选座购票、取票入场、改签退票",
  "家政/保洁服务": "预约上门服务、支付与评价",
  "美容/美发预约": "选店预约、到店服务、会员复购",
  K12学科辅导: "选课学习、练习测评、家长督学",
  语言学习: "跟读练习、词汇语法、外教/AI陪练",
  "职业教育/考证": "备考课程、题库刷题、考证辅导",
  "兴趣/素质教育": "兴趣课学习、作品打卡、社群陪练",
  "企业培训/SaaS化": "企业内训、学习管理、考核认证",
  在线问诊: "图文/视频问诊、开方建议、复诊随访",
  "药品电商/配送": "购药下单、处方核验、配送到家",
  "健康管理/慢病": "监测指标、随访提醒、慢病管理",
  心理咨询: "预约咨询、线上疏导、疗程跟进",
  体检预约: "选套餐预约、到检报告、解读随访",
};

/** Web3 To C：二级 → 子域（数字资产交易/钱包/DeFi/GameFi/SocialFi/数字藏品/跨境支付） */
const WEB3_SUB_DOMAIN: Partial<Record<SceneSubTag, string>> = {
  "中心化交易所（CEX）": "数字资产交易",
  "去中心化交易所（DEX）": "数字资产交易",
  "NFT交易市场": "数字资产交易",
  "自托管钱包": "钱包与资产托管",
  "托管钱包": "钱包与资产托管",
  "硬件钱包": "钱包与资产托管",
  "借贷协议": "DeFi服务",
  "稳定币兑换/持有": "DeFi服务",
  "质押生息": "DeFi服务",
  "流动性挖矿": "DeFi服务",
  "链游玩赚": "GameFi",
  "游戏资产交易": "GameFi",
  "游戏公会参与": "GameFi",
  "去中心化社交": "SocialFi",
  "创作者代币": "SocialFi",
  "内容打赏": "SocialFi",
  "PFP头像/身份": "数字藏品",
  "音乐/艺术收藏": "数字藏品",
  "品牌会员/权益": "数字藏品",
  "票务/入场凭证": "数字藏品",
  "稳定币汇款": "跨境支付",
  "加密货币支付": "跨境支付",
  "抗通胀储蓄": "跨境支付",
};

/** Web3 To C 场景大宽表（14 市场） */
const WEB3_SCENE_WIDE_TABLE: {
  l1: "Web3";
  l2: SceneSubTag;
  domain: string;
  cells: Record<Web3WideMarket, string>;
}[] = [
  {
    l1: "Web3" as const,
    l2: "中心化交易所（CEX）" as const,
    domain: "数字资产交易",
    cells: {
      "中国": "币安（原）、OKX、火币HTX、Gate.io",
      "美国": "Coinbase、Kraken、Gemini、Binance.US",
      "印尼": "Indodax、Tokocrypto、Pintu、Rekeningku",
      "越南": "Remitano、Pintu、Foxpay、Nami Exchange",
      "巴西": "Mercado Bitcoin、Foxbit、NovaDAX、BitPreço",
      "墨西哥": "Bitso、Volabit、Bitlem、Tio Crypto",
      "印度": "WazirX（币安）、CoinDCX、ZebPay、Unocoin",
      "菲律宾": "Coins.ph、PDAX、BloomX、Binance P2P",
      "泰国": "Bitkub、Satang Pro、Zipmex（重组）",
      "尼日利亚": "Yellow Card、Quidax、Patricia",
      "阿根廷": "Lemon Cash、Buenbit、Ripio、SatoshiTango",
      "土耳其": "BtcTurk、Paribu、Bitexen",
      "韩国": "Upbit、Bithumb、Coinone、Korbit",
      "日本": "bitFlyer、Coincheck、GMO Coin、Zaif",
    },
  },
  {
    l1: "Web3" as const,
    l2: "去中心化交易所（DEX）" as const,
    domain: "数字资产交易",
    cells: {
      "中国": "dYdX（团队）、1inch（团队）、Tokenlon",
      "美国": "Uniswap、PancakeSwap、dYdX、GMX、Curve",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "NFT交易市场" as const,
    domain: "数字资产交易",
    cells: {
      "中国": "OpenSea（用户）、Blur（用户）、Element、X2Y2",
      "美国": "OpenSea、Blur、Magic Eden、LooksRare、SuperRare",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "自托管钱包" as const,
    domain: "钱包与托管",
    cells: {
      "中国": "imToken、TokenPocket、BitKeep（原）、OneKey",
      "美国": "MetaMask、Phantom、Rainbow、Rabby、Backpack",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "托管钱包" as const,
    domain: "钱包与托管",
    cells: {
      "中国": "交易所钱包、麦子钱包",
      "美国": "Coinbase Wallet、Blockchain.com、Binance Web3 Wallet",
      "印尼": "Pintu、Luno",
      "越南": "Pintu、Luno",
      "巴西": "Mercado Bitcoin Wallet",
      "墨西哥": "Bitso Wallet",
      "印度": "WazirX Wallet、ZebPay",
      "菲律宾": "Coins.ph Wallet",
      "泰国": "Bitkub Wallet",
      "尼日利亚": "Yellow Card Wallet",
      "阿根廷": "Lemon Cash Wallet",
      "土耳其": "BtcTurk Wallet",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "硬件钱包" as const,
    domain: "钱包与托管",
    cells: {
      "中国": "OneKey（原）、Cobo Vault",
      "美国": "Ledger、Trezor、GridPlus、Keystone",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "借贷协议" as const,
    domain: "DeFi服务",
    cells: {
      "中国": "用户使用",
      "美国": "Aave、Compound、MakerDAO、Morpho、Radiant",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "稳定币兑换/持有" as const,
    domain: "DeFi服务",
    cells: {
      "中国": "用户使用",
      "美国": "Curve、Uniswap、USDT/USDC/DAI",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "质押生息" as const,
    domain: "DeFi服务",
    cells: {
      "中国": "用户使用",
      "美国": "Lido、Rocket Pool、Coinbase Staking、EigenLayer",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "流动性挖矿" as const,
    domain: "DeFi服务",
    cells: {
      "中国": "用户使用",
      "美国": "Yearn Finance、Convex Finance、Beefy Finance、Aura Finance",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "链游玩赚" as const,
    domain: "GameFi",
    cells: {
      "中国": "用户使用、StepN（团队）",
      "美国": "Axie Infinity（历史）、The Sandbox、Decentraland、Illuvium、Gods Unchained",
      "印尼": "用户使用",
      "越南": "Sky Mavis（Ronin）、Ancient8、Axie Infinity玩家",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "Yield Guild Games（YGG）、Axie Infinity（历史核心市场）",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "游戏资产交易" as const,
    domain: "GameFi",
    cells: {
      "中国": "用户使用",
      "美国": "OpenSea、Blur、Immutable X Marketplace、Treasure",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "游戏公会参与" as const,
    domain: "GameFi",
    cells: {
      "中国": "用户使用",
      "美国": "Yield Guild Games、Merit Circle、Avocado DAO、IndiGG",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "IndiGG",
      "菲律宾": "Yield Guild Games（YGG）核心市场",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "去中心化社交" as const,
    domain: "SocialFi",
    cells: {
      "中国": "用户使用",
      "美国": "Lens Protocol、Farcaster、Friend.tech、DeSo、Nostr",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "创作者代币" as const,
    domain: "SocialFi",
    cells: {
      "中国": "用户使用",
      "美国": "Friend.tech Keys、Rally（已关闭）、Roll、BitClout（DeSo）",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "内容打赏" as const,
    domain: "SocialFi",
    cells: {
      "中国": "用户使用",
      "美国": "Mirror、Paragraph、Stack、Hypersub、Zora",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "PFP头像/身份" as const,
    domain: "数字藏品",
    cells: {
      "中国": "用户使用",
      "美国": "CryptoPunks、Bored Ape Yacht Club、Azuki、Moonbirds、Doodles",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "音乐/艺术收藏" as const,
    domain: "数字藏品",
    cells: {
      "中国": "用户使用",
      "美国": "Royal、Sound、Catalog、Async Art、SuperRare、Foundation",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "品牌会员/权益" as const,
    domain: "数字藏品",
    cells: {
      "中国": "用户使用",
      "美国": "Nike .SWOOSH、Adidas Originals、Starbucks Odyssey（已关闭）、Reddit Collectible Avatars",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "票务/入场凭证" as const,
    domain: "数字藏品",
    cells: {
      "中国": "用户使用",
      "美国": "YellowHeart、GET Protocol、NFT TiX、Tokenproof",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "稳定币汇款" as const,
    domain: "跨境支付",
    cells: {
      "中国": "用户使用（OTC）",
      "美国": "Circle（USDC）、Tether（USDT）、Strike、Bitso",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "Bitso（美墨走廊）",
      "印度": "用户使用",
      "菲律宾": "用户使用（海外劳工）",
      "泰国": "用户使用",
      "尼日利亚": "用户使用（侨汇替代）",
      "阿根廷": "用户使用（通胀对冲）",
      "土耳其": "用户使用（里拉贬值）",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "加密货币支付" as const,
    domain: "跨境支付",
    cells: {
      "中国": "用户使用",
      "美国": "BitPay、Coinbase Commerce、Flexa、Strike、Lightning Network",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用",
      "阿根廷": "用户使用",
      "土耳其": "用户使用",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
  {
    l1: "Web3" as const,
    l2: "抗通胀储蓄" as const,
    domain: "跨境支付",
    cells: {
      "中国": "用户使用（OTC/灰色）",
      "美国": "用户使用",
      "印尼": "用户使用",
      "越南": "用户使用",
      "巴西": "用户使用",
      "墨西哥": "用户使用",
      "印度": "用户使用",
      "菲律宾": "用户使用",
      "泰国": "用户使用",
      "尼日利亚": "用户使用（奈拉贬值）",
      "阿根廷": "核心场景（比索崩溃）",
      "土耳其": "核心场景（里拉暴跌）",
      "韩国": "用户使用",
      "日本": "用户使用",
    },
  },
];

const WEB3_MARKET_NOTES: { market: string; coreScenes: string; examples: string; context: string }[] = [
  {"market": "菲律宾", "coreScenes": "GameFi（历史）、稳定币汇款", "examples": "Yield Guild Games（YGG）、Axie Infinity（2021-2022高峰）、Coins.ph", "context": "海外劳工汇款需求、游戏公会模式发源地"},
  {"market": "越南", "coreScenes": "GameFi开发、公链", "examples": "Sky Mavis（Ronin链）、Ancient8", "context": "开发者密集、Axie Infinity团队来源"},
  {"market": "印尼", "coreScenes": "CEX合规交易、支付整合", "examples": "Indodax、Tokocrypto（币安投资）、Pintu", "context": "Bappebti监管清晰、穆斯林金融需求"},
  {"market": "巴西", "coreScenes": "CEX、数字银行+加密、NFT", "examples": "Mercado Bitcoin、Nubank（加密整合）、Foxbit", "context": "Pix系统便利法币出入金、拉美最大市场"},
  {"market": "墨西哥", "coreScenes": "稳定币汇款、CEX", "examples": "Bitso（Ripple ODL）、Volabit", "context": "美墨汇款走廊、近岸外包金融需求"},
  {"market": "尼日利亚", "coreScenes": "P2P交易、抗通胀储蓄、稳定币汇款", "examples": "Yellow Card、Quidax、Patricia、Paxful（历史）", "context": "奈拉持续贬值、央行曾禁止银行服务加密"},
  {"market": "阿根廷", "coreScenes": "抗通胀储蓄、稳定币支付", "examples": "Lemon Cash、Buenbit、Ripio、SatoshiTango", "context": "比索崩溃、通胀100%+、美元化替代"},
  {"market": "土耳其", "coreScenes": "抗通胀储蓄、CEX", "examples": "BtcTurk、Paribu、Bitexen", "context": "里拉暴跌、资本管制、加密替代美元"},
  {"market": "韩国", "coreScenes": "CEX交易、GameFi、SocialFi", "examples": "Upbit、Bithumb、Wemade（链游）、Kaia（原Klaytn）", "context": "泡菜溢价、游戏强国、监管严格（实名制）"},
  {"market": "日本", "coreScenes": "CEX合规交易、企业NFT", "examples": "bitFlyer、Coincheck、GMO Coin、Sorare（运营）", "context": "金融厅监管严格、法币交易所牌照稀缺"},
];

const WEB3_FINANCE_OPPS: { scene: string; priorityMarkets: string; product: string; players: string }[] = [
  {"scene": "CEX杠杆借贷", "priorityMarkets": "韩国、美国、全球", "product": "保证金借贷、信用卡入金、工资直连", "players": "Binance Margin、Coinbase（历史）、Upbit"},
  {"scene": "NFT BNPL/抵押", "priorityMarkets": "美国、韩国、全球", "product": "先买后付、NFTfi抵押贷款", "players": "Teller、BendDAO、JPEG'd、Blur（Blend）"},
  {"scene": "链游入门金融化", "priorityMarkets": "菲律宾、越南、东南亚", "product": "奖学金模式、游戏资产分期", "players": "YGG、Merit Circle、Avocado DAO、IndiGG"},
  {"scene": "DeFi信用贷", "priorityMarkets": "全球（早期）", "product": "链上信用评分、无抵押借贷", "players": "Arcx、Spectral、Teller、Goldfinch（机构向）"},
  {"scene": "稳定币汇款+储蓄", "priorityMarkets": "阿根廷、土耳其、尼日利亚、墨西哥、菲律宾", "product": "嵌入式储蓄生息、汇款即理财", "players": "Bitso、Strike、Yellow Card、Lemon Cash"},
  {"scene": "流动性质押", "priorityMarkets": "以太坊生态全球", "product": "LST代币、再质押、收益聚合", "players": "Lido、EigenLayer、Ether.fi、Jito"},
  {"scene": "SocialFi创作者金融", "priorityMarkets": "全球（极早期）", "product": "创作者收益预支、代币质押借款", "players": "无成熟产品，Friend.tech探索中"},
];

/**
 * 场景原生三项指标（公开信息粗口径，非审计）：
 * - 规模：全场景 GMV/GTV（能披露的最宽口径）
 * - 用户：全场景用户（年活/月活/交易用户，以公告为准）
 * - 增速：集团总收入 YoY
 * 进度条为组内相对示意（规模以美团全口径≈1.2万亿人民币为满格；用户以微信≈14亿为满格；增速以 |YoY| 50% 为满格）。
 */
type PlatformArchetype = "超级平台" | "综合平台" | "垂直平台";
type PlayerKpi = {
  ticker?: string;
  archetype?: PlatformArchetype;
  /** 规模文案 */
  gmv: string;
  gmvFill: number;
  /** 用户文案 */
  users: string;
  usersFill: number;
  /** 集团收入 YoY 文案 */
  growth: string;
  growthFill: number;
  note?: string;
};

const SCENE_PLAYER_KPI: Record<string, PlayerKpi> = {
  "蚂蚁集团/支付宝（蚂蚁·CN）": {
    archetype: "超级平台",
    gmv: "支付年交易额约¥300万亿级（生态口径；待核最新）",
    gmvFill: 100,
    users: "年活/生态常称10亿+；MAU约6–7亿",
    usersFill: 50,
    growth: "未单独上市披露集团收入YoY",
    growthFill: 0,
    note: "规模为支付流水量级，非商品GMV",
  },
  "腾讯控股/微信（腾讯·CN）": {
    ticker: "0700.HK",
    archetype: "超级平台",
    gmv: "小程序GMV双位数增长（未披露全量绝对值）",
    gmvFill: 40,
    users: "微信MAU约14.1–14.3亿（2025末/2026初）",
    usersFill: 100,
    growth: "腾讯集团收入FY2025约+14%",
    growthFill: 28,
  },
  "美团（美团·CN）": {
    ticker: "3690.HK",
    archetype: "超级平台",
    gmv: "全场景GTV约¥1.2万亿级（历史披露量级；FY2025双位数增长）",
    gmvFill: 100,
    users: "年交易用户创新高（FY2024>7.7亿；FY2025再创新高）",
    usersFill: 55,
    growth: "集团收入FY2025 ¥3649亿 · YoY +8%",
    growthFill: 16,
  },
  "京东集团/京东（京东·CN）": {
    ticker: "JD.US / 9618.HK",
    archetype: "综合平台",
    gmv: "零售GMV约¥3万亿级（第三方/历史口径；待核最新）",
    gmvFill: 100,
    users: "年活用户约6–7亿级",
    usersFill: 48,
    growth: "集团收入YoY中个位数（近年放缓；待核最新年报）",
    growthFill: 8,
  },
  "滴滴出行/滴滴（滴滴·CN）": {
    ticker: "DIDIY.US",
    archetype: "超级平台",
    gmv: "中国出行GTV未稳定披露；Q4'25日均约3890万单",
    gmvFill: 35,
    users: "MAU未稳定披露（以订单规模对照）",
    usersFill: 20,
    growth: "集团收入YoY待核最新年报",
    growthFill: 0,
  },
  "Sea Limited/Shopee（Sea·SEA）": {
    ticker: "SE.US",
    archetype: "综合平台",
    gmv: "Shopee GMV FY2025 $127.4B（+26.8% YoY）",
    gmvFill: 74,
    users: "不披露统一MAU（以订单/GMV对照）",
    usersFill: 25,
    growth: "Sea集团收入FY2025 $22.9B · YoY +36.4%",
    growthFill: 73,
  },
  "Grab Holdings/Grab（Grab·SEA）": {
    ticker: "GRAB.US",
    archetype: "超级平台",
    gmv: "On-Demand GMV FY2025 $22.1B（+21%）",
    gmvFill: 18,
    users: "集团MTU FY2025均约4720万；Q4'25 5050万",
    usersFill: 34,
    growth: "集团收入FY2025 $3.37B · YoY +20%",
    growthFill: 40,
  },
  "GoTo/Gojek（GoTo·ID）": {
    ticker: "GOTO.JK",
    archetype: "综合平台",
    gmv: "集团GTV FY2025约IDR 686万亿（约+$40B级）",
    gmvFill: 25,
    users: "ATU FY2025约6600万",
    usersFill: 47,
    growth: "集团净收入FY2025约+24% YoY",
    growthFill: 48,
  },
  "Delivery Hero/Foodpanda（Foodpanda·SEA）": {
    ticker: "DHER.DE",
    archetype: "垂直平台",
    gmv: "Delivery Hero全球GMV约€40B+级（区域Foodpanda待拆）",
    gmvFill: 30,
    users: "区域用户待拆（东南亚份额承压）",
    usersFill: 15,
    growth: "集团收入YoY个位数–低双位数（待核最新）",
    growthFill: 12,
  },
  "Xanh SM（Xanh SM·VN）": {
    archetype: "垂直平台",
    gmv: "未公开",
    gmvFill: 0,
    users: "未公开",
    usersFill: 0,
    growth: "未公开",
    growthFill: 0,
  },
  "Lazada/Lazada（Lazada·SEA）": {
    archetype: "垂直平台",
    gmv: "SEA电商GMV份额落后Shopee（绝对值未公开）",
    gmvFill: 12,
    users: "未公开统一MAU",
    usersFill: 10,
    growth: "阿里国际数字商业分部口径；单体YoY待核",
    growthFill: 0,
  },
  "ByteDance/TikTok（字节·SEA）": {
    archetype: "超级平台",
    gmv: "TikTok Shop全球GMV高速增长（区域全口径待拆）",
    gmvFill: 45,
    users: "全球月活十余亿级（集团；国别待拆）",
    usersFill: 90,
    growth: "字节集团收入高双位数增长（未上市；估算）",
    growthFill: 60,
  },
  "Akulaku/Akulaku（阿卡拉克·SEA）": {
    archetype: "综合平台",
    gmv: "电商+信贷GMV未统一披露",
    gmvFill: 8,
    users: "注册>4000万（至2024）",
    usersFill: 28,
    growth: "未公开集团收入YoY",
    growthFill: 0,
  },
  "PhonePe/PhonePe（PhonePe·IN）": {
    archetype: "超级平台",
    gmv: "UPI支付流水印度头部（年交易额数十万亿卢比级）",
    gmvFill: 55,
    users: "MAC约2.38亿",
    usersFill: 17,
    growth: "交易笔数/金额双位数增长（收入YoY未上市披露）",
    growthFill: 30,
  },
  "One97/Paytm（Paytm·IN）": {
    ticker: "PAYTM.NS",
    archetype: "综合平台",
    gmv: "支付+信贷GMV待核最新年报",
    gmvFill: 15,
    users: "MTU约7500–7600万",
    usersFill: 54,
    growth: "集团收入YoY近年承压/转正波动（待核最新）",
    growthFill: 5,
  },
  "Flipkart/Flipkart（Flipkart·IN）": {
    archetype: "综合平台",
    gmv: "印度电商GMV头部梯队（沃尔玛控股；绝对值待核）",
    gmvFill: 28,
    users: "年活约2.2–2.4亿",
    usersFill: 17,
    growth: "GMV/收入双位数增长（非独立上市）",
    growthFill: 25,
  },
  "DiDi/99（滴滴·LATAM）": {
    ticker: "DIDIY.US",
    archetype: "综合平台",
    gmv: "拉美出行+外卖GTV待集团拆分披露",
    gmvFill: 16,
    users: "墨约3000万、巴约5500万活跃量级",
    usersFill: 40,
    growth: "国际业务收入YoY待核最新年报",
    growthFill: 0,
  },
  "Mercado Libre/Mercado Libre（美卡多·LATAM）": {
    ticker: "MELI.US",
    archetype: "超级平台",
    gmv: "Commerce GMV FY2025 $65B（+26% YoY）",
    gmvFill: 38,
    users: "年独特买家>1.2亿；Pago MAU近7800万",
    usersFill: 86,
    growth: "集团净收入FY2025约+39% YoY",
    growthFill: 78,
  },
  "Rappi/Rappi（Rappi·LATAM）": {
    archetype: "垂直平台",
    gmv: "拉美即时配送GMV未公开精确值",
    gmvFill: 10,
    users: "宣称活跃3000万+",
    usersFill: 21,
    growth: "未上市；收入YoY待核实",
    growthFill: 0,
  },
  "饿了么（饿了么·CN）": {
    archetype: "垂直平台",
    gmv: "外卖GTV约¥0.4–0.6万亿级（估算/行业对照）",
    gmvFill: 42,
    users: "年活待核实（阿里本地生活分部）",
    usersFill: 25,
    growth: "并入阿里本地生活；单体收入YoY未单列",
    growthFill: 0,
  },
  "Safaricom/M-Pesa（M-Pesa·KE）": {
    ticker: "SCOM.NR",
    archetype: "超级平台",
    gmv: "移动货币年交易额肯尼亚GDP量级占比高",
    gmvFill: 20,
    users: "肯尼亚月活约3600–4400万",
    usersFill: 30,
    growth: "Safaricom集团收入YoY中个位数–低双位数",
    growthFill: 12,
  },
  "OPay/OPay（OPay·NG）": {
    archetype: "综合平台",
    gmv: "尼日利亚支付流水头部（绝对值待核）",
    gmvFill: 12,
    users: "月末交易活跃约3932万",
    usersFill: 28,
    growth: "未上市；交易规模高增长（收入YoY待核）",
    growthFill: 40,
  },
  "Amazon/Amazon（亚马逊·US）": {
    ticker: "AMZN.US",
    archetype: "超级平台",
    gmv: "全球电商+广告等GMV/销售额数万亿美元级",
    gmvFill: 100,
    users: "Prime/账户数亿级",
    usersFill: 70,
    growth: "集团净销售额YoY约+10%级（近年）",
    growthFill: 20,
  },
  "Block/Cash App（Block·US）": {
    ticker: "XYZ.US",
    archetype: "综合平台",
    gmv: "Cash App支付体积数百亿美元级（待核最新）",
    gmvFill: 22,
    users: "月交易活跃约5900万",
    usersFill: 42,
    growth: "Block集团收入YoY约低双位数（待核最新）",
    growthFill: 22,
  },
};

function parseApproxUsersFill(text: string): number {
  const s = text || "";
  const yi = s.match(/([\d.]+)\s*亿/);
  if (yi) return Math.min(100, Math.round((parseFloat(yi[1]) / 14) * 100));
  const wan = s.match(/([\d.]+)\s*万/);
  if (wan) return Math.min(100, Math.round((parseFloat(wan[1]) / 140000) * 100));
  const m = s.match(/([\d.]+)\s*M\b/i) || s.match(/([\d.]+)百万/);
  if (m) return Math.min(100, Math.round((parseFloat(m[1]) / 1400) * 100));
  return 0;
}

function parseGrowthFill(text: string): number {
  const m = text.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
  if (!m) return 0;
  return Math.min(100, Math.round((Math.abs(parseFloat(m[1])) / 50) * 100));
}

function resolveSceneKpi(r: SceneRow): PlayerKpi {
  const hit = SCENE_PLAYER_KPI[r.group];
  if (hit) return hit;
  const usersRaw = r.mau && r.mau !== "未公开" ? r.mau : r.registered || "待核实";
  const gmvFromShare =
    /GMV|GTV|交易额|流水/.test(`${r.share} ${r.mau} ${r.trafficRank}`)
      ? `${r.share || r.mau}`.slice(0, 48)
      : "规模待核实";
  return {
    gmv: gmvFromShare,
    gmvFill: /待核实|未公开/.test(gmvFromShare) ? 0 : 8,
    users: usersRaw.includes("未公开") ? "用户待核实" : usersRaw,
    usersFill: parseApproxUsersFill(usersRaw),
    growth: "集团收入YoY待核实",
    growthFill: 0,
  };
}

function resolveCreditKpi(r: CreditRow): PlayerKpi {
  const scale = creditScaleFromVolume(r.volume);
  const usersRaw = (r.users || "").trim() || "待核实";
  const growthSrc = `${r.note} ${r.timing}`;
  const growthMatch = growthSrc.match(/(收入|营收|revenue)[^\d+-]{0,8}([+-]?\d+(?:\.\d+)?)\s*%/i);
  const growth = growthMatch
    ? `收入YoY ${growthMatch[2]}%（备注/时点摘录）`
    : "集团收入YoY待核实";
  return {
    gmv: scale.label,
    gmvFill: scale.fill,
    users: /待核实|未公开/.test(usersRaw) ? "用户待核实" : usersRaw.split(/[；;]/)[0],
    usersFill: parseApproxUsersFill(usersRaw),
    growth,
    growthFill: parseGrowthFill(growth),
  };
}

/** trafficRank 业务名 → 一级场景标签（与 SCENE_TAG_ORDER 对齐） */
const DEPTH_ALIAS_TO_SCENE: Record<string, SceneTag> = {
  外卖: "外卖",
  到店: "本地生活",
  酒旅: "本地生活",
  买菜: "本地生活",
  本地生活: "本地生活",
  打车: "出行",
  出行: "出行",
  电商: "电商",
  游戏: "游戏",
  支付: "支付钱包",
  支付钱包: "支付钱包",
  信用: "信用管理",
  信用管理: "信用管理",
  社交: "社交",
  直播: "直播",
  内容资讯: "内容资讯",
  企业服务: "企业服务",
  法律服务: "法律服务",
  在线教育: "在线教育",
  在线医疗: "在线医疗",
  Web3: "Web3",
};

function parseSceneDepthMap(trafficRank: string): Partial<Record<SceneTag, PlatformBizDepth>> {
  const out: Partial<Record<SceneTag, PlatformBizDepth>> = {};
  const re = /([^\s｜|·●○]+)([●○])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(trafficRank)) !== null) {
    const tag = DEPTH_ALIAS_TO_SCENE[m[1].trim()];
    if (!tag) continue;
    const depth: PlatformBizDepth = m[2] === "●" ? "core" : "extend";
    if (out[tag] !== "core") out[tag] = depth;
  }
  return out;
}

function resolveSceneTagDepthMap(
  group: string,
  tags: SceneTag[],
  trafficRank: string,
): Partial<Record<SceneTag, PlatformBizDepth>> {
  const fromTraffic = parseSceneDepthMap(trafficRank);
  const fromConfig = SCENE_TAG_DEPTH_BY_GROUP[group] ?? {};
  const out: Partial<Record<SceneTag, PlatformBizDepth>> = { ...fromTraffic, ...fromConfig };
  for (const t of tags) {
    if (!out[t]) out[t] = "core";
  }
  return out;
}

function formatSceneTagDepthLine(group: string, tags: SceneTag[], trafficRank: string): string {
  const depthMap = resolveSceneTagDepthMap(group, tags, trafficRank);
  return tags
    .map((t) => {
      const d = depthMap[t] ?? "core";
      return `${SCENE_TAG_LABEL[t]}${d === "core" ? "●" : "○"}`;
    })
    .join(" ");
}

/** 信贷规模条：以约 RMB3500 亿/年撮合为满格参照（非审计） */
function creditScaleFromVolume(volume: string): { label: string; fill: number } {
  const v = (volume || "").trim();
  if (!v || /待核实|未公开|细数待/.test(v)) return { label: v || "—", fill: 0 };
  const label = v.split(/[；;]/)[0].trim();
  const rmbYi = v.match(/RMB\s*([\d.]+)\s*亿/i) || v.match(/(?:约|撮合|发起|交易额)?\s*([\d.]+)\s*亿/);
  const usdYi = v.match(/\$\s*([\d.]+)\s*亿/);
  const usdB = v.match(/\$\s*([\d.]+)\s*B\b/i) || v.match(/\$\s*([\d.]+)B\b/i);
  let yi = 0;
  if (rmbYi) yi = parseFloat(rmbYi[1]);
  else if (usdYi) yi = parseFloat(usdYi[1]) * 7;
  else if (usdB) yi = parseFloat(usdB[1]) * 70;
  if (!Number.isFinite(yi) || yi <= 0) return { label, fill: 0 };
  return { label, fill: Math.max(1, Math.min(100, Math.round((yi / 3500) * 100))) };
}

function formatCreditProductDepthLine(r: CreditRow): string {
  const parts: string[] = [`${LINE_LABEL[r.line]}●`];
  for (const t of r.tags) {
    parts.push(`${CREDIT_TAG_LABEL[t]}○`);
  }
  return parts.join(" ");
}

/** 上市公司代码（公开行情代码；优先于 equity 字段解析） */
const LISTED_TICKER_BY_GROUP: Record<string, string> = {
  "FinVolution/信也（信也·CN）": "FINV.N",
  "奇富科技/奇富借条/Qfin（奇富·CN）": "QFIN.O",
  "乐信/分期乐/Lexin（乐信·CN）": "LX.O",
  "嘉银科技/嘉银/Jiayin（嘉银·CN）": "JFIN.O",
  "宜人金科/宜人贷（宜人·CN）": "YRD.N",
  "维信金科/Vcredit（维信·CN）": "2003.HK",
  "Sea Limited/Shopee（Sea·SEA）": "SE.N",
  "Grab Holdings/Grab（Grab·SEA）": "GRAB.O",
  "GoTo/Gojek（GoTo·ID）": "GOTO.JK",
  "Delivery Hero/Foodpanda（Foodpanda·SEA）": "DHER.DE",
  "One97/Paytm（Paytm·IN）": "PAYTM.NS",
  "DiDi/99（滴滴·LATAM）": "DIDIY.O",
  "滴滴出行/滴滴（滴滴·CN）": "DIDIY.O",
  "Mercado Libre/Mercado Libre（美卡多·LATAM）": "MELI.O",
  "美团（美团·CN）": "3690.HK",
  "腾讯控股/微信（腾讯·CN）": "0700.HK",
  "京东集团/京东（京东·CN）": "JD.O / 9618.HK",
  "拼多多（拼多多·CN）": "PDD.O",
  "阿里巴巴/淘宝天猫（淘宝·CN）": "BABA.N / 9988.HK",
  "Amazon/Amazon（亚马逊·US）": "AMZN.O",
  "Block/Cash App（Block·US）": "XYZ.N",
  "Bank Neo Commerce/Neo Pinjam（BNC·ID）": "BBYB.JK",
  "Safaricom/M-Pesa（M-Pesa·KE）": "SCOM.NR",
  "百融云创｜百融｜Bairong（风控服务方·CN）": "6608.HK",
  "FICO｜FICO｜FICO（风控服务方·US）": "FICO.N",
  "Nu Holdings/Nubank（Nubank·LATAM）": "NU.N",
  "PagSeguro/PagBank（PagBank·LATAM）": "PAGS.N",
  "XP Inc（XP·BR）": "XP.O",
  "Affirm（Affirm·US）": "AFRM.O",
  "Upstart（Upstart·US）": "UPST.O",
  "SoFi（SoFi·US）": "SOFI.O",
  "LendingClub（LendingClub·US）": "LC.N",
  "Klarna（Klarna·EU）": "未上市/私募",
  "Bajaj Finance（·IN）": "BAJFINANCE.NS",
};

const LISTED_TICKER_BY_BRAND: Record<string, string> = {
  "信也·CN": "FINV.N",
  "奇富·CN": "QFIN.O",
  "乐信·CN": "LX.O",
  "嘉银·CN": "JFIN.O",
  "美团·CN": "3690.HK",
  "腾讯·CN": "0700.HK",
  "京东·CN": "JD.O / 9618.HK",
  "拼多多·CN": "PDD.O",
  "淘宝·CN": "BABA.N / 9988.HK",
  "Sea·SEA": "SE.N",
  "Grab·SEA": "GRAB.O",
  "GoTo·ID": "GOTO.JK",
  "Paytm·IN": "PAYTM.NS",
  "滴滴·CN": "DIDIY.O",
  "滴滴·LATAM": "DIDIY.O",
  "美卡多·LATAM": "MELI.O",
  "亚马逊·US": "AMZN.O",
  "Block·US": "XYZ.N",
};

function resolveListedTicker(group: string, equity?: string): string | undefined {
  if (LISTED_TICKER_BY_GROUP[group]) return LISTED_TICKER_BY_GROUP[group];
  const brand = creditBrandKey(group);
  if (LISTED_TICKER_BY_BRAND[brand]) return LISTED_TICKER_BY_BRAND[brand];
  const eq = (equity || "").match(
    /(?:NYSE|NASDAQ|HKEX|HK|IDX|NSE|BSE|NYSE American):\s*([A-Z0-9.]+)/i,
  );
  if (eq) return eq[1].toUpperCase();
  const bare = (equity || "").match(/\b([A-Z]{1,5}\.(?:N|O|HK|JK|NS|DE|US))\b/);
  if (bare) return bare[1];
  return undefined;
}

/** 监管官网（上挂详情与列表摘要） */
const REGULATOR_OFFICIAL_URL: Record<string, string> = {
  "中国人民银行｜人行｜PBOC（监管·CN）": "https://www.pbc.gov.cn/",
  "国家金融监督管理总局｜金管总局｜NFRA（监管·CN）": "https://www.nfra.gov.cn/",
  "中国互联网金融协会｜互金协会｜NIFA（监管·CN）": "https://www.nifa.org.cn/",
  "国家市场监督管理总局｜市监总局｜SAMR（监管·CN）": "https://www.samr.gov.cn/",
  "国家税务总局｜税总｜STA（监管·CN）": "https://www.chinatax.gov.cn/",
  "中国证券监督管理委员会｜证监会｜CSRC（监管·CN）": "https://www.csrc.gov.cn/",
  "Bank Indonesia｜BI｜印尼央行（监管·ID）": "https://www.bi.go.id/",
  "Otoritas Jasa Keuangan｜OJK｜金监局（监管·ID）":
    "https://www.ojk.go.id/id/kanal/iknb/data-dan-statistik/direktori/fintech/default.aspx",
  "Reserve Bank of India｜RBI｜印度央行（监管·IN）": "https://www.rbi.org.in/",
  "Bangko Sentral ng Pilipinas｜BSP｜菲律宾央行（监管·PH）": "https://www.bsp.gov.ph/",
  "Securities and Exchange Commission｜SEC｜菲律宾证监会（监管·PH）": "https://www.sec.gov.ph/",
  "Bank Negara Malaysia｜BNM｜马来西亚央行（监管·MY）": "https://www.bnm.gov.my/",
  "Bank of Thailand｜BOT｜泰国央行（监管·TH）": "https://www.bot.or.th/",
  "State Bank of Vietnam｜SBV｜越南央行（监管·VN）": "https://www.sbv.gov.vn/",
  "Banco Central do Brasil｜BCB｜巴西央行（监管·BR）": "https://www.bcb.gov.br/",
  "Banco de México｜Banxico｜墨西哥央行（监管·MX）": "https://www.banxico.org.mx/",
  "Comisión Nacional Bancaria y de Valores｜CNBV｜墨银监（监管·MX）": "https://www.cnbv.gob.mx/",
  "Monetary Authority of Singapore｜MAS｜新加坡金管局（监管·SG）": "https://www.mas.gov.sg/",
  "Hong Kong Monetary Authority｜HKMA｜香港金管局（监管·HK）": "https://www.hkma.gov.hk/",
  "Financial Conduct Authority｜FCA｜英国金融行为监管局（监管·GB）": "https://www.fca.org.uk/",
  "Consumer Financial Protection Bureau｜CFPB｜美国消费者金融保护局（监管·US）":
    "https://www.consumerfinance.gov/",
  "Federal Trade Commission｜FTC｜美国联邦贸易委员会（监管·US）": "https://www.ftc.gov/",
  "Federal Reserve｜Fed｜美联储（监管·US）": "https://www.federalreserve.gov/",
  "Office of the Comptroller of the Currency｜OCC｜美国货币监理署（监管·US）":
    "https://www.occ.gov/",
  "Securities and Exchange Commission｜SEC｜美国证监会（监管·US）": "https://www.sec.gov/",
  "Bundesanstalt für Finanzdienstleistungsaufsicht｜BaFin｜德国金监局（监管·DE）":
    "https://www.bafin.de/",
  "Saudi Central Bank｜SAMA｜沙特央行（监管·SA）": "https://www.sama.gov.sa/",
  "Central Bank of Bahrain｜CBB｜巴林央行（监管·BH）": "https://www.cbb.gov.bh/",
  "Qatar Central Bank｜QCB｜卡塔尔央行（监管·QA）": "https://www.qcb.gov.qa/",
  "Central Bank of Kuwait｜CBK｜科威特央行（监管·KW）": "https://www.cbk.gov.kw/",
  "Central Bank of Oman｜CBO｜阿曼央行（监管·OM）": "https://cbo.gov.om/",
  "Bank Al-Maghrib｜BAM｜摩洛哥央行（监管·MA）": "https://www.bkam.ma/",
  "Central Bank of Jordan｜CBJ｜约旦央行（监管·JO）": "https://www.cbj.gov.jo/",
  "Bank of Tanzania｜BoT｜坦桑尼亚央行（监管·TZ）": "https://www.bot.go.tz/",
  "Bank of Uganda｜BoU｜乌干达央行（监管·UG）": "https://www.bou.or.ug/",
  "National Bank of Rwanda｜BNR｜卢旺达央行（监管·RW）": "https://www.bnr.rw/",
  "National Bank of Ethiopia｜NBE｜埃塞俄比亚央行（监管·ET）": "https://nbe.gov.et/",
  "Banque Centrale des États de l'Afrique de l'Ouest｜BCEAO｜西非央行（监管·CI）": "https://www.bceao.int/",
  "Financial Sector Conduct Authority｜FSCA｜南非金融行业行为监管局（监管·ZA）":
    "https://www.fsca.co.za/",
  "Central Bank of Sri Lanka｜CBSL｜斯里兰卡央行（监管·LK）": "https://www.cbsl.gov.lk/",
  "Bangladesh Bank｜BB｜孟加拉央行（监管·BD）": "https://www.bb.org.bd/",
  "State Bank of Pakistan｜SBP｜巴基斯坦央行（监管·PK）": "https://www.sbp.org.pk/",
  "Securities and Exchange Commission of Pakistan｜SECP｜巴证监（监管·PK）":
    "https://www.secp.gov.pk/",
  "Australian Securities and Investments Commission｜ASIC｜澳证监（监管·AU）":
    "https://asic.gov.au/",
  "Financial Services Agency｜FSA｜日本金融厅（监管·JP）": "https://www.fsa.go.jp/",
  "Financial Supervisory Service｜FSS｜韩国金融监督院（监管·KR）": "https://www.fss.or.kr/",
};

function resolveRegulatorUrl(group: string, traffic?: string): string | undefined {
  if (REGULATOR_OFFICIAL_URL[group]) return REGULATOR_OFFICIAL_URL[group];
  const t = (traffic || "").trim();
  if (/^https?:\/\//i.test(t)) return t;
  return undefined;
}

/** 牌照@国家/地区：从 licenseReg / licenses 解析已持牌照简表 */
const LICENSE_COUNTRY_ALIAS: Record<string, string> = {
  中国: "中国",
  CN: "中国",
  内地: "中国",
  新加坡: "新加坡",
  SG: "新加坡",
  印尼: "印尼",
  印度尼西亚: "印尼",
  ID: "印尼",
  马来: "马来西亚",
  马来西亚: "马来西亚",
  MY: "马来西亚",
  泰国: "泰国",
  TH: "泰国",
  越南: "越南",
  VN: "越南",
  菲律宾: "菲律宾",
  菲: "菲律宾",
  PH: "菲律宾",
  印度: "印度",
  IN: "印度",
  巴西: "巴西",
  BR: "巴西",
  墨西哥: "墨西哥",
  墨: "墨西哥",
  MX: "墨西哥",
  哥伦比亚: "哥伦比亚",
  智利: "智利",
  秘鲁: "秘鲁",
  美国: "美国",
  US: "美国",
  英国: "英国",
  GB: "英国",
  UK: "英国",
  德国: "德国",
  DE: "德国",
  澳大利亚: "澳大利亚",
  澳: "澳大利亚",
  AU: "澳大利亚",
  香港: "中国香港",
  中国香港: "中国香港",
  HK: "中国香港",
  日本: "日本",
  JP: "日本",
  韩国: "韩国",
  KR: "韩国",
  肯尼亚: "肯尼亚",
  尼日利亚: "尼日利亚",
  巴基斯坦: "巴基斯坦",
  PK: "巴基斯坦",
  孟加拉: "孟加拉",
  BD: "孟加拉",
  斯里兰卡: "斯里兰卡",
  LK: "斯里兰卡",
  沙特: "沙特",
  SA: "沙特",
  哈萨克斯坦: "哈萨克斯坦",
  KZ: "哈萨克斯坦",
};

function normalizeLicenseLabel(raw: string): string {
  let s = raw
    .replace(/^已持[:：]?\s*/i, "")
    .replace(/^申请中[:：]?\s*/i, "")
    .replace(/^牌照[:：]?\s*/i, "")
    .trim();
  if (!s || s === "—" || /待核|待核实|合作路径|分发|导流/.test(s)) return "";
  if (/LPBBTI|P2P/i.test(s)) return "P2P";
  if (/数字银行|支付银行|Digital\s*Bank|Payments?\s*Bank/i.test(s)) return "数字银行";
  if (/商业银行|银行牌照|银行大牌照|吸储|Bank\s*licen/i.test(s) && !/非银行|合作银行|银行合作/.test(s))
    return "银行";
  if (/OLP|Lending\s*Company|放贷|融资公司|Financing\s*Company|P-Loan|Nano\s*Finance/i.test(s))
    return /P-Loan|Nano/i.test(s) ? "P-Loan/Nano" : "放贷";
  if (/Multifinance|多金融/i.test(s)) return "多金融";
  if (/NBFC/i.test(s)) return "NBFC";
  if (/SOFOM|SOFIPO/i.test(s)) return "SOFOM";
  if (/消金|消费金融/i.test(s)) return "消金";
  if (/小贷/i.test(s)) return "小贷";
  if (/助贷/i.test(s)) return "助贷";
  if (/保险经纪|保险代理/i.test(s)) return "保险经纪";
  if (/保险/i.test(s)) return "保险";
  if (/基金代销|证券/i.test(s)) return /证券/.test(s) ? "证券" : "基金代销";
  if (/征信/i.test(s)) return "征信";
  if (/信贷|借贷|现金贷/i.test(s)) return "信贷";
  if (/支付|电子货币|e-?money|钱包|UPI|PSP/i.test(s)) return "支付";
  if (/BNPL|分期/i.test(s)) return "BNPL";
  // 过长则截断
  if (s.length > 12) s = s.slice(0, 12);
  return s;
}

function splitCountries(raw: string): string[] {
  return raw
    .split(/[·・/,/、|｜\s]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => LICENSE_COUNTRY_ALIAS[x] ?? (LICENSE_COUNTRY_ALIAS[x.toUpperCase()] ?? x))
    .filter((x, i, arr) => arr.indexOf(x) === i);
}

const LICENSE_COUNTRY_SHORT: Record<string, string> = {
  新加坡: "新",
  印尼: "印",
  马来西亚: "马",
  泰国: "泰",
  越南: "越",
  菲律宾: "菲",
  中国: "中",
  中国香港: "港",
  日本: "日",
  韩国: "韩",
  美国: "美",
  英国: "英",
  印度: "印度",
  巴西: "巴",
  墨西哥: "墨",
  澳大利亚: "澳",
  德国: "德",
  哥伦比亚: "哥",
  智利: "智",
  秘鲁: "秘",
  肯尼亚: "肯",
  尼日利亚: "尼日",
  巴基斯坦: "巴基",
  孟加拉: "孟",
  斯里兰卡: "斯",
  沙特: "沙",
  哈萨克斯坦: "哈",
};

const LICENSE_SHORT_TO_COUNTRY: Record<string, string> = {
  新: "新加坡",
  印: "印尼",
  马: "马来西亚",
  泰: "泰国",
  越: "越南",
  菲: "菲律宾",
  中: "中国",
  港: "中国香港",
  日: "日本",
  韩: "韩国",
  美: "美国",
  英: "英国",
  印度: "印度",
  巴: "巴西",
  墨: "墨西哥",
  澳: "澳大利亚",
  德: "德国",
  哥: "哥伦比亚",
  智: "智利",
  秘: "秘鲁",
  肯: "肯尼亚",
  尼日: "尼日利亚",
  巴基: "巴基斯坦",
  孟: "孟加拉",
  斯: "斯里兰卡",
  沙: "沙特",
  哈: "哈萨克斯坦",
};

const LICENSE_BRIEF_CATEGORY_ORDER = [
  "支付",
  "信贷",
  "数字银行",
  "银行",
  "放贷",
  "P2P",
  "小贷",
  "消金",
  "助贷",
  "BNPL",
  "多金融",
  "NBFC",
  "SOFOM",
  "P-Loan/Nano",
  "保险经纪",
  "保险",
  "基金代销",
  "证券",
  "征信",
] as const;

type LicenseBriefItem = { brand: string; license: string; countryShort: string };
type LicenseBriefGroup = { category: string; items: LicenseBriefItem[] };

function shortCountryName(full: string): string {
  const c = LICENSE_COUNTRY_ALIAS[full] ?? full;
  return LICENSE_COUNTRY_SHORT[c] ?? c;
}

function licenseBriefCategory(license: string): string {
  const s = license.trim();
  if (/^(MPI|PJP|PSP|eMoney|支付|电子货币|钱包)/i.test(s) || /PSP|eMoney|MPI|PJP/i.test(s))
    return "支付";
  if (/PDKB|数字银行|Payments?\s*Bank/i.test(s)) return "数字银行";
  if (/Moneylender|Financing|放贷|信贷|Lending|OLP/i.test(s)) return "信贷";
  if (/^银行$|商业银行|Bank\s*licen/i.test(s)) return "银行";
  if (/P2P|LPBBTI/i.test(s)) return "P2P";
  if (/小贷/i.test(s)) return "小贷";
  if (/消金|消费金融/i.test(s)) return "消金";
  if (/助贷/i.test(s)) return "助贷";
  if (/BNPL|分期/i.test(s)) return "BNPL";
  if (/Multifinance|多金融/i.test(s)) return "多金融";
  if (/NBFC/i.test(s)) return "NBFC";
  if (/SOFOM|SOFIPO/i.test(s)) return "SOFOM";
  if (/P-Loan|Nano/i.test(s)) return "P-Loan/Nano";
  if (/保险经纪|保险代理/i.test(s)) return "保险经纪";
  if (/保险/i.test(s)) return "保险";
  if (/基金代销/i.test(s)) return "基金代销";
  if (/证券/i.test(s)) return "证券";
  if (/征信/i.test(s)) return "征信";
  const norm = normalizeLicenseLabel(s);
  if (norm && norm !== s) return licenseBriefCategory(norm);
  return norm || "其他";
}

function pushLicenseAt(
  out: string[],
  seen: Set<string>,
  license: string,
  country: string,
) {
  const lic = normalizeLicenseLabel(license);
  const c = LICENSE_COUNTRY_ALIAS[country] ?? country;
  if (!lic || !c || /待核|待核实|—/.test(c)) return;
  const line = `${lic}@${c}`;
  if (seen.has(line)) return;
  seen.add(line);
  out.push(line);
}

function pushBriefItem(
  groups: Map<string, LicenseBriefItem[]>,
  seen: Set<string>,
  category: string,
  brand: string,
  license: string,
  countryShort: string,
) {
  const b = brand.trim();
  const lic = license.trim();
  const cs = countryShort.trim();
  if (!lic || !cs || /待核|待核实|—/.test(cs)) return;
  const key = `${category}|${b}|${lic}|${cs}`;
  if (seen.has(key)) return;
  seen.add(key);
  const list = groups.get(category) ?? [];
  list.push({ brand: b, license: lic, countryShort: cs });
  groups.set(category, list);
}

function formatBriefItem(it: LicenseBriefItem): string {
  return it.brand ? `${it.brand}·${it.license}·${it.countryShort}` : `${it.license}·${it.countryShort}`;
}

/** 仅解析「已持」段；无已持标记则解析全文（仍忽略申请中段） */
function heldLicenseTextForBrief(blob: string): string {
  const raw = (blob || "").trim();
  if (!raw) return "";
  const applyIdx = raw.search(/申请中|拟申请/);
  let held = applyIdx >= 0 ? raw.slice(0, applyIdx) : raw;
  const heldMark = held.search(/已持[:：]/);
  if (heldMark >= 0) held = held.slice(heldMark).replace(/^已持[:：]\s*/, "");
  return held.replace(/^牌照[:：]\s*/, "").trim();
}

function brandHintFromRow(group: string, brands?: string): string {
  const m = group.match(/[（(]([^）)]+)[）)]/);
  if (m) {
    const inner = m[1].split(/[·・/|/]/)[0].trim();
    if (inner && inner.length <= 16) return inner;
  }
  if (brands) {
    const first = brands.split(/[、,/|｜]/)[0].trim();
    if (first && first.length <= 16) return first;
  }
  return group.split(/[\/／]/)[0].trim().slice(0, 12);
}

/** 优先解析「支付：Brand·牌照·国 | …」；否则回退到牌照@国家并转成同格式 */
function parseLicenseBriefGroups(
  brandHint: string,
  ...parts: string[]
): LicenseBriefGroup[] {
  const blob = parts.filter(Boolean).join("；");
  const held = heldLicenseTextForBrief(blob);
  if (!held || /待双端|待核监管名录|金融牌照未单列|牌照：—/.test(held)) return [];

  const groups = new Map<string, LicenseBriefItem[]>();
  const seen = new Set<string>();
  const catNames = LICENSE_BRIEF_CATEGORY_ORDER.join("|");
  const structuredRe = new RegExp(
    `(${catNames}|其他)\\s*[:：]\\s*([^；;\\n]+)`,
    "gi",
  );
  let m: RegExpExecArray | null;
  let structuredHits = 0;
  while ((m = structuredRe.exec(held)) !== null) {
    const category = m[1];
    const chunk = m[2];
    // 跳过旧写法「支付(新加坡·印尼)」——括号国家枚举，无 Brand·牌照·国
    if (/^[^(（]*[(（][^)）]+[)）]\s*$/.test(chunk.trim()) && !/[|｜]/.test(chunk)) {
      continue;
    }
    const cells = chunk.split(/[|｜]/).map((x) => x.trim()).filter(Boolean);
    for (const cell of cells) {
      const bits = cell.split(/[·・]/).map((x) => x.trim()).filter(Boolean);
      if (bits.length >= 3) {
        const countryShort = bits[bits.length - 1];
        const license = bits[bits.length - 2];
        const brand = bits.slice(0, -2).join("·");
        // 国别简称或可映射全称
        const cs =
          LICENSE_SHORT_TO_COUNTRY[countryShort] || LICENSE_COUNTRY_ALIAS[countryShort]
            ? shortCountryName(LICENSE_SHORT_TO_COUNTRY[countryShort] ?? countryShort)
            : countryShort.length <= 3
              ? countryShort
              : shortCountryName(countryShort);
        pushBriefItem(groups, seen, category, brand, license, cs);
        structuredHits += 1;
      }
    }
  }
  if (structuredHits > 0) {
    return sortLicenseBriefGroups(groups);
  }

  // 回退：旧解析 → BrandHint·牌照粗类·国别简称
  for (const line of parseLicenseAtCountryLines(blob)) {
    const [lic, country] = line.split("@");
    if (!lic || !country) continue;
    pushBriefItem(
      groups,
      seen,
      licenseBriefCategory(lic),
      brandHint,
      lic,
      shortCountryName(country),
    );
  }
  return sortLicenseBriefGroups(groups);
}

function sortLicenseBriefGroups(groups: Map<string, LicenseBriefItem[]>): LicenseBriefGroup[] {
  const order = LICENSE_BRIEF_CATEGORY_ORDER as readonly string[];
  const keys = [...groups.keys()].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
  return keys.map((category) => ({ category, items: groups.get(category) ?? [] }));
}

function parseLicenseAtCountryLines(...parts: string[]): string[] {
  const blob = parts.filter(Boolean).join("；");
  const held = heldLicenseTextForBrief(blob);
  if (!held || /待双端|待核监管名录|金融牌照未单列|牌照：—/.test(held)) return [];
  const out: string[] = [];
  const seen = new Set<string>();

  // 0) 新格式：支付：Brand·牌照·国 | …
  const catNames = LICENSE_BRIEF_CATEGORY_ORDER.join("|");
  const structuredRe = new RegExp(
    `(${catNames}|其他)\\s*[:：]\\s*([^；;\\n]+)`,
    "gi",
  );
  let m: RegExpExecArray | null;
  while ((m = structuredRe.exec(held)) !== null) {
    const chunk = m[2];
    if (/^[^(（]*[(（][^)）]+[)）]\s*$/.test(chunk.trim()) && !/[|｜]/.test(chunk)) continue;
    for (const cell of chunk.split(/[|｜]/).map((x) => x.trim()).filter(Boolean)) {
      const bits = cell.split(/[·・]/).map((x) => x.trim()).filter(Boolean);
      if (bits.length < 3) continue;
      const countryShort = bits[bits.length - 1];
      const license = bits[bits.length - 2];
      const full =
        LICENSE_SHORT_TO_COUNTRY[countryShort] ??
        LICENSE_COUNTRY_ALIAS[countryShort] ??
        countryShort;
      pushLicenseAt(out, seen, license, full);
    }
  }

  // 1) 名称(国家·国家)——括号内须能映射为地区，避免把（P2P）误当国家
  const parenRe = /([^·；;、，,\n(（]+?)\s*[(（]([^)）]+)[)）]/g;
  while ((m = parenRe.exec(held)) !== null) {
    const name = m[1].replace(/^[\s·；;、，]+/, "").trim();
    // 跳过「支付：…」段里已被结构化吃掉的内容：若 name 含冒号分类头则仍可解析国家枚举旧式
    const countries = splitCountries(m[2]).filter(
      (c) =>
        Boolean(LICENSE_COUNTRY_ALIAS[c]) ||
        Boolean(LICENSE_COUNTRY_ALIAS[c.toUpperCase()]) ||
        Object.values(LICENSE_COUNTRY_ALIAS).includes(c),
    );
    if (!countries.length) continue;
    for (const c of countries) pushLicenseAt(out, seen, name, c);
  }

  // 2) 国家：描述 / CN：描述 / ID：描述
  const colonRe =
    /(中国|新加坡|印尼|印度尼西亚|马来西亚|马来|泰国|越南|菲律宾|菲|印度|巴西|墨西哥|墨|哥伦比亚|智利|秘鲁|美国|英国|德国|澳大利亚|澳|香港|中国香港|日本|韩国|肯尼亚|尼日利亚|巴基斯坦|孟加拉|斯里兰卡|沙特|哈萨克斯坦|CN|ID|PH|IN|MY|TH|VN|SG|BR|MX|US|HK|AU|PK|BD|LK|SA|KZ)\s*[:：]\s*([^；;\n]+)/gi;
  while ((m = colonRe.exec(held)) !== null) {
    const countries = splitCountries(m[1]);
    const desc = m[2];
    const bits = desc.split(/[·・/|/]/).map((x) => x.trim()).filter(Boolean);
    for (const c of countries) {
      if (bits.length) for (const b of bits) pushLicenseAt(out, seen, b, c);
      else pushLicenseAt(out, seen, desc, c);
    }
  }

  // 3) 无括号叙事：印尼OJK LPBBTI / 菲SEC Lending / 中国助贷
  const loose: [RegExp, string, string][] = [
    [/印尼[^；;]*OJK[^；;]*LPBBTI|印尼[^；;]*P2P/i, "P2P", "印尼"],
    [/印尼[^；;]*Multifinance|印尼[^；;]*多金融/i, "多金融", "印尼"],
    [/印尼[^；;]*银行|BNC银行|商业银行大牌照/i, "银行", "印尼"],
    [/菲律宾[^；;]*银行|OwnBank|农村银行/i, "银行", "菲律宾"],
    [/泰国[^；;]*P-Loan|泰国[^；;]*Nano|Akulaku X/i, "P-Loan/Nano", "泰国"],
    [/菲[^；;]*SEC|菲律宾[^；;]*SEC|JuanHand|OLP/i, "放贷", "菲律宾"],
    [/菲律宾[^；;]*数字银行|Maya[^；;]*数字银行|数字银行[^；;]*菲律宾/i, "数字银行", "菲律宾"],
    [/中国[^；;]*助贷|助贷撮合/i, "助贷", "中国"],
    [/中国[^；;]*消金|消费金融/i, "消金", "中国"],
    [/中国[^；;]*小贷/i, "小贷", "中国"],
    [/中国[^；;]*支付|非银行支付/i, "支付", "中国"],
    [/印度[^；;]*NBFC/i, "NBFC", "印度"],
    [/墨西哥[^；;]*SOFOM|墨[^；;]*SOFOM/i, "SOFOM", "墨西哥"],
    [/巴西[^；;]*数字银行|数字银行大牌照/i, "数字银行", "巴西"],
  ];
  for (const [re, lic, c] of loose) {
    if (re.test(held)) pushLicenseAt(out, seen, lic, c);
  }

  return out;
}

function PlayerLicenseBrief({
  licenseReg,
  licenses,
  brandHint = "",
}: {
  licenseReg: string;
  licenses?: string;
  brandHint?: string;
}) {
  const groups = parseLicenseBriefGroups(brandHint, licenseReg, licenses ?? "");
  return (
    <Stack gap={6}>
      <Text size="small" tone="secondary">
        牌照（已持）
      </Text>
      {groups.length ? (
        <Stack gap={8}>
          {groups.map((g) => (
            <Stack gap={2}>
              <Text size="small" weight="medium">
                {g.category}
              </Text>
              <Text size="small">{g.items.map(formatBriefItem).join(" | ")}</Text>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Text size="small" tone="tertiary">
          待核实 / 合作路径未单列自有牌照
        </Text>
      )}
    </Stack>
  );
}

/** 生态机构：市场定位大类 + 服务性质词条（均标●，表示主业定位） */
function formatEcoRoleDepthLine(r: CreditRow): string {
  const roles = (r.institutionTypes.length ? r.institutionTypes : r.ecoRoles).filter(
    (t) => t !== "玩家",
  ) as InstitutionType[];
  const list = roles.length ? roles : (["流量服务商"] as InstitutionType[]);
  return list.map((t) => `${INSTITUTION_TYPE_LABEL[t]}●`).join(" ");
}

function MetricBar({
  title,
  label,
  fill,
}: {
  title: string;
  label: string;
  fill: number;
}) {
  return (
    <UsageBar
      total={100}
      segments={[{ id: title, value: Math.max(0, Math.min(100, fill)), color: "gray" }]}
      topLeftLabel={title}
      topRightLabel={label}
    />
  );
}

function ThreeMetrics({ kpi }: { kpi: PlayerKpi }) {
  return (
    <Stack gap={6}>
      <Text size="small" tone="tertiary">
        规模=全场景GMV/GTV · 用户=全场景用户 · 增速=集团总收入YoY（公开粗口径）
      </Text>
      <MetricBar title="规模" label={kpi.gmv} fill={kpi.gmvFill} />
      <MetricBar title="用户" label={kpi.users} fill={kpi.usersFill} />
      <MetricBar title="增速" label={kpi.growth} fill={kpi.growthFill} />
      {kpi.note ? (
        <Text size="small" tone="tertiary">
          {kpi.note}
        </Text>
      ) : null}
    </Stack>
  );
}

/** 可点选角标：已选且 clearable 时再点可清除；present=反向映射（该属地已有机构） */
function FilterChip({
  label,
  active,
  present,
  clearable,
  onClick,
}: {
  label: string;
  active: boolean;
  /** 反向亮起：名下已有机构覆盖（未选中时用 info 色提示） */
  present?: boolean;
  clearable?: boolean;
  onClick: () => void;
}) {
  return (
    <Pill
      active={active}
      tone={active ? undefined : present ? "info" : "neutral"}
      size="sm"
      onClick={onClick}
      keyboardHint={active && clearable ? "×" : undefined}
      title={
        active && clearable
          ? "点击清除"
          : present && !active
            ? "已有机构覆盖"
            : present === false
              ? "尚无机构（未创设）"
              : undefined
      }
    >
      {label}
    </Pill>
  );
}

function countriesCoveredByCreditRow(r: CreditRow): Exclude<CountryCode, "all">[] {
  const codes = (Object.keys(COUNTRY_LABEL) as CountryCode[]).filter((c) => c !== "all");
  if (hasWorldwideCoverage(r.countries)) {
    return codes as Exclude<CountryCode, "all">[];
  }
  return codes.filter((c) =>
    matchesCountry(r.group, r.countries, c),
  ) as Exclude<CountryCode, "all">[];
}

function countriesCoveredBySceneRow(r: SceneRow): Exclude<CountryCode, "all">[] {
  const codes = (Object.keys(COUNTRY_LABEL) as CountryCode[]).filter((c) => c !== "all");
  if (hasWorldwideCoverage(r.countries)) {
    return codes as Exclude<CountryCode, "all">[];
  }
  return codes.filter((c) =>
    matchesCountry(r.group, r.countries, c),
  ) as Exclude<CountryCode, "all">[];
}

function regionForCountry(c: Exclude<CountryCode, "all">): Exclude<Region, "all"> | null {
  for (const reg of Object.keys(COUNTRIES_BY_REGION) as Exclude<Region, "all">[]) {
    if (COUNTRIES_BY_REGION[reg].includes(c)) return reg;
  }
  return null;
}

/** 某机构类型（或玩家池）反向映射：哪些洲际/国家已有机构 */
function collectGeoCoverage(rows: { region: Exclude<Region, "all">; countries: Exclude<CountryCode, "all">[] }[]): {
  regions: Set<Exclude<Region, "all">>;
  countries: Set<Exclude<CountryCode, "all">>;
} {
  const regions = new Set<Exclude<Region, "all">>();
  const countries = new Set<Exclude<CountryCode, "all">>();
  for (const r of rows) {
    regions.add(r.region);
    for (const c of r.countries) {
      countries.add(c);
      const reg = regionForCountry(c);
      if (reg) regions.add(reg);
    }
  }
  return { regions, countries };
}

const GEO_SCOPED_ECO_TYPES: InstitutionType[] = [
  "监管",
  "流量服务商",
  "数据服务方",
  "支付服务机构",
  "回收机构",
  "公关服务机构",
  "信托服务机构",
  "会计师事务所",
  "律师事务所",
  "资金参与机构",
  "风险参与机构",
  "权益服务商",
];

function isGeoScopedEcoType(t: InstitutionType): boolean {
  return GEO_SCOPED_ECO_TYPES.includes(t);
}

function regulatorMatchesLicenseKind(r: CreditRow, kind: LicenseKind): boolean {
  const blob = `${r.group} ${r.brands} ${r.licenses} ${r.licenseReg} ${r.note} ${r.regulators}`;
  if (kind === "银行") {
    return /央行|银行|Bank|BSP|RBI|OJK|NFRA|金管|银保监|PBOC|人民银行|BI｜|Banxico|BCB|SBP|CBSL|SAMA|BOT｜|BNM|SBV/i.test(
      blob,
    );
  }
  if (kind === "支付") {
    return /支付|电子货币|e-?money|Payment|PBOC|人民银行|BI｜|BSP|央行/i.test(blob);
  }
  if (kind === "保险") {
    return /保险|Insurance|OJK|NFRA|金管|银保监/i.test(blob);
  }
  if (kind === "消金小贷") {
    return /消金|小贷|助贷|P2P|LPBBTI|NBFC|SOFOM|Lending|OLP|Multifinance|放贷|金融公司|Nano|P-Loan|SECP|SEC｜/i.test(
      blob,
    );
  }
  // 其他：协会/反垄断/税务等对照主体
  return /协会|自律|反垄断|竞争|税务|税总|市监|SAMR|AFPI|NIFA|DLAI|KPPU|CCI|PCC/i.test(blob);
}

/** 监管页 / 玩家页 / 生态机构页共用：洲际 → 国家 → 牌照粗类；presentSets 反向亮起已覆盖属地 */
function GeoAndLicenseFilters({
  region,
  country,
  licenseKind,
  onRegion,
  onCountry,
  onLicenseKind,
  showLicenseKind = true,
  coveredRegions,
  coveredCountries,
}: {
  region: Region;
  country: CountryCode;
  licenseKind: LicenseKind | "all";
  onRegion: (r: Region) => void;
  onCountry: (c: CountryCode) => void;
  onLicenseKind: (k: LicenseKind | "all") => void;
  showLicenseKind?: boolean;
  /** 反向映射：该机构类型已覆盖的洲际（不含 all） */
  coveredRegions?: Set<Exclude<Region, "all">>;
  /** 反向映射：该机构类型已覆盖的国家 */
  coveredCountries?: Set<Exclude<CountryCode, "all">>;
}) {
  const showPresent = Boolean(coveredRegions || coveredCountries);
  const regionPresent = (k: Region) => {
    if (!showPresent) return undefined;
    if (k === "all") return (coveredRegions?.size ?? 0) > 0;
    return coveredRegions?.has(k) ?? false;
  };
  const countryPresent = (k: CountryCode) => {
    if (!showPresent) return undefined;
    if (k === "all") return (coveredCountries?.size ?? 0) > 0;
    return coveredCountries?.has(k) ?? false;
  };
  return (
    <Stack gap={10}>
      <Stack gap={4}>
        <Text size="small" weight="medium">
          涉足洲际
        </Text>
        <Text size="small" tone="tertiary">
          亮起 = 已收录 · 未亮 = 尚未创设
        </Text>
        <Row gap={6} wrap>
          {(Object.keys(REGION_LABEL) as Region[]).map((k) => (
            <FilterChip
              label={REGION_LABEL[k]}
              active={region === k}
              present={regionPresent(k)}
              clearable={k !== "all"}
              onClick={() => onRegion(region === k && k !== "all" ? "all" : k)}
            />
          ))}
        </Row>
      </Stack>

      <Stack gap={4}>
        <Text size="small" weight="medium">
          涉足国家/地区
        </Text>
        <Row gap={6} wrap>
          {countriesForRegion(region).map((k) => (
            <FilterChip
              label={COUNTRY_LABEL[k]}
              active={country === k}
              present={countryPresent(k)}
              clearable={k !== "all"}
              onClick={() => onCountry(country === k && k !== "all" ? "all" : k)}
            />
          ))}
        </Row>
      </Stack>

      {showLicenseKind ? (
        <Stack gap={4}>
          <Text size="small" weight="medium">
            涉及金融牌照
          </Text>
          <Row gap={6} wrap>
            <FilterChip
              label="全部牌照粗类"
              active={licenseKind === "all"}
              onClick={() => onLicenseKind("all")}
            />
            {LICENSE_KIND_ORDER.map((k) => (
              <FilterChip
                label={LICENSE_KIND_LABEL[k]}
                active={licenseKind === k}
                clearable
                onClick={() => onLicenseKind(licenseKind === k ? "all" : k)}
              />
            ))}
          </Row>
        </Stack>
      ) : null}
    </Stack>
  );
}

/** 未登录仅展示本页：填写完整邮箱 + 密码；不列出白名单；非受控输入防中文乱码 */
function LoginPage() {
  const theme = useHostTheme();
  const [users, setUsers] = useCanvasState<Record<string, AuthUserRecord>>("authUsers1", {});
  const [, setSession] = useCanvasState("authSession1", "");
  const [, setEmail] = useCanvasState("claimEmail1", "");
  const [showPass, setShowPass] = useCanvasState("loginShowPw1", false);
  const [err, setErr] = useCanvasState("loginErr1", "");
  const userFieldId = "crm-login-user";
  const passFieldId = "crm-login-pass";

  function onLogin() {
    const emailRaw = readLoginField(userFieldId);
    const pass = readLoginField(passFieldId);
    if (!emailRaw || !pass) {
      setErr("请输入邮箱与密码");
      return;
    }
    // 必须完整邮箱；无权限/格式错误统一模糊提示，不暴露域名名单
    if (!emailHasClaimPermission(emailRaw)) {
      setErr("邮箱或密码错误");
      return;
    }
    const key = claimLocalPart(emailRaw);
    const u = resolveAuthUser(users, key);
    if (!u.enabled) {
      setErr("账号不可用，请联系管理员");
      return;
    }
    const isAdmin = isClaimAdmin(key);
    // 管理员可用初始密码自救解锁；其他账号锁定后须管理员重置
    if (u.locked && !(isAdmin && pass === CLAIM_DEFAULT_PASSWORD)) {
      setErr("账号已锁定，请联系管理员重置");
      return;
    }
    if (pass !== u.password) {
      if (isAdmin) {
        setErr("邮箱或密码错误");
      } else {
        setUsers((prev) => ({ ...prev, [key]: { ...u, locked: true } }));
        setErr("密码错误，账号已锁定，请联系管理员重置");
      }
      setLoginField(passFieldId, "");
      return;
    }
    setUsers((prev) => ({
      ...prev,
      [key]: { ...u, locked: false, password: u.password || CLAIM_DEFAULT_PASSWORD },
    }));
    setSession(key);
    setEmail(normalizeClaimEmail(emailRaw));
    setErr("");
    setLoginField(passFieldId, "");
  }

  return (
    <Stack gap={24} style={{ maxWidth: 420 }}>
      <Stack gap={6}>
        <H1>CRM 生态系统</H1>
        <Text size="small" tone="secondary">
          登录后继续
        </Text>
      </Stack>
      <div
        style={mergeStyle({
          padding: 16,
          borderRadius: 12,
          background: theme.bg.elevated,
          border: `1px solid ${theme.stroke.tertiary}`,
        })}
      >
        <Stack gap={12}>
          <Stack gap={4}>
            <Text size="small" weight="medium">
              邮箱
            </Text>
            <LoginNativeField
              inputId={userFieldId}
              type="email"
              placeholder="邮箱"
              autoComplete="username"
            />
          </Stack>
          <Stack gap={4}>
            <Text size="small" weight="medium">
              密码
            </Text>
            <LoginPasswordField
              inputId={passFieldId}
              showPass={showPass}
              onToggle={() => {
                const el = document.getElementById(passFieldId) as {
                  value?: string;
                  type?: string;
                } | null;
                const kept = el?.value ?? "";
                const next = !showPass;
                setShowPass(next);
                // 下一帧写回，避免受控 type 切换时非受控值被冲掉
                setTimeout(() => {
                  const again = document.getElementById(passFieldId) as {
                    value?: string;
                    type?: string;
                  } | null;
                  if (again) {
                    again.type = next ? "text" : "password";
                    again.value = kept;
                  }
                }, 0);
              }}
            />
          </Stack>
          {err ? <Callout tone="danger">{err}</Callout> : null}
          <Row gap={8}>
            <Button variant="primary" onClick={onLogin}>
              登录
            </Button>
          </Row>
        </Stack>
      </div>
    </Stack>
  );
}

/** Cursor 风格登录后身份条：缩写头像 · 名称 · 角色 · Update · 设置 */
function SessionChrome() {
  const theme = useHostTheme();
  const [session, setSession] = useCanvasState("authSession1", "");
  const [users, setUsers] = useCanvasState<Record<string, AuthUserRecord>>("authUsers1", {});
  const [, setEmail] = useCanvasState("claimEmail1", "");
  const [panel, setPanel] = useCanvasState<"none" | "password" | "admin">("authPanel1", "none");
  const [oldPw, setOldPw] = useCanvasState("chgOld1", "");
  const [newPw, setNewPw] = useCanvasState("chgNew1", "");
  const [msg, setMsg] = useCanvasState("sessMsg1", "");

  const user = resolveAuthUser(users, session);
  const admin = isClaimAdmin(session);
  const initials = (user.displayLocal || session || "?").slice(0, 2).toUpperCase();

  function logout() {
    setSession("");
    setEmail("");
    setPanel("none");
    setMsg("");
    setOldPw("");
    setNewPw("");
  }

  function changePassword() {
    const u = resolveAuthUser(users, session);
    if (oldPw !== u.password) {
      setMsg("原密码错误");
      return;
    }
    if (newPw.trim().length < 6) {
      setMsg("新密码至少 6 位");
      return;
    }
    setUsers((prev) => ({ ...prev, [session]: { ...u, password: newPw.trim() } }));
    setOldPw("");
    setNewPw("");
    setMsg("密码已更新");
    setPanel("none");
  }

  function adminReset(local: string) {
    const u = resolveAuthUser(users, local);
    setUsers((prev) => ({
      ...prev,
      [local]: { ...u, password: CLAIM_DEFAULT_PASSWORD, locked: false, enabled: true },
    }));
    setMsg(`已重置 ${canonicalClaimLocal(local)}`);
  }

  function adminToggle(local: string) {
    const u = resolveAuthUser(users, local);
    setUsers((prev) => ({ ...prev, [local]: { ...u, enabled: !u.enabled } }));
  }

  return (
    <Stack gap={10}>
      <div
        style={mergeStyle({
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 10px",
          borderRadius: 10,
          background: theme.bg.elevated,
          border: `1px solid ${theme.stroke.tertiary}`,
        })}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: theme.fill.secondary,
            color: theme.text.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="small" weight="medium">
            {user.displayLocal}
          </Text>
          <Text size="small" tone="tertiary">
            {admin ? "Admin" : "Member"}
          </Text>
        </div>
        <Button
          variant="primary"
          onClick={() => setPanel(panel === "password" ? "none" : "password")}
        >
          Update
        </Button>
        <IconButton
          title="设置"
          size="sm"
          onClick={() => setPanel(panel === "admin" ? "none" : admin ? "admin" : "password")}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <circle cx="7" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M7 1.2v1.4M7 11.4v1.4M1.2 7h1.4M11.4 7h1.4M2.6 2.6l1 1M10.4 10.4l1 1M10.4 2.6l-1 1M2.6 11.4l1-1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </IconButton>
      </div>

      {panel === "password" ? (
        <div
          style={mergeStyle({
            padding: 12,
            borderRadius: 10,
            background: theme.bg.elevated,
            border: `1px solid ${theme.stroke.tertiary}`,
          })}
        >
          <Stack gap={8}>
            <Text size="small" weight="medium">
              更改密码
            </Text>
            <TextInput type="password" value={oldPw} onChange={setOldPw} placeholder="原密码" />
            <TextInput
              type="password"
              value={newPw}
              onChange={setNewPw}
              placeholder="新密码（至少 6 位）"
            />
            <Row gap={8}>
              <Button variant="primary" onClick={changePassword}>
                保存
              </Button>
              <Button variant="ghost" onClick={() => setPanel("none")}>
                取消
              </Button>
              <Button variant="secondary" onClick={logout}>
                退出登录
              </Button>
            </Row>
          </Stack>
        </div>
      ) : null}

      {panel === "admin" && admin ? (
        <div
          style={mergeStyle({
            padding: 12,
            borderRadius: 10,
            background: theme.bg.elevated,
            border: `1px solid ${theme.stroke.tertiary}`,
          })}
        >
          <Stack gap={8}>
            <Text size="small" weight="medium">
              用户管理
            </Text>
            <Text size="small" tone="tertiary">
              重置后恢复初始密码并解锁；可停用账号
            </Text>
            {CLAIM_ALLOWED_LOCALS.map((name) => {
              const key = name.toLowerCase();
              const u = resolveAuthUser(users, key);
              return (
                <Row gap={8} align="center" wrap>
                  <Text size="small" weight="medium">
                    {u.displayLocal}
                  </Text>
                  <Text size="small" tone="tertiary">
                    {u.locked ? "已锁定" : u.enabled ? "正常" : "已停用"}
                  </Text>
                  <Button variant="secondary" onClick={() => adminReset(key)}>
                    重置密码
                  </Button>
                  <Button variant="ghost" onClick={() => adminToggle(key)}>
                    {u.enabled ? "停用" : "启用"}
                  </Button>
                </Row>
              );
            })}
            <Row gap={8}>
              <Button variant="ghost" onClick={() => setPanel("none")}>
                关闭
              </Button>
              <Button variant="secondary" onClick={logout}>
                退出登录
              </Button>
            </Row>
          </Stack>
        </div>
      ) : null}

      {msg ? (
        <Text size="small" tone="tertiary">
          {msg}
        </Text>
      ) : null}
    </Stack>
  );
}

function ListMetaRow({
  count,
  unit = "家",
  children,
}: {
  count: number;
  unit?: string;
  children?: string | null;
}) {
  return (
    <Row gap={8} align="center" wrap>
      {children}
      <Text size="small" tone="secondary">
        {count} {unit}
      </Text>
    </Row>
  );
}

function SourceVerifyBlock({
  orgKey,
  verify,
  trafficRank,
  licenseReg,
}: {
  orgKey: string;
  verify: VerifyStatus;
  trafficRank: string;
  licenseReg: string;
}) {
  const [email] = useCanvasState("claimEmail1", "");
  const [session] = useCanvasState("authSession1", "");
  const [claims, setClaims] = useCanvasState<Record<string, ClaimRecord>>("claims1", {});
  const [note, setNote] = useCanvasState("claimNote1", "");
  const [status, setStatus] = useCanvasState("claimStat1", "");
  const claim = claims[orgKey];
  const can =
    Boolean(session) &&
    emailHasClaimPermission(email) &&
    claimLocalPart(email) === session.trim().toLowerCase();
  const channels = inferSourceChannels(verify, trafficRank, licenseReg, Boolean(claim));
  const complete = verify === "双端通过";

  function submitClaim() {
    if (!can) {
      setStatus("无认领权限：请先登录有效账号");
      return;
    }
    const displayName = defaultClaimDisplayName(email);
    const confirmedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    setClaims((prev) => ({
      ...prev,
      [orgKey]: {
        email: normalizeClaimEmail(email),
        displayName,
        note: note.trim() || "已联系确认；经办对信息质量负责",
        confirmedAt,
      },
    }));
    setNote("");
    setStatus(`已认领 · ${displayName}`);
  }

  function clearClaim() {
    if (!can) {
      setStatus("无认领权限，无法撤销他人认领");
      return;
    }
    if (!claim || normalizeClaimEmail(claim.email) !== normalizeClaimEmail(email)) {
      setStatus("仅本人可撤销自己的认领");
      return;
    }
    setClaims((prev) => {
      const next = { ...prev };
      delete next[orgKey];
      return next;
    });
    setStatus("已撤销认领");
  }

  return (
    <Stack gap={8}>
      <Row gap={8} align="center" wrap>
        <Text size="small" weight="medium">
          信源核实（非经营性征标签）
        </Text>
        {complete ? (
          <Pill tone="success" size="sm">
            完整验证
          </Pill>
        ) : (
          <Pill tone={verifyTone(verify)} size="sm">
            {VERIFY_LABEL[verify]}
          </Pill>
        )}
      </Row>
      <Text size="small" tone="secondary">
        信源一般来自：流量源、监管源、经办认领（客户经理联系确认并对信息质量负责）。系统定期检索信源引入机构；亦可人工创建；未来可扩展更多信源。
      </Text>
      <Row gap={6} wrap>
        {SOURCE_CHANNEL_ORDER.map((c) => (
          <Pill tone={channels.includes(c) ? "info" : "neutral"} size="sm">
            {channels.includes(c) ? `已接入·${c}` : `未接入·${c}`}
          </Pill>
        ))}
      </Row>
      {complete ? (
        <Callout tone="success">
          多源已交叉核实。建议客户经理在更高质量信源（监管登记号补全、经办认领确认）下继续跟进，巩固机构主档。
        </Callout>
      ) : (
        <Callout tone="warning">
          信源未齐或仅单侧。请客户经理优先补齐监管源或发起经办认领，对认领信息质量负责。
        </Callout>
      )}
      <Grid columns={2} gap={10}>
        <DetailField label={SOURCE_CHANNEL_LABEL.流量源} value={trafficRank} />
        <DetailField label={SOURCE_CHANNEL_LABEL.监管源} value={licenseReg} />
      </Grid>
      <Stack gap={6}>
        <Text size="small" tone="tertiary" weight="medium">
          {SOURCE_CHANNEL_LABEL.经办认领}
        </Text>
        {claim ? (
          <Stack gap={4}>
            <Text size="small">
              已认领 · {claim.displayName}（{claim.email}）· {claim.confirmedAt}
            </Text>
            <Text size="small" tone="secondary">
              {claim.note}
            </Text>
            {can && normalizeClaimEmail(claim.email) === normalizeClaimEmail(email) ? (
              <Button variant="ghost" onClick={clearClaim}>
                撤销我的认领
              </Button>
            ) : null}
          </Stack>
        ) : (
          <Stack gap={6}>
            <Text size="small" tone="secondary">
              待有权限客户经理认领回填（联系确认后对信息质量负责）
            </Text>
            {can ? (
              <>
                <TextInput
                  value={note}
                  onChange={setNote}
                  placeholder="确认摘要（可选）：联系人/要点…"
                />
                <Row gap={8}>
                  <Button variant="primary" onClick={submitClaim}>
                    确认认领（{defaultClaimDisplayName(email)}）
                  </Button>
                </Row>
              </>
            ) : (
              <Callout tone="neutral">
                当前未登录或无认领权限。请先登录后再认领。
              </Callout>
            )}
          </Stack>
        )}
        {status ? (
          <Text size="small" tone="tertiary">
            {status}
          </Text>
        ) : null}
      </Stack>
    </Stack>
  );
}

/** 表卡内「详情」折叠：字阶与正文 small/tertiary 一致 */
function CompactDetails({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const key = `cdet_${id.replace(/[^\w\u4e00-\u9fff]+/g, "_").slice(0, 48)}`;
  const [open, setOpen] = useCanvasState(key, false);
  return (
    <Stack gap={6}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        style={{
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          width: "fit-content",
          userSelect: "none",
        }}
      >
        <Text size="small" tone="tertiary" as="span">
          {open ? "▾ 详情" : "▸ 详情"}
        </Text>
      </div>
      {open ? children : null}
    </Stack>
  );
}

function ScenePlayer({ r }: { r: SceneRow }) {
  const complete = r.verify === "双端通过";
  const kpi = resolveSceneKpi(r);
  const ticker = kpi.ticker || resolveListedTicker(r.group, r.equity);
  const depthLine = formatSceneTagDepthLine(r.group, r.tags, r.trafficRank);
  const { title: listTitle, full: fullName } = cardListTitle(r.group);
  const trailingBits = [
    complete ? "完整验证" : null,
    kpi.archetype ?? null,
    REGION_LABEL[r.region],
  ]
    .filter(Boolean)
    .join(" · ");
  const subtitle = fullName !== listTitle ? fullName.replace(/^[^｜]+｜/, "").replace(/｜/g, " · ") : "";
  return (
    <Card>
      <CardHeader trailing={trailingBits}>
        {listTitle}
        {ticker ? ` (${ticker})` : ""}
      </CardHeader>
      <CardBody>
        <Stack gap={8}>
          <Stack gap={4}>
            {subtitle ? (
              <Text size="small" tone="tertiary">
                {subtitle}
              </Text>
            ) : null}
            <Text size="small" tone="secondary">
              业务深度：●核心 ○扩展
            </Text>
            <Text size="small">{depthLine || r.sceneType}</Text>
            <ThreeMetrics kpi={kpi} />
            <PlayerLicenseBrief licenseReg={r.licenseReg} />
          </Stack>
          <CompactDetails id={`sc_${r.group}`}>
            <Stack gap={10}>
              <Stack gap={6}>
                <Text size="small" weight="medium">
                  CRM 机构 KYC
                </Text>
                <Grid columns={2} gap={10}>
                  <DetailField label="机构证件号码（唯一识别）" value={r.orgDocNo} />
                  <DetailField label="控股主体/实控线索" value={r.controller} />
                </Grid>
                <Row gap={6} wrap>
                  {r.institutionTypes.map((t) => (
                    <Pill tone="neutral" size="sm">
                      {INSTITUTION_TYPE_LABEL[t]}
                    </Pill>
                  ))}
                </Row>
                <Text size="small" tone="secondary">
                  机构主档以证件号唯一；类型可含玩家与生态角色。控股主体一般为集团金融/金融生态服务核心主体。
                </Text>
              </Stack>
              <Divider />
              <Stack gap={6}>
                <Text size="small" weight="medium">
                  涉足场景（一级）
                </Text>
                <Row gap={6} wrap>
                  {r.tags.map((t) => (
                    <Pill tone="neutral" size="sm">
                      {SCENE_TAG_LABEL[t]}
                    </Pill>
                  ))}
                  {r.subTags.map((t) => (
                    <Pill tone="neutral" size="sm">
                      {SCENE_TAG_LABEL[SCENE_SUB_PARENT[t]]}/{SCENE_SUB_LABEL[t]}
                    </Pill>
                  ))}
                </Row>
              </Stack>
              <Stack gap={6}>
                <Text size="small" weight="medium">
                  涉及金融牌照
                </Text>
                <Row gap={6} wrap>
                  {r.licenseKinds.length ? (
                    r.licenseKinds.map((k) => (
                      <Pill tone="neutral" size="sm">
                        {LICENSE_KIND_LABEL[k]}
                      </Pill>
                    ))
                  ) : (
                    <Text size="small" tone="tertiary">
                      待从牌照信源归类
                    </Text>
                  )}
                </Row>
              </Stack>
              <Divider />
              <SourceVerifyBlock
                orgKey={r.group}
                verify={r.verify}
                trafficRank={r.trafficRank}
                licenseReg={r.licenseReg}
              />
              <Divider />
              <Grid columns={2} gap={10}>
                <DetailField label="股权" value={r.equity} />
                <DetailField label="APP" value={r.apps} />
                <DetailField label="涉足国家/地区" value={r.countries} />
                <DetailField label="语言" value={r.languages} />
                <DetailField label="月活/活跃" value={r.mau} />
                <DetailField label="注册用户" value={r.registered} />
                <DetailField label="细分市占" value={r.share} />
              </Grid>
              <DetailField label="派生金融产品" value={r.creditAttach} />
              {r.diandian !== r.trafficRank ? (
                <DetailField label="点点/路飞摘要（兼容）" value={r.diandian} />
              ) : null}
            </Stack>
          </CompactDetails>
        </Stack>
      </CardBody>
    </Card>
  );
}

/** 列表卡标题：长名「英｜牌｜中（属地）」压成短标，避免挤爆 CardHeader */
function cardListTitle(group: string, brands?: string): { title: string; full: string } {
  const full = group.trim();
  const bare = full.replace(/（[^）]*）\s*$/, "").trim();
  const parts = bare.split("｜").map((s) => s.trim()).filter(Boolean);
  const brand = (brands ?? "").trim();
  const isReg = /（监管[·･.]/.test(full);
  if (isReg && brand && brand.length <= 32) {
    return { title: brand, full };
  }
  if (brand && brand.length <= 28 && brand !== bare) {
    const zh = parts.length >= 2 ? parts[parts.length - 1] : "";
    if (zh && zh !== brand && !/^[A-Za-z0-9 .&'-]+$/.test(zh)) {
      return { title: `${brand}｜${zh}`, full };
    }
    return { title: brand, full };
  }
  if (parts.length >= 3) {
    return { title: `${parts[1]}｜${parts[2]}`, full };
  }
  if (parts.length === 2) {
    return { title: parts[1].length <= 36 ? parts[1] : parts[0], full };
  }
  return { title: bare.length > 42 ? `${bare.slice(0, 40)}…` : bare || full, full };
}

function CreditPlayer({ r }: { r: CreditRow }) {
  const complete = r.verify === "双端通过";
  const isPlayer = r.institutionTypes.includes("玩家");
  const isRegulator = r.institutionTypes.includes("监管");
  const bucket = primaryInstBucket(r.institutionTypes);
  const hideScaleMetrics = isComplianceIntermediary(r.institutionTypes);
  const kpi = resolveCreditKpi(r);
  const ticker = resolveListedTicker(r.group, r.equity);
  const regulatorUrl = isRegulator ? resolveRegulatorUrl(r.group, r.traffic) : undefined;
  const depthLine = isPlayer ? formatCreditProductDepthLine(r) : formatEcoRoleDepthLine(r);
  const { title: listTitle, full: fullName } = cardListTitle(r.group, r.brands);
  const trailingBits = [complete ? "完整验证" : null, REGION_LABEL[r.region]].filter(Boolean).join(" · ");
  const trafficPolicy = TRAFFIC_CORE_POLICY[r.group];
  const regCashPolicy = REGULATOR_CASH_LENDING_POLICY[r.group];
  const isTrafficVendor = r.institutionTypes.includes("流量服务商");
  const trafficStdSources = isTrafficVendor ? resolveTrafficStandardSources(r) : [];
  const subtitle = (() => {
    if (fullName === listTitle) return "";
    const m = fullName.match(/｜([^｜（]+)（([^）]+)）\s*$/);
    if (m) return `${m[1].trim()}（${m[2].trim()}）`;
    const bare = fullName.replace(/（[^）]*）\s*$/, "");
    const parts = bare.split("｜").map((s) => s.trim()).filter(Boolean);
    return parts.length >= 2 ? parts[parts.length - 1] : fullName;
  })();
  return (
    <Card>
      <CardHeader trailing={trailingBits}>
        {listTitle}
        {ticker ? ` (${ticker})` : ""}
      </CardHeader>
      <CardBody>
        <Stack gap={8}>
          <Stack gap={4}>
            {subtitle ? (
              <Text size="small" tone="tertiary">
                {subtitle}
              </Text>
            ) : null}
            {isPlayer ? (
              <>
                <Text size="small" tone="secondary">
                  业务深度：●核心 ○扩展
                </Text>
                <Text size="small">{depthLine}</Text>
              </>
            ) : (
              <Row gap={8} wrap>
                <Text size="small" tone="secondary">
                  {INST_BUCKET_LABEL[bucket]}
                </Text>
                <Text size="small">{depthLine}</Text>
                {r.tier && r.tier !== "腰部" ? (
                  <Text size="small" tone="tertiary">
                    {r.tier}
                  </Text>
                ) : null}
              </Row>
            )}
            {r.trafficKinds.length ? (
              <Row gap={6} wrap>
                {r.trafficKinds.map((k) => (
                  <Pill tone="neutral" size="sm">
                    {TRAFFIC_KIND_LABEL[k]}
                  </Pill>
                ))}
              </Row>
            ) : null}
            {trafficPolicy ? (
              <Text size="small" tone="tertiary" style={{ fontSize: 11, lineHeight: 1.35 }}>
                现金贷广告：{trafficPolicy.summary}
              </Text>
            ) : null}
            {regCashPolicy ? (
              <Text size="small" tone="tertiary" style={{ fontSize: 11, lineHeight: 1.35 }}>
                现金贷监管：{regCashPolicy.summary}
              </Text>
            ) : null}
            {regulatorUrl ? (
              <Text size="small">
                官网：<Link href={regulatorUrl}>{regulatorUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</Link>
              </Text>
            ) : null}
            {!hideScaleMetrics ? <ThreeMetrics kpi={kpi} /> : null}
            {isPlayer ? (
              <PlayerLicenseBrief licenseReg={r.licenseReg} licenses={r.licenses} />
            ) : null}
          </Stack>
          <CompactDetails id={`cr_${r.group}`}>
            <Stack gap={10}>
              <Stack gap={6}>
                <Text size="small" weight="medium">
                  CRM 机构 KYC
                </Text>
                <Grid columns={2} gap={10}>
                  <DetailField label="机构证件号码（唯一识别）" value={r.orgDocNo} />
                  <DetailField label="控股主体/实控线索" value={r.controller} />
                </Grid>
                <Row gap={6} wrap>
                  {r.institutionTypes.map((t) => (
                    <Pill tone="neutral" size="sm">
                      {INSTITUTION_TYPE_LABEL[t]}
                    </Pill>
                  ))}
                  {r.fundKinds.map((k) => (
                    <Pill tone="neutral" size="sm">
                      {FUND_KIND_LABEL[k]}
                    </Pill>
                  ))}
                </Row>
                <Text size="small" tone="secondary">
                  先有机构再挂类型。中介等生态机构可不含「玩家」；玩家机构可再挂生态角色。
                </Text>
                {hideScaleMetrics ? (
                  <Text size="small" tone="tertiary">
                    监管与合规中介不适用规模 / 用户 / 增速指标
                  </Text>
                ) : null}
              </Stack>
              {trafficPolicy ? (
                <>
                  <Divider />
                  <Stack gap={6}>
                    <Text size="small" weight="medium">
                      流量服务政策（平台广告政策·公开对照）
                    </Text>
                    <DetailField label="政策现状" value={trafficPolicy.status} />
                    <DetailField label="允许范围" value={trafficPolicy.allow} />
                    <DetailField label="代理商模式" value={trafficPolicy.agentMode} />
                    <Text size="small">
                      政策文件：<Link href={trafficPolicy.docs}>{trafficPolicy.docs}</Link>
                    </Text>
                    <Text size="small" tone="tertiary" style={{ fontSize: 11 }}>
                      说明：以上为平台商业广告政策，不是监管立法。监管对现金贷/金融广告的法定要求见对应监管机构详情。
                    </Text>
                  </Stack>
                </>
              ) : null}
              {isTrafficVendor && !trafficPolicy && r.note ? (
                <>
                  <Divider />
                  <DetailField label="流量服务说明" value={r.note} />
                </>
              ) : null}
              {trafficStdSources.length ? (
                <>
                  <Divider />
                  <Stack gap={6}>
                    <Text size="small" weight="medium">
                      标准可采信源（官方政策 / Partner 目录）
                    </Text>
                    <Text size="small" tone="tertiary" style={{ fontSize: 11, lineHeight: 1.35 }}>
                      授权代理商/经销商负责区域销售、账户与投放服务；≠现金贷流量掮客。即使经代理开户，仍须通过平台金融广告审核。资质以目录最新为准。
                    </Text>
                    {trafficStdSources.map((s) => (
                      <Text size="small">
                        [{s.kind}·{s.platform}] {s.label}：<Link href={s.url}>{s.url}</Link>
                      </Text>
                    ))}
                  </Stack>
                </>
              ) : null}
              {regCashPolicy ? (
                <>
                  <Divider />
                  <Stack gap={6}>
                    <Text size="small" weight="medium">
                      现金贷 / 金融广告监管要求（监管详情）
                    </Text>
                    <DetailField label="要点" value={regCashPolicy.summary} />
                    <DetailField label="公开口径" value={regCashPolicy.detail} />
                    {regCashPolicy.docs ? (
                      <Text size="small">
                        参考：<Link href={regCashPolicy.docs}>{regCashPolicy.docs}</Link>
                      </Text>
                    ) : null}
                  </Stack>
                </>
              ) : null}
              <Divider />
              <Stack gap={6}>
                <Text size="small" weight="medium">
                  涉足信贷产品 / 生态角色
                </Text>
                <Row gap={6} wrap>
                  <Pill tone="neutral" size="sm">
                    {LINE_LABEL[r.line]}
                  </Pill>
                  {r.ecoRoles.map((role) => (
                    <Pill tone="neutral" size="sm">
                      {ECO_ROLE_LABEL[role]}
                    </Pill>
                  ))}
                  {r.tags.map((t) => (
                    <Pill tone="neutral" size="sm">
                      {CREDIT_TAG_LABEL[t]}
                    </Pill>
                  ))}
                </Row>
                <Text size="small" tone="secondary">
                  信贷产品树：个人（消费/住房/汽车）· 企业 · 信贷超市 · 信贷其他；规模条为信贷撮合/放款量级。
                </Text>
              </Stack>
              {isPlayer ? (
                <Stack gap={6}>
                  <Text size="small" weight="medium">
                    信贷资产
                  </Text>
                  {(() => {
                    const sub = inferSubsidy(r);
                    const gar = inferGuarantee(r);
                    return (
                      <Stack gap={8}>
                        <Stack gap={4}>
                          <Text size="small" tone="secondary">
                            是否有贴息
                          </Text>
                          <Row gap={6} wrap>
                            <Pill tone="neutral" size="sm">
                              {sub.has === true ? "有贴息" : sub.has === false ? "无贴息" : "待核实"}
                            </Pill>
                            {sub.has === true
                              ? sub.roles.map((role) => (
                                  <Pill tone="neutral" size="sm">
                                    贴息·{role}
                                  </Pill>
                                ))
                              : null}
                          </Row>
                          <Text size="small" tone="tertiary">
                            贴息角色口径：商户 / 政府 / 平台 / 其他（有贴息时列示）
                          </Text>
                        </Stack>
                        <Stack gap={4}>
                          <Text size="small" tone="secondary">
                            是否有担保
                          </Text>
                          <Row gap={6} wrap>
                            <Pill tone="neutral" size="sm">
                              {gar.has === true ? "有担保" : gar.has === false ? "无担保" : "待核实"}
                            </Pill>
                            {gar.has === true
                              ? gar.roles.map((role) => (
                                  <Pill tone="neutral" size="sm">
                                    担保·{role}
                                  </Pill>
                                ))
                              : null}
                          </Row>
                          <Text size="small" tone="tertiary">
                            担保角色口径：商户 / 政府 / 平台 / 担保/保险公司 / 其他（有担保时列示）
                          </Text>
                        </Stack>
                      </Stack>
                    );
                  })()}
                </Stack>
              ) : null}
              <Stack gap={6}>
                <Text size="small" weight="medium">
                  涉及金融牌照
                </Text>
                <Row gap={6} wrap>
                  {r.licenseKinds.length ? (
                    r.licenseKinds.map((k) => (
                      <Pill tone="neutral" size="sm">
                        {LICENSE_KIND_LABEL[k]}
                      </Pill>
                    ))
                  ) : (
                    <Text size="small" tone="tertiary">
                      待从牌照信源归类
                    </Text>
                  )}
                </Row>
              </Stack>
              <Divider />
              <SourceVerifyBlock
                orgKey={r.group}
                verify={r.verify}
                trafficRank={r.trafficRank}
                licenseReg={r.licenseReg}
              />
              <Divider />
              <Grid columns={2} gap={10}>
                <DetailField label="股权" value={r.equity} />
                <DetailField label="品牌/APP" value={r.brands} />
                <DetailField label="涉足国家/地区" value={r.countries} />
                <DetailField label="语言" value={r.languages} />
                <DetailField label="牌照摘要" value={r.licenses} />
                <DetailField label="展业时点" value={r.timing} />
                <DetailField label="监管机关" value={r.regulators} />
                <DetailField label="流量入口" value={r.traffic} />
                <DetailField label="规模/交易" value={r.volume} />
                <DetailField label="用户" value={r.users} />
                <DetailField label="点点/路飞摘要" value={r.diandian} />
              </Grid>
              {r.note ? <DetailField label="备注" value={r.note} /> : null}
            </Stack>
          </CompactDetails>
        </Stack>
      </CardBody>
    </Card>
  );
}


function compactMarketLine(
  cells: Record<string, string>,
  markets: readonly string[],
): { filled: number; line: string } {
  const bits: string[] = [];
  for (const m of markets) {
    const v = (cells[m] ?? "").trim();
    if (!v || v === "待补" || v === "用户使用") continue;
    bits.push(`${m} ${v}`);
  }
  return { filled: bits.length, line: bits.join(" · ") };
}

type SceneAtlasLayer = "web2" | "web3" | "agent";

type SceneAtlasLeaf = {
  title: string;
  /** 用户行为/目的 */
  hint?: string;
  /** 玩家名单（按市场压缩行） */
  line: string;
};

/** Web3 子域：金融 / 游戏 / 艺术 / 社交（不再挂「信用管理」） */
function web3SceneBucket(l2: SceneSubTag): "金融" | "游戏" | "艺术" | "社交" {
  const p = SCENE_SUB_PARENT[l2];
  if (p === "游戏" || p === "艺术" || p === "社交" || p === "金融") return p;
  return "金融";
}

/** Web2·金融·理财二级（与信贷并列；词条：名称 → 行为/目的 → 玩家口径） */
const WEALTH_SCENE_L1: {
  id: string;
  items: { title: string; hint: string; line: string }[];
}[] = [
  {
    id: "货币与现金管理",
    items: [
      {
        title: "货币基金",
        hint: "闲置资金买入货基、随时赎回、追求流动性与稳健收益",
        line: "玩家名单见「玩家 → 信贷原生/金融场景」公开对照（余额宝类入口等）",
      },
      {
        title: "活期+ / 现金管理",
        hint: "支付账户余额自动申购现金管理、兼顾支付与增值",
        line: "玩家名单见支付钱包/银行现金管理产品公开对照",
      },
      {
        title: "支付账户余额理财",
        hint: "在支付账户内一键理财、消费与理财资金互通",
        line: "玩家名单见头部支付钱包理财入口公开对照",
      },
    ],
  },
  {
    id: "固收理财",
    items: [
      {
        title: "银行理财",
        hint: "购买银行理财产品、按风险等级匹配稳健收益",
        line: "玩家名单见持牌银行理财子公司/代销渠道公开对照",
      },
      {
        title: "债券基金",
        hint: "申购债基、配置利率/信用债资产",
        line: "玩家名单见公募基金/银行代销公开对照",
      },
      {
        title: "存款/大额存单",
        hint: "存定期或大额存单、锁定利率",
        line: "玩家名单见商业银行存款产品公开对照",
      },
      {
        title: "券商固收资管",
        hint: "认购券商固收资管计划、获取票息类收益",
        line: "玩家名单见券商资管公开对照",
      },
    ],
  },
  {
    id: "权益投资",
    items: [
      {
        title: "股票型/混合基金",
        hint: "申购股混基金、承担净值波动追求收益",
        line: "玩家名单见公募基金/互联网代销公开对照",
      },
      {
        title: "指数与 ETF",
        hint: "买入指数/ETF、跟踪市场或行业",
        line: "玩家名单见基金公司/券商交易入口公开对照",
      },
      {
        title: "基金投顾",
        hint: "授权投顾组合、自动再平衡",
        line: "玩家名单见持牌基金投顾机构公开对照",
      },
      {
        title: "证券开户交易",
        hint: "开户、买卖股票/可转债等证券",
        line: "玩家名单见券商 App 公开对照",
      },
    ],
  },
  {
    id: "保险与养老",
    items: [
      {
        title: "分红/万能/投连",
        hint: "投保储蓄型/投资型保险、长期资金规划",
        line: "玩家名单见持牌寿险公司/互联网保险公开对照",
      },
      {
        title: "商业养老金/年金",
        hint: "配置养老金/年金、分期领取养老现金流",
        line: "玩家名单见养老险/商业养老金公开对照",
      },
      {
        title: "增额终身寿",
        hint: "投保增额寿、长期锁定身故/现价利益",
        line: "玩家名单见寿险公司公开对照",
      },
      {
        title: "个税递延养老",
        hint: "参与税延养老账户、享受税收递延",
        line: "玩家名单见税延养老账户管理人公开对照",
      },
    ],
  },
  {
    id: "另类与跨境",
    items: [
      {
        title: "黄金/贵金属",
        hint: "买入实物/账户金、避险或配置",
        line: "玩家名单见银行/黄金 ETF/交易平台公开对照",
      },
      {
        title: "商品与衍生品零售",
        hint: "参与商品/衍生品零售交易（合规范围内）",
        line: "玩家名单见持牌期货/衍生品零售入口公开对照",
      },
      {
        title: "QDII/跨境理财",
        hint: "配置跨境/QDII 产品、分散国别资产",
        line: "玩家名单见 QDII 基金/银行代销公开对照",
      },
      {
        title: "私募/资管计划",
        hint: "合格投资者认购私募/资管、接受封闭与风险披露",
        line: "玩家名单见私募管理人/券商资管公开对照",
      },
    ],
  },
];

const CREDIT_L2_USER_BEHAVIOR: Partial<Record<Exclude<CreditProdL2, "all">, string>> = {
  消费信贷: "为个人消费/周转申请授信、借款或分期还款",
  住房信贷: "购房或抵押住房融资、按揭/抵押还款",
  汽车信贷: "购车融资、按揭或融资租赁还款",
  流贷: "企业补充流动资金、短期周转还款",
  固贷: "企业固定资产投资融资、分期偿还",
  提前收款: "企业基于应收/订单提前回款",
  订单融资: "以订单为依托获取经营周转资金",
  发票融资: "以发票/应收为依托融资回笼",
  学生贷: "学生/教育相关借款、分期偿还",
  农户贷: "农户生产经营借款、季节性还款",
  公务员贷: "面向公务人群的消费/周转借款",
};

/** 场景树折叠行：字阶对齐生态角色 CardHeader（small），避免 CollapsibleSection 默认偏大 */
function AtlasFold({
  id,
  title,
  count,
  children,
  defaultOpen = false,
}: {
  id: string;
  title: string;
  count?: number | string;
  children?: ReactNode;
  defaultOpen?: boolean;
}) {
  const key = `atlasf_${id.replace(/[^\w\u4e00-\u9fff]+/g, "_").slice(0, 48)}`;
  const [open, setOpen] = useCanvasState(key, defaultOpen);
  return (
    <Stack gap={4}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: 28,
          userSelect: "none",
        }}
      >
        <Text size="small" tone="tertiary" as="span">
          {open ? "▾" : "▸"}
        </Text>
        <Text size="small" weight="medium" as="span" style={{ flex: 1, minWidth: 0 }}>
          {title}
        </Text>
        {count != null ? (
          <Pill size="sm" tone="neutral">
            {String(count)}
          </Pill>
        ) : null}
      </div>
      {open && children ? (
        <Stack gap={4} style={{ paddingLeft: 18 }}>
          {children}
        </Stack>
      ) : null}
    </Stack>
  );
}

/** 线上数字经济场景：Web2 / Web3 / Agent；信贷+理财在 Web2→金融 下 */
function DigitalSceneAtlasBrowse() {
  const [layer, setLayer] = useCanvasState<SceneAtlasLayer>("atlasLayer3", "web2");
  const [web2Focus, setWeb2Focus] = useCanvasState<string>("atlasW2f2", "all");

  const web2IndustryTags = SCENE_TAG_ORDER.filter(
    (t) => t !== "Web3" && t !== "金融" && t !== "艺术" && t !== "信用管理",
  );

  const industryGrouped = SCENE_WIDE_TABLE.filter(
    (r) => r.l1 !== "Web3" && r.l1 !== "信用管理",
  ).reduce((acc, r) => {
    const list = acc.get(r.l1) ?? [];
    list.push(r);
    acc.set(r.l1, list);
    return acc;
  }, new Map<SceneTag, (typeof SCENE_WIDE_TABLE)[number][]>());

  const creditMgmtRows: SceneAtlasLeaf[] = SCENE_WIDE_TABLE.filter(
    (r) => r.l1 === "信用管理" && !SCENE_SUBS_B2B_RISK.has(r.l2),
  ).map((r) => {
    const { line } = compactMarketLine(r.cells, WIDE_MARKET_ORDER);
    return {
      title: r.l2,
      hint: SCENE_USER_BEHAVIOR[r.l2],
      line: line || "—",
    };
  });

  const web3ByBucket: Record<"金融" | "游戏" | "艺术" | "社交", SceneAtlasLeaf[]> = {
    金融: [],
    游戏: [],
    艺术: [],
    社交: [],
  };
  for (const r of WEB3_SCENE_WIDE_TABLE) {
    const bucket = web3SceneBucket(r.l2);
    const { line } = compactMarketLine(r.cells, WEB3_WIDE_MARKET_ORDER);
    web3ByBucket[bucket].push({
      title: r.l2,
      hint: WEB3_USER_BEHAVIOR[r.l2],
      line: line || "—",
    });
  }

  function renderLeafList(leaves: SceneAtlasLeaf[]) {
    if (!leaves.length) {
      return (
        <Text size="small" tone="tertiary">
          暂无条目
        </Text>
      );
    }
    return (
      <Stack gap={8}>
        {leaves.map((leaf) => (
          <Stack gap={2}>
            <Text size="small" weight="medium">
              {leaf.title}
            </Text>
            <Text size="small" tone="tertiary" style={{ fontSize: 11, lineHeight: 1.35 }}>
              行为/目的：{leaf.hint?.trim() || "待补用户行为/目的"}
            </Text>
            <Text size="small" tone="tertiary" style={{ fontSize: 11, lineHeight: 1.35 }}>
              玩家：{leaf.line?.trim() || "—"}
            </Text>
          </Stack>
        ))}
      </Stack>
    );
  }

  function renderCreditL1Body(l1: Exclude<CreditProdL1, "all">) {
    const l2s = CREDIT_PROD_L2_BY_L1[l1];
    if (!l2s.length) {
      return renderLeafList([
        {
          title: l1,
          hint: "用户按信贷超市比价选品、申请导流至持牌放贷方",
          line: "玩家名单见「玩家 → 信贷原生」同口径筛选",
        },
      ]);
    }
    return renderLeafList(
      l2s.map((l2) => {
        const l3s = CREDIT_PROD_L3_BY_L2[l2];
        return {
          title: l2,
          hint: CREDIT_L2_USER_BEHAVIOR[l2] ?? "用户申请对应信贷产品并履约还款",
          line: l3s?.length
            ? `子类：${l3s.join(" · ")}；玩家名单见「玩家 → 信贷原生」同口径筛选`
            : "玩家名单见「玩家 → 信贷原生」同口径筛选",
        };
      }),
    );
  }

  const showFinance = web2Focus === "all" || web2Focus === "金融";
  const financeSecondLevelCount =
    1 + CREDIT_PROD_L1_ORDER.length + WEALTH_SCENE_L1.length; // 信用管理 + 信贷L1 + 理财L1

  const financeBody = (
    <Stack gap={4}>
      <AtlasFold
        id="fin_credit_mgmt"
        title="信用管理"
        count={creditMgmtRows.length}
      >
        <Stack gap={6}>
          <Text size="small" tone="tertiary" style={{ fontSize: 11, lineHeight: 1.35 }}>
            To C 场景以征信查询等为主。信用评分/画像、反欺诈为 B 端能力，见机构类型「风控服务方」。
          </Text>
          {renderLeafList(creditMgmtRows)}
        </Stack>
      </AtlasFold>
      {CREDIT_PROD_L1_ORDER.map((l1) => (
        <AtlasFold
          id={`fin_l1_${l1}`}
          title={l1}
          count={CREDIT_PROD_L2_BY_L1[l1].length || 1}
        >
          {renderCreditL1Body(l1)}
        </AtlasFold>
      ))}
      {WEALTH_SCENE_L1.map((w) => (
        <AtlasFold id={`fin_wealth_${w.id}`} title={w.id} count={w.items.length}>
          {renderLeafList(
            w.items.map((item) => ({
              title: item.title,
              hint: item.hint,
              line: item.line,
            })),
          )}
        </AtlasFold>
      ))}
    </Stack>
  );

  return (
    <Stack gap={10}>
      <Row gap={6} wrap>
        {(
          [
            { id: "web2" as const, label: "Web2" },
            { id: "web3" as const, label: "Web3" },
            { id: "agent" as const, label: "Agent" },
          ] as const
        ).map((o) => (
          <FilterChip
            label={o.label}
            active={layer === o.id}
            onClick={() => {
              setLayer(o.id);
              if (o.id !== "web2") setWeb2Focus("all");
            }}
          />
        ))}
      </Row>

      {layer === "web2" ? (
        <Stack gap={8}>
          <Row gap={6} wrap>
            <FilterChip
              label="全部业态"
              active={web2Focus === "all"}
              onClick={() => setWeb2Focus("all")}
            />
            <FilterChip
              label="金融"
              active={web2Focus === "金融"}
              clearable
              onClick={() => setWeb2Focus(web2Focus === "金融" ? "all" : "金融")}
            />
            {web2IndustryTags.map((t) => (
              <FilterChip
                label={SCENE_TAG_LABEL[t]}
                active={web2Focus === t}
                clearable
                onClick={() => setWeb2Focus(web2Focus === t ? "all" : t)}
              />
            ))}
          </Row>

          <Stack gap={4}>
            {showFinance ? (
              web2Focus === "金融" ? (
                <Stack gap={8}>
                  <Row gap={8} align="center">
                    <Text size="small" weight="medium">
                      金融
                    </Text>
                    <Pill size="sm">{String(financeSecondLevelCount)}</Pill>
                  </Row>
                  {financeBody}
                </Stack>
              ) : (
                <AtlasFold id="w2_金融" title="金融" count={financeSecondLevelCount}>
                  {financeBody}
                </AtlasFold>
              )
            ) : null}
            {web2Focus !== "金融"
              ? Array.from(industryGrouped.entries())
                  .filter(([l1]) => web2Focus === "all" || web2Focus === l1)
                  .map(([l1, list]) => {
                    const leaves = list.map((r) => {
                      const { line } = compactMarketLine(r.cells, WIDE_MARKET_ORDER);
                      return {
                        title: r.l2,
                        hint: SCENE_USER_BEHAVIOR[r.l2],
                        line: line || "—",
                      };
                    });
                    if (web2Focus === l1) {
                      return (
                        <Stack gap={8}>
                          <Row gap={8} align="center">
                            <Text size="small" weight="medium">
                              {SCENE_TAG_LABEL[l1]}
                            </Text>
                            <Pill size="sm">{String(list.length)}</Pill>
                          </Row>
                          {renderLeafList(leaves)}
                        </Stack>
                      );
                    }
                    return (
                      <AtlasFold
                        id={`w2_${l1}`}
                        title={SCENE_TAG_LABEL[l1]}
                        count={list.length}
                      >
                        {renderLeafList(leaves)}
                      </AtlasFold>
                    );
                  })
              : null}
          </Stack>
        </Stack>
      ) : null}

      {layer === "web3" ? (
        <Stack gap={4}>
          {(["金融", "游戏", "艺术", "社交"] as const).map((bucket) => (
            <AtlasFold
              id={`w3_${bucket}`}
              title={bucket}
              count={web3ByBucket[bucket].length}
            >
              {renderLeafList(web3ByBucket[bucket])}
            </AtlasFold>
          ))}
        </Stack>
      ) : null}

      {layer === "agent" ? (
        <Stack gap={4}>
          <AtlasFold id="agent_豆包" title="豆包" count={1}>
            {renderLeafList([
              {
                title: "豆包",
                hint: "与对话式 Agent 交互：提问、创作、办事助手、持续多轮对话",
                line: "中国 · 豆包 App / 网页端（字节跳动）",
              },
            ])}
          </AtlasFold>
        </Stack>
      ) : null}
    </Stack>
  );
}

export default function Canvas() {
  const [hub, setHub] = useCanvasState<"home" | InstitutionType>("hub6", "home");
  const [region, setRegion] = useCanvasState<Region>("region5", "all");
  const [country, setCountry] = useCanvasState<CountryCode>("country8", "all");
  const [primary, setPrimary] = useCanvasState<Primary>("primary7", "all");
  const [creditL1, setCreditL1] = useCanvasState<CreditProdL1>("credL1a", "all");
  const [creditL2, setCreditL2] = useCanvasState<CreditProdL2>("credL2a", "all");
  const [creditL3, setCreditL3] = useCanvasState<CreditProdL3>("credL3a", "all");
  const [sceneTag, setSceneTag] = useCanvasState<SceneTag | "all">("sceneTag4", "all");
  const [sceneSub, setSceneSub] = useCanvasState<SceneSubTag | "all">("sceneSub3", "all");
  const [licenseKind, setLicenseKind] = useCanvasState<LicenseKind | "all">("license4", "all");
  const [fundKind, setFundKind] = useCanvasState<FundParticipationKind | "all">("fundKind5", "all");
  const [trafficKind, setTrafficKind] = useCanvasState<TrafficServiceKind | "all">("trafficKind2", "all");
  const [regLicenseId, setRegLicenseId] = useCanvasState<string>("regLic3", "all");
  const [keyword, setKeyword] = useCanvasState("kw1", "");
  const [createdPlayers, setCreatedPlayers] = useCanvasState<CreditDraft[]>("createdPlayers1", []);

  const showScene = primary === "all" || primary === "scene";
  const showCredit = primary === "all" || primary === "credit";
  const kw = keyword.trim();

  const liveCredits = dedupeCreditRows([
    ...credits,
    ...createdPlayers.map((d) => finalizeCredit(d)),
  ]);

  const sceneRows = filterScenes(region, country, sceneTag, sceneSub, licenseKind).filter((r) =>
    sceneMatchesKeyword(r, kw),
  );
  const creditRows = filterCredits(
    region,
    country,
    creditL1,
    creditL2,
    creditL3,
    sceneTag,
    licenseKind,
  )
    .filter((r) => r.institutionTypes.includes("玩家"))
    .filter((r) => creditMatchesKeyword(r, kw));
  // filterCredits 基于静态 credits；人工创设需并入
  const creditRowsLive = dedupeCreditRows([
    ...creditRows,
    ...liveCredits.filter((r) => {
      if (!r.institutionTypes.includes("玩家")) return false;
      if (!creditMatchesKeyword(r, kw)) return false;
      if (region !== "all" && r.region !== region) return false;
      if (!matchesCountry(r.group, r.countries, country)) return false;
      if (!matchesCreditProductTree(r, creditL1, creditL2, creditL3)) return false;
      if (licenseKind !== "all" && !r.licenseKinds.includes(licenseKind)) return false;
      return !creditRows.some((x) => x.group === r.group);
    }),
  ]);
  const creditProdLabel = creditProductFilterLabel(creditL1, creditL2, creditL3);
  const nSceneNative = scenes.length;
  const nFinanceNative = liveCredits.filter((r) => r.institutionTypes.includes("玩家")).length;

  function countInstitutionType(t: InstitutionType): number {
    if (t === "玩家") return nSceneNative + nFinanceNative;
    return credits.filter((r) => r.institutionTypes.includes(t)).length;
  }

  const regLicenseOptions = licensesForGeo(region, country);
  const activeRegLicense =
    regLicenseId === "all" ? null : (REGULATORY_LICENSE_CATALOG.find((l) => l.id === regLicenseId) ?? null);

  const ecoRows =
    hub !== "home" && hub !== "玩家"
      ? credits
          .filter((r) => {
            if (!r.institutionTypes.includes(hub)) return false;
            if (hub === "资金参与机构" && fundKind !== "all" && !r.fundKinds.includes(fundKind)) {
              return false;
            }
            if (hub === "流量服务商" && trafficKind !== "all" && !r.trafficKinds.includes(trafficKind)) {
              return false;
            }
            if (isGeoScopedEcoType(hub)) {
              if (region !== "all" && r.region !== region && !hasWorldwideCoverage(r.countries)) {
                return false;
              }
              if (!matchesCountry(r.group, r.countries, country)) return false;
            }
            if (hub === "监管") {
              if (licenseKind !== "all" && !regulatorMatchesLicenseKind(r, licenseKind)) return false;
              if (activeRegLicense && !regulatorMatchesLicense(r, activeRegLicense)) return false;
            }
            if (!creditMatchesKeyword(r, kw)) return false;
            return true;
          })
          .slice()
          .sort((a, b) => {
            // 流量服务商·全部：按细分顺序，流量平台优先
            if (hub === "流量服务商" && trafficKind === "all") {
              const rank = (r: CreditRow) => {
                const idx = TRAFFIC_KIND_ORDER.findIndex((k) => r.trafficKinds.includes(k));
                return idx === -1 ? TRAFFIC_KIND_ORDER.length : idx;
              };
              const d = rank(a) - rank(b);
              if (d !== 0) return d;
            }
            return 0;
          })
      : [];

  /** 反向映射用池：不受洲际/国家筛选，只看该机构类型（及资金细分）全量覆盖 */
  const hubGeoCoverage = (() => {
    if (hub === "home") {
      return collectGeoCoverage([]);
    }
    if (hub === "玩家") {
      const sceneBits = scenes.map((r) => ({
        region: r.region,
        countries: countriesCoveredBySceneRow(r),
      }));
      const creditBits = liveCredits
        .filter((r) => r.institutionTypes.includes("玩家"))
        .map((r) => ({
          region: r.region,
          countries: countriesCoveredByCreditRow(r),
        }));
      return collectGeoCoverage([...sceneBits, ...creditBits]);
    }
    const pool = credits.filter((r) => {
      if (!r.institutionTypes.includes(hub)) return false;
      if (hub === "资金参与机构" && fundKind !== "all" && !r.fundKinds.includes(fundKind)) {
        return false;
      }
      if (hub === "流量服务商" && trafficKind !== "all" && !r.trafficKinds.includes(trafficKind)) {
        return false;
      }
      return true;
    });
    return collectGeoCoverage(
      pool.map((r) => ({
        region: r.region,
        countries: countriesCoveredByCreditRow(r),
      })),
    );
  })();

  const searchSceneHits = kw ? scenes.filter((r) => sceneMatchesKeyword(r, kw)).slice(0, 40) : [];
  const searchCreditHits = kw
    ? credits
        .filter((r) => r.institutionTypes.includes("玩家") && creditMatchesKeyword(r, kw))
        .slice(0, 40)
    : [];
  const searchEcoHits = kw
    ? credits
        .filter((r) => !r.institutionTypes.includes("玩家") && creditMatchesKeyword(r, kw))
        .slice(0, 40)
    : [];
  const searchHitCount = searchSceneHits.length + searchCreditHits.length + searchEcoHits.length;

  const regLicenseHolders = activeRegLicense
    ? [
        ...scenes.filter((r) => playerHoldsLicense(r, activeRegLicense)),
        ...credits.filter(
          (r) => r.institutionTypes.includes("玩家") && playerHoldsLicense(r, activeRegLicense),
        ),
      ]
    : [];

  function countFundKind(k: FundParticipationKind): number {
    return credits.filter(
      (r) => r.institutionTypes.includes("资金参与机构") && r.fundKinds.includes(k),
    ).length;
  }

  function countTrafficKind(k: TrafficServiceKind): number {
    return credits.filter((r) => {
      if (!r.institutionTypes.includes("流量服务商") || !r.trafficKinds.includes(k)) return false;
      if (region !== "all" && r.region !== region && !hasWorldwideCoverage(r.countries)) return false;
      if (!matchesCountry(r.group, r.countries, country)) return false;
      return true;
    }).length;
  }

  const [authSession] = useCanvasState("authSession1", "");
  if (!authSession) {
    return <LoginPage />;
  }

  return (
    <Stack gap={20}>
      <SessionChrome />

      <H1>CRM生态系统</H1>

      <CursorStyleComposer
        value={keyword}
        onChange={setKeyword}
        onSubmit={({ text, attachments }) => {
          const draft = draftFromComposerCreate(text, attachments);
          if (draft) {
            const key = creditBrandKey(draft.group);
            const exists =
              liveCredits.some((r) => creditBrandKey(r.group) === key) ||
              createdPlayers.some((d) => creditBrandKey(d.group) === key);
            if (exists) {
              setKeyword(draft.brands);
              setHub("玩家");
              setPrimary("credit");
              return `已存在相近玩家「${draft.brands}」，已跳转名单并检索`;
            }
            setCreatedPlayers((prev) => [draft, ...prev].slice(0, 50));
            setKeyword(draft.brands);
            setHub("玩家");
            setPrimary("credit");
            return `已创设玩家「${draft.brands}」，已进入信贷原生名单`;
          }
          const q = text.trim();
          if (!q && !attachments.length) {
            return "输入关键词检索，或写「创设…玩家名」建档";
          }
          if (!q && attachments.length) {
            return `已附带 ${attachments.length} 项材料；请补充「创设…玩家名」后发送建档`;
          }
          setHub("home");
          return `检索：${q}`;
        }}
      />

      <Stack gap={8}>
        <Text size="small" weight="medium">
          机构类型入口
        </Text>
        <Row gap={6} wrap>
          <FilterChip label="总览" active={hub === "home"} onClick={() => setHub("home")} />
        </Row>
        {INST_BUCKET_ORDER.map((bucket) => (
          <Stack gap={4}>
            <Text size="small" tone="secondary" weight="medium">
              {INST_BUCKET_LABEL[bucket]}
            </Text>
            <Row gap={6} wrap>
              {INST_BUCKET_TYPES[bucket].map((t) => (
                <FilterChip
                  label={`${INSTITUTION_TYPE_LABEL[t]} · ${countInstitutionType(t)}`}
                  active={hub === t}
                  clearable
                  onClick={() => setHub(hub === t ? "home" : t)}
                />
              ))}
            </Row>
          </Stack>
        ))}
      </Stack>

      {hub === "home" ? (
        <Stack gap={16}>
          {kw ? (
            <Stack gap={12}>
              <H2>搜索结果 · {searchHitCount}</H2>
              {searchSceneHits.length ? (
                <Stack gap={8}>
                  <Text weight="medium">场景原生</Text>
                  {searchSceneHits.map((r) => (
                    <ScenePlayer r={r} />
                  ))}
                </Stack>
              ) : null}
              {searchCreditHits.length ? (
                <Stack gap={8}>
                  <Text weight="medium">信贷原生</Text>
                  {searchCreditHits.map((r) => (
                    <CreditPlayer r={r} />
                  ))}
                </Stack>
              ) : null}
              {searchEcoHits.length ? (
                <Stack gap={8}>
                  <Text weight="medium">生态机构</Text>
                  {searchEcoHits.map((r) => (
                    <CreditPlayer r={r} />
                  ))}
                </Stack>
              ) : null}
              {!searchHitCount ? (
                <Callout tone="neutral">未找到匹配机构。可换关键词，或点 + 导入创设材料。</Callout>
              ) : null}
              <Divider />
            </Stack>
          ) : null}
          <H2>生态角色</H2>
          <Stack gap={12}>
            {INST_BUCKET_ORDER.map((bucket) => {
              const types = INST_BUCKET_TYPES[bucket];
              return (
              <Stack gap={6}>
                <Text size="small" weight="medium" tone="secondary">
                  {INST_BUCKET_LABEL[bucket]}
                </Text>
                <Grid
                  columns="repeat(auto-fit, minmax(min(100%, 200px), 1fr))"
                  gap={8}
                  align="stretch"
                >
                  {types.map((t) => (
                    <div
                      style={{ cursor: "pointer", minWidth: 0, height: "100%" }}
                      onClick={() => setHub(t)}
                      onKeyDown={(e: { key: string; preventDefault: () => void }) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setHub(t);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      title={`查看${INSTITUTION_TYPE_LABEL[t]}名单`}
                    >
                      <Card style={{ height: "100%" }}>
                        <CardHeader
                          trailing={
                            <Row gap={6} align="center">
                              <Pill tone="neutral" size="sm">
                                {String(countInstitutionType(t))}
                              </Pill>
                              <Text size="small" tone="tertiary" as="span">
                                →
                              </Text>
                            </Row>
                          }
                        >
                          {INSTITUTION_TYPE_LABEL[t]}
                        </CardHeader>
                        <CardBody>
                          <Text
                            size="small"
                            tone="tertiary"
                            style={{
                              fontSize: 11,
                              lineHeight: 1.35,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {INSTITUTION_TYPE_BLURB[t]}
                          </Text>
                        </CardBody>
                      </Card>
                    </div>
                  ))}
                </Grid>
              </Stack>
              );
            })}
          </Stack>

          <Divider />
          <H2>线上数字经济场景</H2>
          <Text size="small" tone="tertiary">
            Web2 / Web3 / Agent · 词条统一：名称 → 行为/目的 → 玩家名单
          </Text>
          <DigitalSceneAtlasBrowse />
        </Stack>
      ) : null}

      {hub === "玩家" ? (
        <Stack gap={16}>
          <H2>玩家</H2>
          <Grid columns={2} gap={12}>
            <Stat value={String(nSceneNative)} label="场景原生" />
            <Stat value={String(nFinanceNative)} label="信贷原生" />
          </Grid>

          <Stack gap={10}>
            <Stack gap={4}>
              <Text size="small" weight="medium">
                涉足洲际
              </Text>
              <Row gap={6} wrap>
                {(Object.keys(REGION_LABEL) as Region[]).map((k) => (
                  <FilterChip
                    label={REGION_LABEL[k]}
                    active={region === k}
                    clearable={k !== "all"}
                    onClick={() => {
                      const next = region === k && k !== "all" ? "all" : k;
                      setRegion(next);
                      if (!countryInRegion(country, next)) setCountry("all");
                    }}
                  />
                ))}
              </Row>
            </Stack>

            <Stack gap={4}>
              <Text size="small" weight="medium">
                涉足国家/地区
              </Text>
              <Row gap={6} wrap>
                {countriesForRegion(region).map((k) => (
                  <FilterChip
                    label={COUNTRY_LABEL[k]}
                    active={country === k}
                    clearable={k !== "all"}
                    onClick={() => setCountry(country === k && k !== "all" ? "all" : k)}
                  />
                ))}
              </Row>
            </Stack>

            <Stack gap={4}>
              <Text size="small" weight="medium">
                原生路径
              </Text>
              <Row gap={6} wrap>
                {(
                  [
                    { value: "all" as Primary, label: "全部" },
                    { value: "scene" as Primary, label: "场景原生" },
                    { value: "credit" as Primary, label: "信贷原生" },
                  ] as const
                ).map((o) => (
                  <FilterChip
                    label={o.label}
                    active={primary === o.value}
                    clearable={o.value !== "all"}
                    onClick={() => {
                      const next =
                        primary === o.value && o.value !== "all" ? "all" : o.value;
                      setPrimary(next);
                      // 切换原生路径时清空对侧筛选项，避免隐藏态脏过滤
                      if (next !== "scene") {
                        setSceneTag("all");
                        setSceneSub("all");
                      }
                      if (next !== "credit") {
                        setCreditL1("all");
                        setCreditL2("all");
                        setCreditL3("all");
                      }
                    }}
                  />
                ))}
              </Row>
              {primary === "all" ? (
                <Text size="small" tone="secondary">
                  选择「场景原生」或「信贷原生」后，将展开对应的涉足场景 / 信贷产品筛选项
                </Text>
              ) : null}
            </Stack>

            {primary === "scene" ? (
              <Stack gap={4}>
                <Stack gap={4}>
                  <Text size="small" weight="medium">
                    涉足场景
                  </Text>
                  <Row gap={6} wrap>
                    <FilterChip
                      label="全部场景"
                      active={sceneTag === "all"}
                      onClick={() => {
                        setSceneTag("all");
                        setSceneSub("all");
                      }}
                    />
                    {SCENE_TAG_ORDER.map((t) => (
                      <FilterChip
                        label={SCENE_TAG_LABEL[t]}
                        active={sceneTag === t}
                        clearable
                        onClick={() => {
                          if (sceneTag === t) {
                            setSceneTag("all");
                            setSceneSub("all");
                          } else {
                            setSceneTag(t);
                            setSceneSub("all");
                          }
                        }}
                      />
                    ))}
                  </Row>
                </Stack>

                {sceneTag !== "all" && sceneSubsForTag(sceneTag).length > 0 ? (
                  <Stack gap={4}>
                    <Text size="small" weight="medium">
                      {SCENE_TAG_LABEL[sceneTag]}·二级
                    </Text>
                    <Row gap={6} wrap>
                      <FilterChip
                        label="全部二级"
                        active={sceneSub === "all"}
                        onClick={() => setSceneSub("all")}
                      />
                      {sceneSubsForTag(sceneTag).map((t) => (
                        <FilterChip
                          label={SCENE_SUB_LABEL[t]}
                          active={sceneSub === t}
                          clearable
                          onClick={() => setSceneSub(sceneSub === t ? "all" : t)}
                        />
                      ))}
                    </Row>
                  </Stack>
                ) : null}
              </Stack>
            ) : null}

            {primary === "credit" ? (
              <Stack gap={10}>
                <Stack gap={4}>
                  <Text size="small" weight="medium">
                    涉足信贷产品
                  </Text>
                  <Row gap={6} wrap>
                    <FilterChip
                      label="全部信贷产品"
                      active={creditL1 === "all"}
                      onClick={() => {
                        setCreditL1("all");
                        setCreditL2("all");
                        setCreditL3("all");
                      }}
                    />
                    {CREDIT_PROD_L1_ORDER.map((k) => (
                      <FilterChip
                        label={k}
                        active={creditL1 === k}
                        clearable
                        onClick={() => {
                          if (creditL1 === k) {
                            setCreditL1("all");
                            setCreditL2("all");
                            setCreditL3("all");
                          } else {
                            setCreditL1(k);
                            setCreditL2("all");
                            setCreditL3("all");
                          }
                        }}
                      />
                    ))}
                  </Row>
                </Stack>

                {creditL1 !== "all" && CREDIT_PROD_L2_BY_L1[creditL1].length > 0 ? (
                  <Stack gap={4}>
                    <Text size="small" weight="medium">
                      {creditL1}·二级
                    </Text>
                    <Row gap={6} wrap>
                      <FilterChip
                        label="全部二级"
                        active={creditL2 === "all"}
                        onClick={() => {
                          setCreditL2("all");
                          setCreditL3("all");
                        }}
                      />
                      {CREDIT_PROD_L2_BY_L1[creditL1].map((k) => (
                        <FilterChip
                          label={k}
                          active={creditL2 === k}
                          clearable
                          onClick={() => {
                            if (creditL2 === k) {
                              setCreditL2("all");
                              setCreditL3("all");
                            } else {
                              setCreditL2(k);
                              setCreditL3("all");
                            }
                          }}
                        />
                      ))}
                    </Row>
                  </Stack>
                ) : null}

                {creditL2 !== "all" && (CREDIT_PROD_L3_BY_L2[creditL2]?.length ?? 0) > 0 ? (
                  <Stack gap={4}>
                    <Text size="small" weight="medium">
                      {creditL2}·三级
                    </Text>
                    <Row gap={6} wrap>
                      <FilterChip
                        label="全部三级"
                        active={creditL3 === "all"}
                        onClick={() => setCreditL3("all")}
                      />
                      {(CREDIT_PROD_L3_BY_L2[creditL2] ?? []).map((k) => (
                        <FilterChip
                          label={k}
                          active={creditL3 === k}
                          clearable
                          onClick={() => setCreditL3(creditL3 === k ? "all" : k)}
                        />
                      ))}
                    </Row>
                  </Stack>
                ) : null}
              </Stack>
            ) : null}

            <Stack gap={4}>
              <Text size="small" weight="medium">
                涉及金融牌照
              </Text>
              <Row gap={6} wrap>
                <FilterChip
                  label="全部牌照粗类"
                  active={licenseKind === "all"}
                  onClick={() => setLicenseKind("all")}
                />
                {LICENSE_KIND_ORDER.map((k) => (
                  <FilterChip
                    label={LICENSE_KIND_LABEL[k]}
                    active={licenseKind === k}
                    clearable
                    onClick={() => setLicenseKind(licenseKind === k ? "all" : k)}
                  />
                ))}
              </Row>
            </Stack>
          </Stack>

          <Divider />

          {showScene ? (
            <Stack gap={12}>
              <Row gap={8} align="center" wrap>
                <H2>场景原生机构</H2>
                <Pill tone="info">{REGION_LABEL[region]}</Pill>
                {country !== "all" ? <Pill tone="info">{COUNTRY_LABEL[country]}</Pill> : null}
                {sceneTag !== "all" ? <Pill tone="info">{SCENE_TAG_LABEL[sceneTag]}</Pill> : null}
                {sceneSub !== "all" ? (
                  <Pill tone="neutral">
                    {SCENE_TAG_LABEL[SCENE_SUB_PARENT[sceneSub]]}/{SCENE_SUB_LABEL[sceneSub]}
                  </Pill>
                ) : null}
                {licenseKind !== "all" ? (
                  <Pill tone="success">{LICENSE_KIND_LABEL[licenseKind]}</Pill>
                ) : null}
                <Text size="small" tone="secondary">
                  {sceneRows.length} 家 · 三项：规模(GMV) / 用户 / 增速(收入YoY)；点「详情」展开
                </Text>
              </Row>
              <Stack gap={8}>
                {sceneRows.map((r) => (
                  <ScenePlayer r={r} />
                ))}
              </Stack>
            </Stack>
          ) : null}

          {showCredit ? (
            <Stack gap={12}>
              <Row gap={8} align="center" wrap>
                <H2>信贷原生机构</H2>
                <Pill tone="warning">{creditProdLabel}</Pill>
                {sceneTag !== "all" ? <Pill tone="info">{SCENE_TAG_LABEL[sceneTag]}</Pill> : null}
                {licenseKind !== "all" ? (
                  <Pill tone="success">{LICENSE_KIND_LABEL[licenseKind]}</Pill>
                ) : null}
                <Pill tone="info">{REGION_LABEL[region]}</Pill>
                {country !== "all" ? <Pill tone="info">{COUNTRY_LABEL[country]}</Pill> : null}
                <Text size="small" tone="secondary">
                  {creditRows.length} 家 · 三项：信贷规模 / 用户 / 增速；点「详情」展开
                </Text>
              </Row>
              <Stack gap={8}>
                {creditRows.map((r) => (
                  <CreditPlayer r={r} />
                ))}
              </Stack>
            </Stack>
          ) : null}
        </Stack>
      ) : null}

      {hub !== "home" && hub !== "玩家" ? (
        <Stack gap={12}>
          <H2>{INSTITUTION_TYPE_LABEL[hub]}</H2>

          {hub === "监管" ? (
            <Stack gap={12}>
              <Text size="small" tone="secondary">
                市场定位：{INST_BUCKET_LABEL.监管与合规中介} · 先选洲际/国家，再选牌照粗类与当地法定牌照
              </Text>

              <GeoAndLicenseFilters
                region={region}
                country={country}
                licenseKind={licenseKind}
                onRegion={(next) => {
                  setRegion(next);
                  if (!countryInRegion(country, next)) setCountry("all");
                  setRegLicenseId("all");
                }}
                onCountry={(next) => {
                  setCountry(next);
                  setRegLicenseId("all");
                }}
                onLicenseKind={(next) => {
                  setLicenseKind(next);
                  setRegLicenseId("all");
                }}
              />

              <Stack gap={4}>
                <Text size="small" weight="medium">
                  当地法定牌照（监管对应）
                </Text>
                <Row gap={6} wrap>
                  <FilterChip
                    label="全部法定牌照"
                    active={regLicenseId === "all"}
                    onClick={() => setRegLicenseId("all")}
                  />
                  {regLicenseOptions.map((lic) => (
                    <FilterChip
                      label={
                        country === "all"
                          ? `${lic.name}@${COUNTRY_LABEL[lic.country]}`
                          : lic.name
                      }
                      active={regLicenseId === lic.id}
                      clearable
                      onClick={() =>
                        setRegLicenseId(regLicenseId === lic.id ? "all" : lic.id)
                      }
                    />
                  ))}
                </Row>
                {regLicenseOptions.length === 0 ? (
                  <Text size="small" tone="tertiary">
                    当前地域尚未录入法定牌照对照表；请先选已建档市场（如中国、印尼、菲律宾）。
                  </Text>
                ) : (
                  <Text size="small" tone="secondary">
                    例：选中国可见支付业务许可证/小额贷款等；选印尼可见 LPBBTI（P2P）等。
                  </Text>
                )}
              </Stack>

              <Row gap={8} align="center" wrap>
                <Pill tone="info">{REGION_LABEL[region]}</Pill>
                {country !== "all" ? <Pill tone="info">{COUNTRY_LABEL[country]}</Pill> : null}
                {licenseKind !== "all" ? (
                  <Pill tone="success">{LICENSE_KIND_LABEL[licenseKind]}</Pill>
                ) : null}
                {activeRegLicense ? (
                  <Pill tone="success">
                    {activeRegLicense.name}@{COUNTRY_LABEL[activeRegLicense.country]}
                  </Pill>
                ) : null}
                <Text size="small" tone="secondary">
                  监管主体 {ecoRows.length} 家
                  {activeRegLicense ? ` · 持牌玩家 ${regLicenseHolders.length} 家` : ""}
                </Text>
              </Row>

              <Divider />
              <Text size="small" weight="medium">
                监管主体
              </Text>
              <Stack gap={8}>
                {ecoRows.map((r) => (
                  <CreditPlayer r={r} />
                ))}
              </Stack>

              {activeRegLicense ? (
                <Stack gap={8}>
                  <Divider />
                  <Row gap={8} align="center" wrap>
                    <Text size="small" weight="medium">
                      持有「{activeRegLicense.name}@{COUNTRY_LABEL[activeRegLicense.country]}」的玩家
                    </Text>
                    <Text size="small" tone="secondary">
                      {regLicenseHolders.length} 家
                    </Text>
                  </Row>
                  {regLicenseHolders.length ? (
                    <Stack gap={8}>
                      {regLicenseHolders.map((r) =>
                        "sceneType" in r ? <ScenePlayer r={r} /> : <CreditPlayer r={r} />,
                      )}
                    </Stack>
                  ) : (
                    <Text size="small" tone="tertiary">
                      当前筛选下暂无已建档持牌玩家（可扩写 licenseReg 后再交叉）。
                    </Text>
                  )}
                </Stack>
              ) : null}
            </Stack>
          ) : hub === "流量服务商" ? (
            <Stack gap={12}>
              <Text size="small" tone="secondary">
                市场定位：{INST_BUCKET_LABEL[INST_TYPE_TO_BUCKET[hub]]}
              </Text>
              <GeoAndLicenseFilters
                region={region}
                country={country}
                licenseKind={licenseKind}
                showLicenseKind={false}
                onRegion={(next) => {
                  setRegion(next);
                  if (!countryInRegion(country, next)) setCountry("all");
                }}
                onCountry={setCountry}
                onLicenseKind={setLicenseKind}
              />
              <Grid columns={4} gap={10}>
                {TRAFFIC_KIND_ORDER.map((k) => (
                  <Stat value={String(countTrafficKind(k))} label={TRAFFIC_KIND_LABEL[k]} />
                ))}
              </Grid>
              <Stack gap={4} style={{ minWidth: 200, maxWidth: 420 }}>
                <Text size="small" weight="medium">
                  流量服务商细分
                </Text>
                <Select
                  value={trafficKind}
                  onChange={(v) => setTrafficKind(v as TrafficServiceKind | "all")}
                  options={[
                    { value: "all", label: "全部" },
                    ...TRAFFIC_KIND_ORDER.map((k) => ({
                      value: k,
                      label: `${TRAFFIC_KIND_LABEL[k]} · ${countTrafficKind(k)}`,
                    })),
                  ]}
                />
              </Stack>
              <Row gap={8} align="center" wrap>
                <Pill tone="info">{REGION_LABEL[region]}</Pill>
                {country !== "all" ? <Pill tone="info">{COUNTRY_LABEL[country]}</Pill> : null}
                <Text size="small" tone="secondary">
                  {trafficKind === "all"
                    ? INSTITUTION_TYPE_BLURB.流量服务商
                    : TRAFFIC_KIND_BLURB[trafficKind]}{" "}
                  属地筛选后样本 {ecoRows.length} 家。
                </Text>
              </Row>
              <Stack gap={4}>
                {ecoRows.map((r) => (
                  <CreditPlayer r={r} />
                ))}
              </Stack>
            </Stack>
          ) : hub === "资金参与机构" ? (
            <Stack gap={12}>
              <Text size="small" tone="secondary">
                市场定位：{INST_BUCKET_LABEL[INST_TYPE_TO_BUCKET[hub]]}
              </Text>
              <GeoAndLicenseFilters
                region={region}
                country={country}
                licenseKind={licenseKind}
                showLicenseKind={false}
                onRegion={(next) => {
                  setRegion(next);
                  if (!countryInRegion(country, next)) setCountry("all");
                }}
                onCountry={setCountry}
                onLicenseKind={setLicenseKind}
              />
              <Grid columns={5} gap={10}>
                {FUND_KIND_ORDER.map((k) => (
                  <Stat value={String(countFundKind(k))} label={FUND_KIND_LABEL[k]} />
                ))}
              </Grid>
              <Stack gap={4} style={{ minWidth: 200, maxWidth: 360 }}>
                <Text size="small" weight="medium">
                  资金参与细分
                </Text>
                <Select
                  value={fundKind}
                  onChange={(v) => setFundKind(v as FundParticipationKind | "all")}
                  options={[
                    { value: "all", label: "全部" },
                    ...FUND_KIND_ORDER.map((k) => ({
                      value: k,
                      label: `${FUND_KIND_LABEL[k]} · ${countFundKind(k)}`,
                    })),
                  ]}
                />
              </Stack>
              <Row gap={8} align="center" wrap>
                <Pill tone="info">{REGION_LABEL[region]}</Pill>
                {country !== "all" ? <Pill tone="info">{COUNTRY_LABEL[country]}</Pill> : null}
                <Text size="small" tone="secondary">
                  {fundKind === "all"
                    ? INSTITUTION_TYPE_BLURB.资金参与机构
                    : FUND_KIND_BLURB[fundKind]}{" "}
                  属地筛选后样本 {ecoRows.length} 家。
                </Text>
              </Row>
              <Stack gap={4}>
                {ecoRows.map((r) => (
                  <CreditPlayer r={r} />
                ))}
              </Stack>
            </Stack>
          ) : (
            <Stack gap={12}>
              <Text size="small" tone="secondary">
                市场定位：{INST_BUCKET_LABEL[INST_TYPE_TO_BUCKET[hub]]}
              </Text>
              {isGeoScopedEcoType(hub) ? (
                <Stack gap={10}>
                  <Text size="small" tone="secondary">
                    {INSTITUTION_TYPE_BLURB[hub]} 属地筛选后样本 {ecoRows.length} 家。
                  </Text>
                  <GeoAndLicenseFilters
                    region={region}
                    country={country}
                    licenseKind={licenseKind}
                    showLicenseKind={false}
                    onRegion={(next) => {
                      setRegion(next);
                      if (!countryInRegion(country, next)) setCountry("all");
                    }}
                    onCountry={setCountry}
                    onLicenseKind={setLicenseKind}
                  />
                  <Row gap={8} align="center" wrap>
                    <Pill tone="info">{REGION_LABEL[region]}</Pill>
                    {country !== "all" ? <Pill tone="info">{COUNTRY_LABEL[country]}</Pill> : null}
                    <Text size="small" tone="secondary">
                      {ecoRows.length} 家
                    </Text>
                  </Row>
                </Stack>
              ) : (
                <Text size="small" tone="secondary">
                  {INSTITUTION_TYPE_BLURB[hub]} 公开信息样本 {ecoRows.length} 家。
                </Text>
              )}
              <Stack gap={4}>
                {ecoRows.map((r) => (
                  <CreditPlayer r={r} />
                ))}
              </Stack>
            </Stack>
          )}
        </Stack>
      ) : null}
    </Stack>
  );
}



