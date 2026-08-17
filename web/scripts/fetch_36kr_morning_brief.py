#!/usr/bin/env python3
"""Fetch public newsflashes and write the daily 06:00 CST morning brief.

Schedule: publish each day at **中国时间 06:00**.
Coverage window: **[D-1 06:00, D 06:00)** CST — full 24h, every flash included
(no relevance drop). Theme buckets are for reading; 「其他」收纳未命中关键词条.

CI: `.github/workflows/morning-brief.yml` — cron `0 22 * * *` (UTC) = 06:00 CST;
commits JSON to main and deploys `gh-pages`. Manual: Actions → Run workflow.

Usage:
  python3 web/scripts/fetch_36kr_morning_brief.py
  python3 web/scripts/fetch_36kr_morning_brief.py --as-of 2026-08-07
  python3 web/scripts/fetch_36kr_morning_brief.py --max-pages 80

Signing: SSR page embeds window.__GATEWAY_SIGN__; POST body adds nonce,
sign = md5(body + nonce). Endpoint: gateway.36kr.com/api/mis/nav/newsflash/list
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

CST = timezone(timedelta(hours=8))

def scrub_public_text(s: str) -> str:
    """Strip source-brand prefixes that must not appear in Atlas UI."""
    if not s:
        return s
    s = re.sub(r"36\s*氪\s*(获悉|报道|讯|称)?[，,:：\s]*", "", s, flags=re.I)
    s = re.sub(r"36\s*kr\s*(获悉|报道|讯|称)?[，,:：\s]*", "", s, flags=re.I)
    s = re.sub(r"https?://(?:www\.)?36kr\.com\S*", "", s, flags=re.I)
    s = s.replace("原文链接", "")
    s = re.sub(r"[，,]{2,}", "，", s)
    s = re.sub(r"\s{2,}", " ", s).strip(" ，,;；")
    return s

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
LIST_URL = "https://gateway.36kr.com/api/mis/nav/newsflash/list"
SSR_URL = "https://www.36kr.com/newsflashes"

FOCUS = re.compile(
    r"信贷|金融|支付|银行|融资|牌照|监管|利率|消费贷|现金贷|钱包|借钱|贷款|保险|"
    r"外汇|央行|储备|宏观|通胀|GDP|就业|催收|征信|多头|不良|NPL|ABS|ABN|小贷|消金|网贷|助贷|"
    r"东南亚|出海|跨境|NBFC|fintech|美联储|加息|降息|汇率|人民币|港币|美元|"
    r"利率上限|持牌|名录|OLP|SOFOM|LPBBTI",
    re.I,
)

# 消费信贷强相关（进三主板块）
CC_STRONG = re.compile(
    r"消费贷|现金贷|小贷|消金|网贷|助贷|借钱|个人贷|零售贷|"
    r"NBFC|OLP|SOFOM|LPBBTI|P-Loan|Nano Finance|"
    r"利率上限|催收|征信|多头|不良|NPL|逾期|"
    r"ABS|ABN|消费金融|持牌|牌照|名录|"
    r"数据本地化|反洗钱",
    re.I,
)

# 汇兑/宏观对现金贷定价与锁汇有用（避免「储备/通胀」单独误伤）
CC_FX_MACRO = re.compile(
    r"央行|政策利率|基准利率|加息|降息|美联储|"
    r"汇率|外汇|锁汇|汇兑|外汇储备|外储|"
    r"通胀|CPI|就业|失业|GDP|宏观",
    re.I,
)

CC_FX_MACRO_STRONG = re.compile(
    r"央行|政策利率|基准利率|加息|降息|美联储|"
    r"汇率|外汇|锁汇|汇兑|外汇储备|外储",
    re.I,
)

# 弱相关：可看但默认折叠
CC_WEAK = re.compile(
    r"支付|钱包|银行|保险|证券|数字金融|fintech|"
    r"IPO|港交所|上市|募资|融资|"
    r"东南亚|出海|跨境|Grab|Shopee|TikTok|电商|外卖|出行",
    re.I,
)

# 噪音：与消费信贷决策无关
CC_NOISE = re.compile(
    r"黄金|白银|贵金属|光伏|硅料|英伟达|AI数据中心|算力|"
    r"星环聚能|核聚变|SpaceX|Cursor|Grok|"
    r"景区内自驾|爷爷不泡茶|旅游景区|"
    r"半导体上游|美股科技巨头|"
    r"新能源集中报价|抱团抬价|"
    r"潮玩|盲盒|开店计划|六城八店|文旅|娱乐旗下|"
    r"航母|修改设计|绿色金融项目支持|座谈会|"
    r"哈佛.*SpaceX|持有价值.*SpaceX|"
    r"SB Energy|World Liberty|信托银行|"
    r"粮食危机|食品通胀",
    re.I,
)

BUCKET_ORDER = [
    "监管·牌照",
    "资产·定价",
    "汇兑·宏观",
    "其他·弱相关",
]

BUCKET_META = {
    "监管·牌照": {
        "id": "reg_license",
        "verdict": "已投属地牌照/利率上限/催收与名录变动，直接决定能否展业。",
    },
    "资产·定价": {
        "id": "asset_price",
        "verdict": "资产质量、融资与定价锚；融资热≠风险已好转。",
    },
    "汇兑·宏观": {
        "id": "fx_macro",
        "verdict": "利率、汇率与通胀影响资金成本、锁汇与现金贷定价天花板。",
    },
    "其他·弱相关": {
        "id": "other_weak",
        "verdict": "弱相关或背景扫描，默认折叠；需要时再展开。",
    },
}


def classify_relevance(text: str) -> str:
    """strong | weak | noise"""
    if CC_NOISE.search(text) and not CC_STRONG.search(text):
        return "noise"
    if is_reg_ops_flash(text) or CC_STRONG.search(text):
        return "strong"
    if CC_FX_MACRO_STRONG.search(text):
        return "strong"
    if CC_FX_MACRO.search(text):
        return "weak"
    if CC_WEAK.search(text) or FOCUS.search(text):
        return "weak"
    return "noise"


def cash_loan_hint(text: str, bucket_name: str) -> str:
    if bucket_name == "监管·牌照":
        return "核对当地牌照/名录是否仍有效"
    if bucket_name == "资产·定价":
        return "看对定价、额度与资产质量的影响"
    if bucket_name == "汇兑·宏观":
        return "联动资金成本与锁汇"
    return "弱相关，作背景"


# 展业属地 = 大屏「展业」热力图国家（producer-holdings），非全球任意监管
OPS_HOLDINGS_PATH = Path(__file__).resolve().parents[1] / "src/data/producer-holdings.json"

OPS_PATTERNS = {
    "IN": r"印度|India|\bRBI\b|NHB|SEBI|NBFC",
    "ID": r"印尼|印度尼西亚|Indonesia|\bOJK\b|Bank Indonesia|LPBBTI|AFPI",
    "TH": r"泰国|Thailand|Bank of Thailand|\bBOT\b|P-Loan|Nano Finance",
    "PH": r"菲律宾|Philippines|\bBSP\b|\bSEC\b.{0,12}(Lending|Financing|OLP)|OLP",
    "MX": r"墨西哥|Mexico|\bCNBV\b|Banxico|CONDUSEF|SOFOM|SIPRES",
    "HK": r"香港|Hong Kong|\bHKMA\b|金管局|金钱服务经营者|\bMSO\b",
}

OPS_LABEL = {
    "IN": "印度",
    "ID": "印尼",
    "TH": "泰国",
    "PH": "菲律宾",
    "MX": "墨西哥",
    "HK": "中国香港",
}

# 国内交易所/证监会等 ≠ 展业属地（中国大陆不在展业六国；港股另走 HK 规则）
CN_DOMESTIC_NOISE = re.compile(
    r"深交所|上交所|北交所|证监会(?!.*香港)|中国证监会|证监局|"
    r"国家能源局|光伏|硅料|黄金ETF|长安基金|万联证券|"
    r"传智教育|高争民爆|爱丽家居|LOF|政府效率部",
    re.I,
)

REG_ACTION = re.compile(
    r"监管|牌照|处罚|罚单|新规|征求意见|条例|办法|指引|通知|"
    r"备案|叫停|整顿|合规|反洗钱|利率上限|催收|数据本地化|"
    r"circular|regulation|license|fine|penalty|guidance|"
    r"名录|持牌|撤销|吊销|叫停|禁令",
    re.I,
)

OPS_REGULATOR = re.compile(
    r"\bRBI\b|\bOJK\b|Bank of Thailand|\bBOT\b|\bBSP\b|"
    r"\bCNBV\b|Banxico|CONDUSEF|\bHKMA\b|金管局|"
    r"SEC.{0,20}(Lending|Financing|OLP)|AFPI|LPBBTI",
    re.I,
)


def load_ops_market_codes() -> list[str]:
    """与展业热力图一致：优先读 producer-holdings 国家码。"""
    try:
        data = json.loads(OPS_HOLDINGS_PATH.read_text(encoding="utf-8"))
        codes = [
            c.get("country_code")
            for c in (data.get("countries") or [])
            if c.get("country_code") in OPS_PATTERNS
        ]
        if codes:
            return list(dict.fromkeys(codes))
    except Exception as e:
        print("warn: load producer-holdings failed:", e)
    return list(OPS_PATTERNS.keys())


def match_ops_market(text: str, codes: list[str] | None = None) -> str | None:
    for code in codes or load_ops_market_codes():
        pat = OPS_PATTERNS.get(code)
        if pat and re.search(pat, text, re.I):
            return OPS_LABEL.get(code, code)
    return None


def is_reg_ops_flash(text: str) -> bool:
    """仅：展业属地（已投国）当地监管动态。国内 A 股/证监会监控不进此桶。"""
    if CN_DOMESTIC_NOISE.search(text) and not match_ops_market(text):
        return False
    mkt = match_ops_market(text)
    if not mkt:
        return False
    # 点名属地 + 监管动作，或点名属地监管机构
    if REG_ACTION.search(text) or OPS_REGULATOR.search(text):
        return True
    # 属地国名 + 金融牌照/信贷/保监关键词（弱命中，仍限定已投国）
    if re.search(
        r"牌照|信贷|贷款|消金|小贷|NBFC|OLP|SOFOM|P2P|LPBBTI|保监|金管|金融|税务",
        text,
        re.I,
    ):
        return True
    return False


def bucket(r: dict) -> str:
    t = r["title"] + " " + r.get("content", "")
    rel = classify_relevance(t)
    if is_reg_ops_flash(t) or (
        match_ops_market(t)
        and re.search(r"牌照|监管|名录|持牌|利率上限|催收|保监|金管|条例|办法", t, re.I)
    ):
        return "监管·牌照"
    # 汇兑宏观：须真有利率/汇率/外储等锚；噪音文进弱相关
    if CC_NOISE.search(t) and not CC_STRONG.search(t):
        pass  # fall through
    elif CC_FX_MACRO_STRONG.search(t) or (
        CC_FX_MACRO.search(t)
        and re.search(r"利率|汇率|通胀|央行|加息|降息|外汇|锁汇|外储|外汇储备", t, re.I)
    ):
        return "汇兑·宏观"
    if CC_STRONG.search(t) or re.search(
        r"信贷|贷款|消金|小贷|NPL|不良|\bABS\b|\bABN\b|消费贷|现金贷|助贷", t, re.I
    ):
        if CC_NOISE.search(t) and not CC_STRONG.search(t):
            return "其他·弱相关"
        return "资产·定价"
    if rel == "noise":
        return "其他·弱相关"
    if CC_WEAK.search(t) and re.search(r"支付|消费|银行通道|征信", t, re.I):
        return "资产·定价"
    return "其他·弱相关"


def http_get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def load_ssr():
    html = http_get(SSR_URL)
    m = re.search(
        r'window\.__GATEWAY_SIGN__="([^"]+)";window\.initialState=(\{.*?\});?\s*</script>',
        html,
        re.S,
    )
    if not m:
        raise RuntimeError("SSR initialState not found")
    return m.group(1), json.loads(m.group(2))


def signed_post(param: dict, nonce: str) -> dict:
    body_obj = {
        "partner_id": "web",
        "timestamp": int(time.time() * 1000),
        "param": param,
        "nonce": nonce,
    }
    body = json.dumps(body_obj, ensure_ascii=False, separators=(",", ":"))
    sign = hashlib.md5((body + nonce).encode()).hexdigest()
    url = f"{LIST_URL}?sign={sign}"
    req = urllib.request.Request(
        url,
        data=body.encode(),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "User-Agent": UA,
            "Origin": "https://www.36kr.com",
            "Referer": "https://www.36kr.com/newsflashes",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def normalize(item: dict) -> dict:
    tm = item.get("templateMaterial") or {}
    pub = tm.get("publishTime") or 0
    dt = datetime.fromtimestamp(pub / 1000, CST) if pub else None
    iid = item.get("itemId") or tm.get("itemId")
    return {
        "id": iid,
        "title": scrub_public_text(tm.get("widgetTitle") or ""),
        "content": scrub_public_text(tm.get("widgetContent") or ""),
        "publishTime": pub,
        "date": dt.strftime("%Y-%m-%d") if dt else "",
        "time": dt.strftime("%H:%M") if dt else "",
        "url": "",
    }


def fetch_items(max_pages: int, window_start_ms: int) -> list[dict]:
    """Paginate until flashes older than window_start, or pages exhausted."""
    nonce, state = load_ssr()
    raw = state["newsflashCatalogData"]["data"]["newsflashList"]["data"]
    items = list(raw.get("itemList") or [])
    cb = raw.get("pageCallback") or ""
    reached_old = False

    for _page in range(max_pages):
        # stop if SSR/first batch already older than window
        if items:
            oldest = min(
                (it.get("templateMaterial") or {}).get("publishTime") or 0 for it in items
            )
            if oldest and oldest < window_start_ms:
                reached_old = True
                break
        if not cb and _page > 0:
            break
        param = {
            "pageSize": 20,
            "pageEvent": 1 if cb else 0,
            "pageCallback": cb or "",
            "siteId": 1,
            "platformId": 2,
            "type": "0",
        }
        try:
            data = signed_post(param, nonce)
        except Exception:
            nonce, _ = load_ssr()
            data = signed_post(param, nonce)
        if data.get("code") != 0:
            raise RuntimeError(f"API error: {data}")
        d = data.get("data") or {}
        batch = d.get("itemList") or []
        if not batch:
            break
        items.extend(batch)
        oldest = min(
            (it.get("templateMaterial") or {}).get("publishTime") or 0 for it in batch
        )
        if oldest and oldest < window_start_ms:
            reached_old = True
            break
        cb = d.get("pageCallback") or ""
        if not d.get("hasNextPage"):
            break
        time.sleep(0.25)

    rows = [normalize(it) for it in items]
    seen: set = set()
    uniq = []
    for r in rows:
        if r["id"] in seen:
            continue
        seen.add(r["id"])
        uniq.append(r)
    if not reached_old:
        print(
            f"warn: may be incomplete — hit max-pages={max_pages} "
            f"before clearing 24h window"
        )
    return uniq


def build_brief(
    rows: list[dict],
    *,
    window_start: datetime,
    window_end: datetime,
    display: str,
) -> dict:
    start_ms = int(window_start.timestamp() * 1000)
    end_ms = int(window_end.timestamp() * 1000)
    window = [
        r
        for r in rows
        if r["publishTime"] and start_ms <= r["publishTime"] < end_ms
    ]
    window.sort(key=lambda x: -x["publishTime"])

    enriched = []
    for r in window:
        text = r["title"] + " " + r.get("content", "")
        hits = FOCUS.findall(text)
        bname = bucket(r)
        rel = classify_relevance(text)
        if bname == "其他·弱相关" and rel == "strong":
            rel = "weak"
        enriched.append(
            {
                **r,
                "score": len(hits) + (3 if rel == "strong" else 0),
                "tags": list(dict.fromkeys(hits)),
                "focus": rel == "strong",
                "relevance": rel,
                "bucket": bname,
                "cashLoanHint": cash_loan_hint(text, bname),
            }
        )

    by_b: dict[str, list] = {}
    for r in enriched:
        by_b.setdefault(r["bucket"], []).append(r)

    themes = []
    for name in BUCKET_ORDER:
        lst = by_b.get(name) or []
        # 三主板块空桶也保留，明示今日无强相关
        if not lst and name == "其他·弱相关":
            continue
        lst.sort(key=lambda x: (-x["score"], -x["publishTime"]))
        meta = BUCKET_META.get(name) or {"id": name, "verdict": "按窗口快讯续盯。"}
        top = lst[:3]
        if lst:
            summary = scrub_public_text("；".join(r["title"][:36] for r in top))
            if len(summary) > 96:
                summary = summary[:94] + "…"
        elif name == "监管·牌照":
            codes = load_ops_market_codes()
            labels = "、".join(OPS_LABEL.get(c, c) for c in codes)
            summary = f"今日未见{labels}当地牌照/监管强相关快讯"
        else:
            summary = "今日该板块暂无强相关快讯"

        tag_count: dict[str, int] = {}
        for r in lst:
            for t in r.get("tags") or []:
                tag_count[t] = tag_count.get(t, 0) + 1
        top_tags = sorted(tag_count.items(), key=lambda x: -x[1])[:4]
        signals = [{"label": t, "value": f"{n}提及"} for t, n in top_tags] or [
            {"label": "条数", "value": str(len(lst))}
        ]

        facts = []
        for r in top:
            first = re.split(r"[。！？]", r.get("content") or "")[0].strip()
            if first and first != r["title"]:
                facts.append(first[:80])
        commentary = meta["verdict"]
        if facts:
            commentary = scrub_public_text(f"{meta['verdict']} 窗口要点：" + "；".join(facts[:2]) + "。")

        themes.append(
            {
                "id": meta["id"],
                "title": name,
                "count": len(lst),
                "summary": summary,
                "signals": signals,
                "commentary": commentary[:420],
                "primary": name != "其他·弱相关",
                "sources": [
                    {
                        "title": r["title"],
                        "url": "",
                        "time": r["time"],
                        "relevance": r.get("relevance") or "weak",
                        "cashLoanHint": r.get("cashLoanHint") or "",
                    }
                    for r in lst
                ],
            }
        )

    reg_rows = by_b.get("监管·牌照") or []
    ops_hits: dict[str, list] = {}
    for r in reg_rows:
        mkt = match_ops_market(r["title"] + " " + r.get("content", "")) or "其它属地"
        ops_hits.setdefault(mkt, []).append(r)

    if reg_rows:
        ops_only = [k for k in ops_hits if k != "其它属地"]
        if ops_only:
            mkts = "、".join(ops_only[:3])
            overall = f"{mkts}有监管/牌照相关消息，先核当地玩家牌照与名录。"
        else:
            overall = f"今日有 {len(reg_rows)} 条监管·牌照向快讯，已投市场照常核名录。"
    else:
        overall = "已投市场今日未见明显牌照/监管强相关快讯，名录照常核对。"

    bits = []
    if by_b.get("汇兑·宏观"):
        bits.append("利率汇率仍影响资金成本与锁汇，现金贷定价跟着看")
    if by_b.get("资产·定价"):
        bits.append("资产与定价信号勿与泛融资热度混为一谈")
    if bits:
        overall = overall.rstrip("。") + "；" + "；".join(bits[:2]) + "。"

    strong_n = sum(1 for r in enriched if r["relevance"] == "strong")
    weak_n = sum(1 for r in enriched if r["relevance"] == "weak")
    noise_n = sum(1 for r in enriched if r["relevance"] == "noise")

    ws = window_start.strftime("%Y-%m-%d %H:%M")
    we = window_end.strftime("%Y-%m-%d %H:%M")
    return {
        "source": "公开快讯汇编",
        "sourceUrl": "",
        "displayDate": display,
        "coverageDate": window_start.strftime("%Y-%m-%d"),
        "windowStart": ws,
        "windowEnd": we,
        "publishAt": f"{display} 06:00",
        "generatedAt": datetime.now(CST).strftime("%Y-%m-%d %H:%M"),
        "stats": {
            "coverageTotal": len(window),
            "relevant": strong_n + weak_n,
            "strong": strong_n,
            "weak": weak_n,
            "noise": noise_n,
            "focusHit": strong_n,
            "regOpsCount": len(reg_rows),
            "themeCount": len(themes),
            "windowHours": 24,
            "cutoffHourCst": 6,
        },
        "headline": f"消费信贷晨报 · {display}",
        "lede": "只突出与牌照、资产定价、汇兑宏观强相关的快讯；其余收入弱相关。",
        "overallVerdict": overall,
        "themes": themes,
        "moreUrl": "",
    }


def reclassify_existing_json(path: Path) -> dict:
    """无网络：用已有 JSON 的标题重分桶（缺正文时仅按标题）。"""
    old = json.loads(path.read_text(encoding="utf-8"))
    rows = []
    base_date = old.get("displayDate") or old.get("coverageDate") or "2026-08-09"
    for th in old.get("themes") or []:
        for s in th.get("sources") or []:
            title = scrub_public_text(s.get("title") or "")
            if not title:
                continue
            hhmm = s.get("time") or "12:00"
            try:
                dt = datetime.strptime(f"{base_date} {hhmm}", "%Y-%m-%d %H:%M").replace(tzinfo=CST)
            except Exception:
                dt = datetime.strptime(base_date, "%Y-%m-%d").replace(tzinfo=CST)
            rows.append(
                {
                    "id": f"{th.get('id')}-{title[:24]}",
                    "title": title,
                    "content": "",
                    "publishTime": int(dt.timestamp() * 1000),
                    "date": base_date,
                    "time": hhmm,
                    "url": "",
                }
            )
    as_of = datetime.strptime(base_date, "%Y-%m-%d").date()
    window_end = datetime(as_of.year, as_of.month, as_of.day, 6, 0, 0, tzinfo=CST)
    # 标题重分时放宽窗口：用整天
    window_start = window_end - timedelta(hours=24)
    # 保证 publishTime 落在窗内：统一拨到 window_start+1h 起
    for i, r in enumerate(rows):
        r["publishTime"] = int(window_start.timestamp() * 1000) + (i + 1) * 60_000
    return build_brief(rows, window_start=window_start, window_end=window_end, display=base_date)


def resolve_as_of(now: datetime, as_of_arg: str | None) -> datetime.date:
    """发布日 D：窗口为 [D-1 06:00, D 06:00)。未指定时取最近已过的 06:00 对应发布日。"""
    if as_of_arg:
        return datetime.strptime(as_of_arg, "%Y-%m-%d").date()
    today6 = now.replace(hour=6, minute=0, second=0, microsecond=0)
    if now >= today6:
        return now.date()
    return (now - timedelta(days=1)).date()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--as-of",
        help="发布日 YYYY-MM-DD（默认：最近已过的 CST 06:00 对应日）",
    )
    ap.add_argument("--max-pages", type=int, default=80)
    ap.add_argument(
        "--reclassify",
        action="store_true",
        help="不抓网，仅按现有 JSON 标题重分为消费信贷三板块",
    )
    ap.add_argument(
        "--out",
        default=str(
            Path(__file__).resolve().parents[1] / "src/data/morning-brief-36kr.json"
        ),
    )
    args = ap.parse_args()
    out = Path(args.out)

    if args.reclassify:
        brief = reclassify_existing_json(out)
        out.write_text(json.dumps(brief, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(
            f"reclassified {out} · total={brief['stats']['coverageTotal']} "
            f"strong={brief['stats'].get('strong', 0)} themes={brief['stats']['themeCount']}"
        )
        return

    now = datetime.now(CST)
    as_of = resolve_as_of(now, args.as_of)
    window_end = datetime(as_of.year, as_of.month, as_of.day, 6, 0, 0, tzinfo=CST)
    window_start = window_end - timedelta(hours=24)
    display = as_of.isoformat()
    start_ms = int(window_start.timestamp() * 1000)

    print(
        f"fetching… publish={display} 06:00 CST · "
        f"window=[{window_start.isoformat()}, {window_end.isoformat()})"
    )
    rows = fetch_items(args.max_pages, start_ms)
    print(f"fetched {len(rows)} unique flashes (raw pages)")
    brief = build_brief(
        rows,
        window_start=window_start,
        window_end=window_end,
        display=display,
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(brief, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"wrote {out} · total={brief['stats']['coverageTotal']} "
        f"strong={brief['stats'].get('strong', 0)} themes={brief['stats']['themeCount']}"
    )


if __name__ == "__main__":
    main()
