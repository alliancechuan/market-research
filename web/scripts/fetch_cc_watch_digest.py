#!/usr/bin/env python3
"""Fetch consumer-credit directed news for invested + hot markets.

Primary: Google News RSS (often reset from CN networks).
Fallback: regional finance RSS (Kontan / Antara / Rappler etc.).
Always merge into prior digest — never wipe curated who/what/how/result.

快讯标准（硬约束）：
  1) 标题：一句话说清楚发生了什么（可扫读）
  2) 展开：一段话说清楚事实与要点（可替代点开原文的最低信息量）
达不到则丢弃，宁缺毋滥。

  python3 web/scripts/fetch_cc_watch_digest.py
"""
from __future__ import annotations

import html
import json
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

CST = timezone(timedelta(hours=8))
ROOT = Path(__file__).resolve().parents[1]
WATCH = ROOT / "src/data/cc-source-watchlist.json"
OUT = ROOT / "src/data/cc-watch-digest.json"
CACHE = ROOT / "src/data/cache/flash"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

KEEP = re.compile(
    r"NBFC|fintech|lending|loan|credit|SOFOM|OJK|RBI|BOT|BSP|"
    r"\bSEC\b|CNBV|Condusef|CONDUSEF|HKMA|money.?lender|pinjaman|nano.?finance|"
    r"personal.?loan|consumer.?finance|P2P|LPBBTI|virtual.?bank|"
    r"digital.?bank|interest.?rate|NPL|collection|监管|牌照|小贷|消金|"
    r"消费贷|现金贷|放债|金管局|信贷|利率|pinjol|pindar|OLP|BNPL|"
    r"Bank of Thailand|monetary policy|policy rate|Baht|"
    r"ธนาคารแห่งประเทศไทย|สินเชื่อ|ดอกเบี้ย|"
    r"Federal Reserve|\bCBN\b|\bFX\b|Peso|\bNIM\b|\bGST\b|\bARC\b|\bBEI\b|demutualisasi|"
    r"literasi|inklusi|\bbank\b|banco|crédito|credito|tasa|Banxico",
    re.I,
)
DROP = re.compile(
    r"football|soccer|cricket|movie|celebrity|Bitcoin ETF|"
    r"英伟达|黄金期货|白银|"
    r"PUBG|esports|e-sports|tennis|Fonseca|Coco\s*2|"
    r"holand[eê]s|abuso de autoridad|mostrará|vence\b|"
    r"Teatro|insecto|hierbas|pasamontañas|Diarios de|"
    r"Fin de semana|seco.?en CDMX|titularon|secretar[ií]a me hizo|"
    r"nuclear|energy security|Meralco|energi|"
    r"WTC licence|integrated township|Megawide|double bottom line",
    re.I,
)

# Google 不可达时的区域财经 RSS（按市场；优先实测可达源）
ALT_FEEDS: dict[str, list[tuple[str, str]]] = {
    "ID": [
        ("Kontan", "https://keuangan.kontan.co.id/rss"),
        ("Antara", "https://www.antaranews.com/rss/ekonomi.xml"),
    ],
    "PH": [
        ("Rappler", "https://www.rappler.com/business/feed/"),
    ],
    "TH": [
        ("ThaiEnquirer", "https://www.thaienquirer.com/feed/"),
    ],
    "IN": [
        ("HinduBL", "https://www.thehindubusinessline.com/feeder/default.rss"),
    ],
    "MX": [
        ("ElFinanciero", "https://www.elfinanciero.com.mx/arc/outboundfeeds/rss/?outputType=xml"),
    ],
    "BR": [
        ("InfoMoney", "https://www.infomoney.com.br/feed/"),
    ],
    "VN": [
        ("VNExpressBiz", "https://vnexpress.net/rss/kinh-doanh.rss"),
    ],
    "US": [
        ("FedReserve", "https://www.federalreserve.gov/feeds/press_all.xml"),
    ],
    "NG": [
        ("PremiumTimes", "https://www.premiumtimesng.com/category/business/feed"),
    ],
    "KE": [
        ("CapitalFM", "https://www.capitalfm.co.ke/business/feed/"),
    ],
    "PK": [
        ("ProPakistani", "https://propakistani.pk/feed/"),
    ],
    "BD": [
        ("TBS", "https://www.tbsnews.net/economy/rss.xml"),
    ],
}


def _get(url: str, timeout: int = 20) -> bytes | None:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "application/rss+xml, application/xml, text/xml, text/html, */*",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except Exception as e:
        print("fetch fail", url[:70], e)
        return None


def _strip(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    return html.unescape(re.sub(r"\s+", " ", text)).strip()


def _title_key(title: str) -> str:
    return (title or "").strip().lower()[:80]


_CJK_RE = re.compile(r"[\u4e00-\u9fff]")
_LATIN_RE = re.compile(r"[A-Za-z]")

# 英文标题短语 → 中文（与前端 financeAbbrGlossary 对齐）
_EN_PHRASES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"Responsible Lending", re.I), "负责任借贷"),
    (re.compile(r"digital lending", re.I), "数字借贷"),
    (re.compile(r"consumer (?:credit|finance|loan)s?", re.I), "消费信贷"),
    (re.compile(r"personal loans?", re.I), "个人贷"),
    (re.compile(r"money lenders?", re.I), "放债人"),
    (re.compile(r"virtual banks?", re.I), "虚拟银行"),
    (re.compile(r"digital banks?", re.I), "数字银行"),
    (re.compile(r"open banking", re.I), "开放银行"),
    (re.compile(r"interest rates?", re.I), "利率"),
    (re.compile(r"non-performing loans?", re.I), "不良贷款"),
    (re.compile(r"buy now,? pay later|\bBNPL\b", re.I), "先买后付"),
    (re.compile(r"peer[- ]to[- ]peer|P2P lending", re.I), "点对点借贷"),
    (re.compile(r"central bank", re.I), "央行"),
    (re.compile(r"electric vehicles?", re.I), "电动车"),
    (re.compile(r"import (?:duty|tariff|tax)", re.I), "进口关税"),
    (re.compile(r"value[- ]added tax|\bVAT\b", re.I), "增值税"),
    (re.compile(r"\bfintech\b", re.I), "金融科技"),
    (re.compile(r"sustainable growth", re.I), "可持续增长"),
    (re.compile(r"energy security", re.I), "能源安全"),
    (re.compile(r"won'?t come cheap|will not come cheap|won[’']t come cheap", re.I), "成本不低"),
    (re.compile(r"it won'?t|it won[’']t", re.I), "并不会"),
    (re.compile(r"come cheap", re.I), "成本低廉"),
    (re.compile(r"blueprint for", re.I), "发展蓝图："),
    (re.compile(r"double bottom line", re.I), "双重底线"),
    (re.compile(r"\bMVP\b"), "管理层观点"),
]

_WORD_ZH = {
    "may": "或将",
    "bring": "带来",
    "but": "但",
    "and": "与",
    "for": "面向",
    "of": "的",
    "to": "至",
    "in": "在",
    "on": "就",
    "with": "与",
    "from": "来自",
    "new": "新的",
    "ban": "禁止",
    "bans": "禁止",
    "proposes": "拟",
    "proposed": "拟议",
    "expands": "扩大",
    "expansion": "扩容",
    "license": "牌照",
    "licences": "牌照",
    "licensed": "持牌",
    "registration": "登记",
    "disclosure": "披露",
    "tighter": "收紧",
    "tightens": "收紧",
    "nuclear": "核能",
    "cheap": "便宜",
    "it": "它",
    "wont": "不会",
    "come": "变得",
    "growth": "增长",
    "blueprint": "蓝图",
    "sustainable": "可持续",
    "the": "",
    "a": "",
    "an": "",
}


def _mostly_chinese(text: str) -> bool:
    cjk = len(_CJK_RE.findall(text or ""))
    latin = len(_LATIN_RE.findall(text or ""))
    if cjk >= 8:
        return True
    if cjk == 0 and latin > 6:
        return False
    return cjk >= latin


_MEDIA_SHELL_RE = re.compile(
    r"^(?:【\s*外媒\s*[·•・，,、|/｜]?\s*[^】]{0,24}\s*】\s*)+"
)
_MEDIA_LEAD_RE = re.compile(r"^(?:外媒速览[：:]\s*)+")

# 外文标题 → (中文标题一句, 展开一段)。先长后短；命中则同时满足快讯标准。
_FLASH_STORIES: list[tuple[re.Pattern[str], str, str]] = [
    (
        re.compile(r"Federal Reserve.*(?:requests? comment|proposed rule).*insider", re.I),
        "美联储征求意见：拟现代化银行向内部人放贷规则",
        "美联储就修订银行向高管、董事与大股东等「内部人」放贷的规则公开征求意见，意在更新既有框架。对新兴市场现金贷展业信号弱，仅作全球监管对照。",
    ),
    (
        re.compile(r"Federal Reserve.*enforcement.*lending|chief lending", re.I),
        "美联储对一家社区银行前信贷官采取执法行动",
        "美联储对 Heritage State Bank 前首席信贷官发布执法行动。属个案合规处置，不是消费贷赛道主信号。",
    ),
    (
        re.compile(r"Federal Reserve.*task forces?.*monetary|leadership and objectives", re.I),
        "美联储公布货币政策工作组领导与目标",
        "美联储宣布推进货币政策执行相关工作组的领导人事与目标。宏观对照用，不直接指导新兴市场现金贷展业。",
    ),
    (
        re.compile(r"CBN.*(?:FX|securities)|removes FX", re.I),
        "尼日利亚央行取消贴现窗口相关外汇与国债限制",
        "尼日利亚央行取消贴现窗口准入上的外汇与政府债券相关限制，意在改善流动性与市场参与。跨境与本地投放仍要盯外汇与资金面波动。",
    ),
    (
        re.compile(r"Recoveries?.*ARC|ARC.*Recover|Security Receipt", re.I),
        "印度ARC回收加快，一季度证券收据兑付明显超过新发行",
        "报道称资产重组公司（ARC）回收加快，一季度证券收据（SR）兑付规模明显超过新发行。不良处置回笼加快，有助于银行腾挪信贷额度。",
    ),
    (
        re.compile(r"GST.*(?:auto|demand)|auto demand", re.I),
        "马恒达高管称GST下调与利率平稳支撑汽车需求",
        "马恒达高管表示，GST下调叠加利率相对平稳，汽车需求保持韧性。对现金贷是间接消费信号，不能直接等同于无场景现金贷回暖。",
    ),
    (
        re.compile(r"NIM Perbankan.*turun|NIM .+OJK|OJK.+NIM", re.I),
        "印尼银行业NIM回落，OJK说明原因",
        "OJK称2026年6月银行业净息差（NIM）降至约4.34%，并解释回落原因。息差收窄时银行更挑风险定价，现金贷合作的资金成本与额度可能变紧。",
    ),
    (
        re.compile(
            r"(?:5|lima)\s+Strategi.+(?:Literasi|Inklusi)|Ungkap.+(?:Strategi|strategi).+(?:Literasi|Inklusi)",
            re.I,
        ),
        "OJK公布提升金融素养与普惠的5项策略",
        "OJK对外介绍提升国民金融素养与金融普惠的5项策略，属监管宣传与长期能力建设口径。对现金贷展业短期信号弱，细节以原文为准。",
    ),
    (
        re.compile(r"Demutualisasi|BEI", re.I),
        "OJK称BEI demutualisasi有望增强印尼资本市场竞争力",
        "OJK表示印尼证交所（BEI）推进 demutualisasi（去互助化）有助于增强资本市场竞争力。属市场基建叙事，与现金贷展业无直接牌照含义。",
    ),
    (
        re.compile(
            r"Permintaan Pinjaman.+(?:[Tt]ransparansi|[Ff]intech)|[Tt]ransparansi.+(?:[Ff]intech.?[Ll]ending|pinjaman)",
            re.I,
        ),
        "印尼贷款需求走强，网贷信息披露同时成焦点",
        "Kontan报道贷款需求回暖，同时强调金融科技借贷的信息披露与透明度。展业要同步盯需求与合规披露，不能只看放量。",
    ),
    (
        re.compile(r"Emiten Bank.+HSC|kategori HSC", re.I),
        "印尼银行股进入HSC分类，OJK作出回应",
        "有银行股被划入HSC相关分类，OJK就此表态。属股市监管分类与情绪面信号，间接影响银行股估值与资金面观感。",
    ),
    (
        re.compile(r"Peso.+(?:rebota|tipo de cambio)|tipo de cambio.+Peso", re.I),
        "墨西哥比索反弹，汇率回到约17比索兑1美元附近",
        "报道称比索反弹，重新回到约17比索/美元附近。跨境投放与回款仍须盯汇率波动，短线反弹不等于波动结束。",
    ),
    (
        re.compile(
            r"Golpistas.+(?:empr[eé]stimos|marcas)|falsas ofertas.+empr[eé]st",
            re.I,
        ),
        "巴西出现冒用大牌名义推销假贷款的诈骗",
        "InfoMoney报道诈骗分子冒用大型品牌名义投放虚假贷款要约。获客与品牌露出要防撞名，客诉与监管舆情风险随之上升。",
    ),
    (
        re.compile(r"Condusef|CONDUSEF", re.I),
        "墨西哥Condusef持续更新消费金融主体与费用披露核验",
        "Condusef侧持续提供消费金融主体与费用披露相关入口。展业不能拿钱包牌照直接当现金贷牌照，须先核验主体与总费用披露再谈投放。",
    ),
    (
        re.compile(r"CNBV|SOFOM", re.I),
        "墨西哥CNBV/SOFOM监管与CAT披露要求趋严",
        "媒体称CNBV对SOFOM等非银主体的监管与CAT（总年成本）披露要求分阶段趋严。线上消金获客文案与费用披露成本上升。",
    ),
]

# 仅作标题兜底（无对应展开段落时，enrich 会丢弃）
_FLASH_HOOKS: list[tuple[re.Pattern[str], str]] = [
    (pat, title) for pat, title, _body in _FLASH_STORIES
] + [
    (re.compile(r"Federal Reserve.*(?:requests? comment|proposed rule)", re.I), "美联储征求规则意见"),
    (re.compile(r"Federal Reserve.*enforcement", re.I), "美联储执法行动"),
    (re.compile(r"Federal Reserve.*leadership|objectives", re.I), "美联储人事与目标"),
    (re.compile(r"Federal Reserve|Fed\b", re.I), "美联储动态"),
    (re.compile(r"Literasi|Inklusi Keuangan", re.I), "OJK谈金融素养与普惠"),
    (re.compile(r"Permintaan Pinjaman|Pinjaman Tumbuh", re.I), "印尼贷款需求走强"),
    (re.compile(r"Emiten Bank", re.I), "印尼银行股监管分类"),
    (re.compile(r"Peso|比索", re.I), "墨西哥比索汇率波动"),
    (re.compile(r"Golpistas|fraudes?|scam", re.I), "金融诈骗警示"),
    (re.compile(r"Banxico|tasa de inter[eé]s", re.I), "墨西哥央行利率"),
    (re.compile(r"pinjaman|pinjol|LPBBTI|P2P", re.I), "网贷/P2P 动态"),
    (re.compile(r"BNPL|buy now", re.I), "先买后付动态"),
    (re.compile(r"NBFC|digital lending|RBI", re.I), "RBI/NBFC 数字借贷"),
    (re.compile(r"OJK", re.I), "OJK 监管动态"),
    (re.compile(r"BOT|Bank of Thailand|Nano", re.I), "泰国央行个人贷/Nano"),
    (re.compile(r"HKMA|money lender|virtual bank", re.I), "金管局/放债人/虚拟银行"),
    (re.compile(r"BSP|SEC.+lend|online lending", re.I), "菲央行/证监借贷监管"),
    (re.compile(r"interest rate|NPL|credit growth|loan book", re.I), "利率/信贷/不良动态"),
    (re.compile(r"fintech|bank|crédito|credito|lending|loan", re.I), "银行与信贷动态"),
]


def _flash_story(text: str) -> tuple[str, str] | None:
    bare = _bare_foreign_title(text)
    for pat, title, body in _FLASH_STORIES:
        if pat.search(bare):
            return title, body
    return None


_VAGUE_TITLES = {
    "OJK 监管动态",
    "银行与信贷动态",
    "外媒：财经相关报道",
    "OJK谈金融素养与普惠",
    "金融诈骗警示",
    "新获牌照动态",
    "美联储动态",
    "美联储征求规则意见",
    "美联储执法行动",
    "美联储人事与目标",
    "可持续增长叙事",
    "企业可持续增长叙事",
    "地产项目获WTC许可",
    "墨西哥比索汇率波动",
    "印尼贷款需求走强",
    "印尼银行股监管分类",
    "网贷/P2P 动态",
    "先买后付动态",
    "RBI/NBFC 数字借贷",
    "利率/信贷/不良动态",
    "Condusef 消费金融监管",
    "CNBV/SOFOM 监管动态",
    "尼日利亚央行放松外汇限制",
    "OJK谈证交所 demutualisasi",
}


def _bare_foreign_title(raw: str) -> str:
    s = (raw or "").strip()
    s = _MEDIA_SHELL_RE.sub("", s).strip()
    s = _MEDIA_LEAD_RE.sub("", s).strip()
    return s


def _flash_concrete_title(original: str, source: str | None = None) -> str:
    """不可整句汉化时，用故事标题拼出可辨识中文（一句说清）。"""
    story = _flash_story(original)
    if story:
        return story[0]
    bare = _bare_foreign_title(original)
    for pat, zh in _FLASH_HOOKS:
        if pat.search(bare):
            return zh
    src = (source or "").strip()
    if src and not re.search(r"点点|经律师|媒体", src):
        return f"{src}：财经相关"
    return "外媒：财经相关报道"


def _expand_prose(it: dict, title: str) -> str:
    """展开正文：what/how/result 收成一段，去掉与标题完全重复的句子。"""
    parts: list[str] = []
    for key in ("what", "how", "result"):
        val = (it.get(key) or "").strip().rstrip("。；; ")
        if not val or _is_generic_shell(val):
            continue
        if val == title:
            continue
        parts.append(val)
    # 去重
    out: list[str] = []
    for p in parts:
        if any(p in x or x in p for x in out):
            continue
        out.append(p)
    text = "。".join(out).strip()
    if text and not text.endswith("。"):
        text += "。"
    return text


def _meets_flash_standard(title: str, expand: str) -> bool:
    """标题一句 + 展开一段；标题不能是笼统壳，展开不能空/不能只重复标题。"""
    t = (title or "").strip()
    e = (expand or "").strip()
    if len(t) < 8 or t in _VAGUE_TITLES or _is_generic_shell(t):
        return False
    if len(e) < 20:
        return False
    if e.rstrip("。") == t.rstrip("。"):
        return False
    return True


def ensure_flash_chinese(raw: str, source: str | None = None) -> str:
    """偏外文标题 → 默认可读且可辨识的中文；不叠【外媒】壳。"""
    s = (raw or "").strip()
    if not s:
        return s
    # 已是具体中文钩子（无「外媒速览」笼统壳）且无明显外文 → 保留
    if _mostly_chinese(s) and not _MEDIA_SHELL_RE.match(s) and not s.startswith("外媒速览："):
        if len(_LATIN_RE.findall(s)) <= 10:
            return s
    if re.fullmatch(r"外媒速览：[\u4e00-\u9fff、/]+", s):
        # 旧笼统壳：尽量用原文钩子重写（调用方应传 titleEn）
        return _flash_concrete_title(s, source)

    s = _bare_foreign_title(s)
    original = s
    for pat, zh in _EN_PHRASES:
        s = pat.sub(zh, s)

    def _word(m: re.Match[str]) -> str:
        w = m.group(0)
        low = w.lower()
        if w.isupper() and len(w) >= 2:
            return w
        if low in _WORD_ZH:
            return _WORD_ZH[low]
        return w

    if not _mostly_chinese(original):
        s = re.sub(r"[A-Za-z]+(?:'[A-Za-z]+)?", _word, s)
        s = re.sub(r"['’]s\b", "的", s)

    s = re.sub(r"\s{2,}", " ", s).strip()
    s = re.sub(r"(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])", "", s)
    s = re.sub(r"\s*([，。；：、])\s*", r"\1", s)
    s = re.sub(r"(?<=[\u4e00-\u9fff])\s*,\s*(?=[\u4e00-\u9fffA-Za-z])", "，", s)
    s = re.sub(r"(?<=[\u4e00-\u9fff]):\s*", "：", s)
    s = re.sub(r"\s{2,}", " ", s).strip()
    latin_left = len(_LATIN_RE.findall(s))
    cjk = len(_CJK_RE.findall(s))
    # 成段中文叙述（可夹专名）→ 不压壳
    if cjk >= 12 and cjk >= latin_left:
        return re.sub(r"\s{2,}", " ", s).strip()
    known = re.compile(
        r"^(RBI|OJK|NBFC|NBFCs|BSP|BOT|SEC|HKMA|CNBV|BNPL|NPL|POJK|ARC|ESG|IMF|BIS|GDP|CPI|VAT|DTI|Nano|IPO|CEO|App|IR|KPI|Pix|Valor)$",
        re.I,
    )
    leftover = [w for w in re.findall(r"[A-Za-z]{2,}", s) if not known.match(w)]
    if (
        cjk < 8
        or not _mostly_chinese(s)
        or (leftover and (cjk < 10 or latin_left >= cjk))
        or (latin_left > 12 and latin_left > cjk)
    ):
        return _flash_concrete_title(original, source)
    return s


def _is_generic_shell(s: str) -> bool:
    t = _bare_foreign_title(s)
    t = re.sub(r"^外媒[：:]\s*", "", t).strip()
    if not t:
        return True
    if re.fullmatch(
        r"(财经|监管|信贷与金融科技|能源|可持续|财经相关(报道)?|银行与信贷动态)(相关)?",
        t,
    ):
        return True
    if t.endswith("：财经相关") or t.endswith(":财经相关"):
        return True
    return False


def enrich_item_zh(it: dict) -> dict | None:
    out = dict(it)
    title = (out.get("title") or "").strip()
    title_en = (out.get("titleEn") or "").strip()
    probe = title_en or title
    bare = _bare_foreign_title(probe)
    if title_en:
        bare = _bare_foreign_title(title_en) or bare
    if DROP.search(bare) or DROP.search(title):
        return None
    story_probe = None
    for probe in (
        title_en,
        bare,
        (out.get("query") or ""),
        title,
        (out.get("url") or ""),
    ):
        if not probe:
            continue
        story_probe = _flash_story(probe)
        if story_probe:
            break
    # 已有可读中文标题，或命中故事库时，不因外文原题未进 KEEP 而误杀
    if (
        not _mostly_chinese(bare)
        and not KEEP.search(bare)
        and not KEEP.search(title)
        and not story_probe
        and not _mostly_chinese(title)
    ):
        return None

    src = (out.get("source") or "").strip() or None
    foreign_src = bare if not _mostly_chinese(bare) else ""
    if foreign_src:
        out["titleEn"] = foreign_src[:220]
        out["title"] = ensure_flash_chinese(foreign_src, src)
    else:
        # 已是中文标题：只剥壳，不整段重译
        cleaned = _bare_foreign_title(title)
        out["title"] = cleaned if cleaned and not _is_generic_shell(cleaned) else ensure_flash_chinese(title, src)

    generic = {
        "外媒：财经相关报道",
        "外媒速览：财经",
        "外媒速览：信贷与金融科技",
        "外媒速览：监管",
        "外媒速览：能源",
        "外媒速览：可持续",
    }
    title_now = out.get("title") or ""
    if title_now in generic and not out.get("titleEn"):
        return None
    if title_now.endswith("：财经相关") and not out.get("titleEn"):
        return None

    # 五问字段：只清壳，绝不 ensure_flash_chinese（避免「经 Valor 报道」被压成「财经」）
    for key in ("what", "how", "result", "who", "when"):
        val = (out.get(key) or "").strip()
        if not val:
            out[key] = ""
            continue
        if val.startswith("原文：") or val.startswith("原文:"):
            # 留给 titleEn；正文不再重复
            out[key] = ""
            continue
        if _is_generic_shell(val) or val.startswith("外媒速览") or val.startswith("【外媒"):
            out[key] = ""
            continue
        out[key] = val

    # 故事库：标题一句 + 展开一段
    story = story_probe
    if not story:
        for probe in (out.get("titleEn"), foreign_src, out.get("query"), title_now):
            if not probe:
                continue
            story = _flash_story(probe)
            if story:
                break
    if story and (
        title_now in _VAGUE_TITLES
        or _is_generic_shell(title_now)
        or len(title_now) < 10
    ):
        out["title"] = story[0]
        title_now = story[0]

    title_final = (out.get("title") or "").strip()
    what_now = (out.get("what") or "").strip()
    # 抄标题 / 笼统 what 清掉，避免展开无增量
    if what_now == title_final or what_now in _VAGUE_TITLES or _is_generic_shell(what_now):
        out["what"] = ""

    expand = _expand_prose(out, title_final)
    # 只有 so-what、没有事实句 → 用故事库补展开主体
    if story and not ((out.get("what") or "").strip() or (out.get("how") or "").strip()):
        out["what"] = story[1]
        res = (out.get("result") or "").strip()
        if res and res[:10] and res[:10] in story[1]:
            out["result"] = ""
        expand = _expand_prose(out, title_final)
    if story and not _meets_flash_standard(title_final, expand):
        out["what"] = story[1]
        expand = _expand_prose(out, title_final)

    if not _meets_flash_standard(title_final, expand):
        return None
    return out


def dedupe_items(items: list[dict], cap: int = 14) -> list[dict]:
    """按 URL、再按「中文标题+日期」去重；撞车时用信源后缀区分。"""
    out: list[dict] = []
    seen_url: set[str] = set()
    seen_title_day: set[str] = set()
    for it in items:
        enriched = enrich_item_zh(it)
        if not enriched:
            continue
        url = (enriched.get("url") or "").strip()
        if url:
            if url in seen_url:
                continue
            seen_url.add(url)
        title = (enriched.get("title") or "").strip()
        day = (enriched.get("published") or "")[:10]
        key = f"{title}|{day}"
        if title and key in seen_title_day:
            src = (enriched.get("source") or "").strip()
            if src and f"{title} · {src}|{day}" not in seen_title_day:
                title = f"{title} · {src}"
                enriched["title"] = title
                key = f"{title}|{day}"
            else:
                continue
        if title:
            seen_title_day.add(key)
        out.append(enriched)
        if len(out) >= cap:
            break
    return out


def fetch_google_rss(query: str, max_items: int = 8) -> list[dict]:
    q = urllib.parse.quote_plus(query)
    url = f"https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en"
    raw = _get(url, timeout=18)
    if not raw:
        return []
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as e:
        print("xml fail", e)
        return []
    items: list[dict] = []
    for item in root.findall(".//item")[:max_items]:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        source = ""
        src_el = item.find("source")
        if src_el is not None and src_el.text:
            source = src_el.text.strip()
        if not title or DROP.search(title):
            continue
        if not KEEP.search(title) and not KEEP.search(query):
            continue
        items.append(
            {
                "title": title,
                "url": link,
                "published": pub,
                "source": source,
                "query": query,
            }
        )
    return items


def fetch_alt_rss(code: str, max_items: int = 8) -> list[dict]:
    out: list[dict] = []
    CACHE.mkdir(parents=True, exist_ok=True)
    for src, url in ALT_FEEDS.get(code) or []:
        raw = _get(url)
        if not raw:
            continue
        slug = re.sub(r"[^a-z0-9]+", "-", src.lower())
        (CACHE / f"{slug}.xml").write_bytes(raw)
        try:
            # some feeds are not strict XML; fall back to regex
            try:
                root = ET.fromstring(raw)
                blocks = []
                for item in root.findall(".//item"):
                    blocks.append(
                        {
                            "title": (item.findtext("title") or "").strip(),
                            "url": (item.findtext("link") or item.findtext("guid") or "").strip(),
                            "published": (item.findtext("pubDate") or "").strip(),
                        }
                    )
            except ET.ParseError:
                blocks = []
                text = raw.decode("utf-8", errors="ignore")
                for block in re.findall(r"<item\b[\s\S]*?</item>", text, re.I):
                    tm = re.search(r"<title[^>]*>([\s\S]*?)</title>", block, re.I)
                    lm = re.search(r"<link[^>]*>([\s\S]*?)</link>", block, re.I)
                    dm = re.search(r"<pubDate[^>]*>([\s\S]*?)</pubDate>", block, re.I)
                    blocks.append(
                        {
                            "title": _strip(tm.group(1) if tm else ""),
                            "url": _strip(lm.group(1) if lm else ""),
                            "published": _strip(dm.group(1) if dm else ""),
                        }
                    )
            for it in blocks:
                title = _strip(it.get("title") or "")
                link = _strip(it.get("url") or "")
                if not title or not link or DROP.search(title) or not KEEP.search(title):
                    continue
                pub = it.get("published") or ""
                try:
                    pub = parsedate_to_datetime(pub).astimezone(CST).strftime("%Y-%m-%d")
                except Exception:
                    pub = pub[:10] if pub else ""
                out.append(
                    {
                        "title": title[:180],
                        "url": link,
                        "published": pub,
                        "source": src,
                        "query": f"alt-rss:{code}",
                    }
                )
                if len(out) >= max_items:
                    return out
        except Exception as e:
            print("alt parse fail", src, e)
        time.sleep(0.25)
    return out


def merge_items(prior_items: list[dict], fresh: list[dict], cap: int = 14) -> list[dict]:
    """Keep curated prior first; append fresh；统一中文化 + URL/标题去重。"""
    combined = list(prior_items) + list(fresh)
    return dedupe_items(combined, cap=cap)


def main() -> None:
    watch = json.loads(WATCH.read_text(encoding="utf-8"))
    prior: dict = {}
    if OUT.exists():
        try:
            prior = json.loads(OUT.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            prior = {}
    prior_by_code = {m.get("code"): m for m in (prior.get("markets") or []) if m.get("code")}

    markets_out: list[dict] = []
    total = 0
    rss_ok = 0
    alt_ok = 0

    watch_codes = set()
    for m in watch.get("markets") or []:
        code = m["code"]
        watch_codes.add(code)
        seen: set[str] = set()
        hits: list[dict] = []
        for q in m.get("queries") or []:
            for it in fetch_google_rss(q, max_items=6):
                key = _title_key(it["title"])
                if key in seen:
                    continue
                seen.add(key)
                hits.append(it)
                rss_ok += 1
            time.sleep(0.35)
        if not hits:
            alt = fetch_alt_rss(code, max_items=8)
            hits.extend(alt)
            alt_ok += len(alt)
            if alt:
                print(code, "alt-rss", len(alt))
            else:
                print(code, "rss empty")
        else:
            print(code, "google hits", len(hits))

        prev = prior_by_code.get(code) or {}
        merged = merge_items(list(prev.get("items") or []), hits, cap=14)
        total += len(merged)
        row = {
            "code": code,
            "nameZh": m["nameZh"],
            "regulator": m.get("regulator") or prev.get("regulator"),
            "portals": m.get("portals") or prev.get("portals") or [],
            "count": len(merged),
            "items": merged,
            "cashLoanHint": prev.get("cashLoanHint")
            or f"核 {m.get('regulator')} 牌照/名录与消费贷规则是否变动",
        }
        if prev.get("tier"):
            row["tier"] = prev["tier"]
        markets_out.append(row)

    # 保留 watchlist 之外的热点国（diandian_hot 等），并用备源 RSS 续补
    for code, prev in prior_by_code.items():
        if code in watch_codes:
            continue
        prior_items = list(prev.get("items") or [])
        fresh: list[dict] = []
        if code in ALT_FEEDS:
            fresh = fetch_alt_rss(code, max_items=8)
            alt_ok += len(fresh)
            if fresh:
                print(code, "hot-alt-rss", len(fresh))
        merged = merge_items(prior_items, fresh, cap=14)
        markets_out.append(
            {
                **{k: v for k, v in prev.items() if k != "items" and k != "count"},
                "count": len(merged),
                "items": merged,
            }
        )
        total += len(merged)

    now = datetime.now(CST)
    if rss_ok:
        note = "Google News RSS · 展业六国关键词；与既有人工条目 merge。36氪为辅。"
    elif alt_ok:
        note = "Google RSS 不可达，已用区域财经 RSS 回退并 merge 人工条目。"
    else:
        note = "本轮 RSS 不可达，保留已核验人工条目；请点开监管门户核对。"

    verdict = prior.get("overallVerdict") or (
        "以下为已投六国消费信贷/牌照相关公开报道扫描；以当地监管官网与协会名录为准，RSS 仅作线索。"
        if total
        else "今日定向扫描暂无命中，请回查各国监管门户。"
    )
    verdict = ensure_flash_chinese(verdict)
    payload = {
        "source": prior.get("source") or "展业国消费信贷定向扫描",
        "generatedAt": now.strftime("%Y-%m-%d %H:%M"),
        "displayDate": now.strftime("%Y-%m-%d"),
        "note": note,
        "stats": {
            "marketCount": len(markets_out),
            "itemTotal": total,
            "rssHits": rss_ok,
            "altRssHits": alt_ok,
        },
        "markets": markets_out,
        "overallVerdict": verdict,
        "foreword": prior.get("foreword") or "",
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT, "items", total, "rssHits", rss_ok, "altRssHits", alt_ok)


if __name__ == "__main__":
    main()
