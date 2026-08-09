/**
 * 国别语言区（现金贷/平台金融展业粗分）。
 * zone = 业务语言区；languages = 官方/通行语；productHint = 产品文案/催收常用语提示。
 */
export type CountryLanguageInfo = {
  /** 语言区（展业粗分，可跨国同区） */
  zone: string;
  /** 官方/通行语言 */
  languages: string;
  /** 产品/客服常用语提示（可选） */
  productHint?: string;
};

export const COUNTRY_LANGUAGE: Record<string, CountryLanguageInfo> = {
  // —— 东亚 ——
  CN: { zone: "汉语区", languages: "简体中文（官方）", productHint: "简中为主" },
  HK: { zone: "汉语/英语区", languages: "繁体中文、英语（官方）", productHint: "繁中+英语" },
  MO: { zone: "汉语/葡语区", languages: "繁体中文、葡萄牙语（官方）", productHint: "繁中为主" },
  TW: { zone: "汉语区", languages: "繁体中文（官方）", productHint: "繁中" },
  JP: { zone: "日语区", languages: "日语（官方）", productHint: "日语" },
  KR: { zone: "韩语区", languages: "韩语（官方）", productHint: "韩语" },
  MN: { zone: "蒙古语区", languages: "蒙古语（官方）；俄语通行", productHint: "蒙古语+俄语" },

  // —— 东南亚 ——
  ID: { zone: "印尼语区", languages: "印尼语（官方）；英语商务", productHint: "印尼语为主" },
  VN: { zone: "越南语区", languages: "越南语（官方）", productHint: "越南语" },
  MY: { zone: "马来语/英语区", languages: "马来语、英语（官方）；华语通行", productHint: "马来语+英语" },
  TH: { zone: "泰语区", languages: "泰语（官方）", productHint: "泰语" },
  PH: { zone: "他加禄/英语区", languages: "菲律宾语、英语（官方）", productHint: "英语+他加禄" },
  SG: { zone: "英语/多语区", languages: "英语、马来语、华语、泰米尔语（官方）", productHint: "英语为主" },

  // —— 南亚 ——
  IN: { zone: "印地语/英语区", languages: "印地语、英语（联邦）；多邦官方语", productHint: "英语+印地/本地语" },
  BD: { zone: "孟加拉语区", languages: "孟加拉语（官方）；英语商务", productHint: "孟加拉语" },
  PK: { zone: "乌尔都语/英语区", languages: "乌尔都语、英语（官方）", productHint: "乌尔都语+英语" },
  LK: { zone: "僧伽罗/泰米尔区", languages: "僧伽罗语、泰米尔语（官方）；英语通行", productHint: "僧伽罗/泰米尔+英语" },

  // —— 中亚 ——
  KZ: { zone: "突厥语/俄语区", languages: "哈萨克语、俄语（官方）", productHint: "俄语+哈萨克语" },
  UZ: { zone: "突厥语/俄语区", languages: "乌兹别克语（官方）；俄语通行", productHint: "乌兹别克语+俄语" },
  KG: { zone: "突厥语/俄语区", languages: "吉尔吉斯语、俄语（官方）", productHint: "俄语+吉尔吉斯语" },
  TJ: { zone: "波斯语族/俄语区", languages: "塔吉克语（官方）；俄语通行", productHint: "塔吉克语+俄语" },
  TM: { zone: "突厥语区", languages: "土库曼语（官方）；俄语通行", productHint: "土库曼语+俄语" },

  // —— 拉美 ——
  MX: { zone: "西语区", languages: "西班牙语（官方）", productHint: "西语" },
  BR: { zone: "葡语区", languages: "葡萄牙语（官方）", productHint: "葡语" },
  CO: { zone: "西语区", languages: "西班牙语（官方）", productHint: "西语" },
  AR: { zone: "西语区", languages: "西班牙语（官方）", productHint: "西语" },
  PE: { zone: "西语区", languages: "西班牙语、克丘亚语等（官方）", productHint: "西语为主" },
  CL: { zone: "西语区", languages: "西班牙语（官方）", productHint: "西语" },

  // —— 中东与北非 ——
  EG: { zone: "阿语区", languages: "阿拉伯语（官方）；英语商务", productHint: "阿语" },
  MA: { zone: "阿语/法语区", languages: "阿拉伯语、柏柏尔语（官方）；法语通行", productHint: "阿语+法语" },
  DZ: { zone: "阿语/法语区", languages: "阿拉伯语、柏柏尔语（官方）；法语通行", productHint: "阿语+法语" },
  TN: { zone: "阿语/法语区", languages: "阿拉伯语（官方）；法语通行", productHint: "阿语+法语" },
  LY: { zone: "阿语区", languages: "阿拉伯语（官方）", productHint: "阿语" },
  SD: { zone: "阿语区", languages: "阿拉伯语、英语（官方）", productHint: "阿语+英语" },
  SA: { zone: "阿语区", languages: "阿拉伯语（官方）；英语商务", productHint: "阿语" },
  AE: { zone: "阿语/英语区", languages: "阿拉伯语（官方）；英语商务通行", productHint: "阿语+英语" },
  BH: { zone: "阿语/英语区", languages: "阿拉伯语（官方）；英语通行", productHint: "阿语+英语" },
  QA: { zone: "阿语/英语区", languages: "阿拉伯语（官方）；英语通行", productHint: "阿语+英语" },
  KW: { zone: "阿语区", languages: "阿拉伯语（官方）；英语通行", productHint: "阿语" },
  OM: { zone: "阿语区", languages: "阿拉伯语（官方）；英语通行", productHint: "阿语" },
  JO: { zone: "阿语区", languages: "阿拉伯语（官方）；英语通行", productHint: "阿语" },
  LB: { zone: "阿语/法语区", languages: "阿拉伯语（官方）；法语、英语通行", productHint: "阿语+法/英" },
  IQ: { zone: "阿语区", languages: "阿拉伯语、库尔德语（官方）", productHint: "阿语" },
  IL: { zone: "希伯来语区", languages: "希伯来语（官方）；阿拉伯语、英语通行", productHint: "希伯来语+英语" },
  PS: { zone: "阿语区", languages: "阿拉伯语（官方）", productHint: "阿语" },
  TR: { zone: "土耳其语区", languages: "土耳其语（官方）", productHint: "土耳其语" },
  YE: { zone: "阿语区", languages: "阿拉伯语（官方）", productHint: "阿语" },
  IR: { zone: "波斯语区", languages: "波斯语（官方）", productHint: "波斯语" },

  // —— 非洲（撒哈拉以南为主）——
  NG: { zone: "英语区", languages: "英语（官方）；豪萨/约鲁巴/伊博等", productHint: "英语为主" },
  KE: { zone: "斯瓦希里/英语区", languages: "斯瓦希里语、英语（官方）", productHint: "斯瓦希里+英语" },
  GH: { zone: "英语区", languages: "英语（官方）", productHint: "英语" },
  ZA: { zone: "英语/多语区", languages: "英语、南非荷兰语等11种官方语", productHint: "英语为主" },
  TZ: { zone: "斯瓦希里/英语区", languages: "斯瓦希里语、英语（官方）", productHint: "斯瓦希里+英语" },
  UG: { zone: "英语区", languages: "英语（官方）；斯瓦希里通行", productHint: "英语" },
  RW: { zone: "英语/法语区", languages: "基尼阿卢旺达语、英语、法语（官方）", productHint: "英语+本地语" },
  ET: { zone: "阿姆哈拉语区", languages: "阿姆哈拉语（联邦工作语）；多民族语", productHint: "阿姆哈拉语+英语" },
  CI: { zone: "法语区", languages: "法语（官方）", productHint: "法语" },
  SN: { zone: "法语区", languages: "法语（官方）；沃洛夫通行", productHint: "法语" },
  CM: { zone: "法语/英语区", languages: "法语、英语（官方）", productHint: "法语+英语" },
  AO: { zone: "葡语区", languages: "葡萄牙语（官方）", productHint: "葡语" },
  MZ: { zone: "葡语区", languages: "葡萄牙语（官方）", productHint: "葡语" },
  ZM: { zone: "英语区", languages: "英语（官方）", productHint: "英语" },
  ZW: { zone: "英语区", languages: "英语等16种官方语", productHint: "英语" },
  BW: { zone: "英语区", languages: "英语（官方）；茨瓦纳语通行", productHint: "英语" },
  NA: { zone: "英语区", languages: "英语（官方）", productHint: "英语" },
  MU: { zone: "英语/法语区", languages: "英语（官方）；法语、克里奥尔通行", productHint: "英语+法语" },
  MG: { zone: "马达加斯加语/法语区", languages: "马达加斯加语、法语（官方）", productHint: "马达加斯加语+法语" },
  BJ: { zone: "法语区", languages: "法语（官方）", productHint: "法语" },
  BF: { zone: "法语区", languages: "法语（官方）", productHint: "法语" },
  ML: { zone: "法语区", languages: "法语（官方工作语）；多民族语", productHint: "法语" },
  CD: { zone: "法语区", languages: "法语（官方）；林加拉/斯瓦希里等", productHint: "法语" },
  GA: { zone: "法语区", languages: "法语（官方）", productHint: "法语" },

  // —— 欧美 ——
  US: { zone: "英语区", languages: "英语（事实官方）；西语通行", productHint: "英语" },
  CA: { zone: "英语/法语区", languages: "英语、法语（官方）", productHint: "英语+法语" },
  GB: { zone: "英语区", languages: "英语（官方）", productHint: "英语" },
  DE: { zone: "德语区", languages: "德语（官方）", productHint: "德语" },
  FR: { zone: "法语区", languages: "法语（官方）", productHint: "法语" },
  NL: { zone: "荷兰语区", languages: "荷兰语（官方）；英语高普及", productHint: "荷兰语+英语" },
  ES: { zone: "西语区", languages: "西班牙语（官方）", productHint: "西语" },
  PT: { zone: "葡语区", languages: "葡萄牙语（官方）", productHint: "葡语" },
  IT: { zone: "意大利语区", languages: "意大利语（官方）", productHint: "意大利语" },
  SE: { zone: "瑞典语区", languages: "瑞典语（官方）；英语高普及", productHint: "瑞典语+英语" },
  PL: { zone: "波兰语区", languages: "波兰语（官方）", productHint: "波兰语" },
  IE: { zone: "英语区", languages: "爱尔兰语、英语（官方）", productHint: "英语" },
  RU: { zone: "俄语区", languages: "俄语（官方）", productHint: "俄语" },
};

export function getCountryLanguage(code: string): CountryLanguageInfo | undefined {
  return COUNTRY_LANGUAGE[code];
}

/** 卡片/地图一行展示：阿语区 · 阿拉伯语（官方） */
export function formatCountryLanguageLine(code: string): string | undefined {
  const info = getCountryLanguage(code);
  if (!info) return undefined;
  return `${info.zone} · ${info.languages}`;
}

/** 短标：仅语言区 */
export function countryLanguageZone(code: string): string | undefined {
  return getCountryLanguage(code)?.zone;
}

/** 筛选芯片顺序：多国同区优先，其余按名称 */
export const LANGUAGE_ZONE_ORDER: string[] = (() => {
  const counts = new Map<string, number>();
  for (const info of Object.values(COUNTRY_LANGUAGE)) {
    counts.set(info.zone, (counts.get(info.zone) ?? 0) + 1);
  }
  return [...counts.keys()].sort((a, b) => {
    const d = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
    return d !== 0 ? d : a.localeCompare(b, "zh");
  });
})();

/** 某语言区覆盖的 ISO 国码 */
export function countriesInLanguageZone(zone: string): string[] {
  return Object.entries(COUNTRY_LANGUAGE)
    .filter(([, info]) => info.zone === zone)
    .map(([code]) => code);
}
