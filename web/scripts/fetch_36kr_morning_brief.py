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
    r"信贷|金融|支付|银行|融资|牌照|监管|利率|消费贷|钱包|借钱|贷款|保险|证券|"
    r"IPO|港交所|上市|募资|外汇|黄金|央行|储备|宏观|通胀|GDP|"
    r"东南亚|出海|跨境|Grab|Shopee|TikTok|电商|外卖|出行|"
    r"平台经济|数字金融|fintech|NBFC|小贷|消金|网贷|"
    r"美联储|加息|降息|汇率|人民币|港币|美元",
    re.I,
)

BUCKET_ORDER = [
    "监管·展业属地",
    "宏观·货币",
    "信贷·监管",
    "支付·金融基建",
    "资本·融资",
    "出海·平台",
    "其他",
]

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
    # 属地国名 + 金融牌照/信贷关键词（弱命中，仍限定已投国）
    if re.search(r"牌照|信贷|贷款|消金|小贷|NBFC|OLP|SOFOM|P2P|LPBBTI", text, re.I):
        return True
    return False


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


def bucket(r: dict) -> str:
    t = r["title"] + r["content"]
    if is_reg_ops_flash(t):
        return "监管·展业属地"
    if re.search(r"央行|外汇|黄金|储备|利率|美联储|汇率|宏观|GDP|通胀|加息|降息", t):
        return "宏观·货币"
    if re.search(r"信贷|贷款|消金|小贷|借钱|消费贷|NBFC|牌照|监管", t):
        return "信贷·监管"
    if re.search(r"支付|钱包|银行|保险|证券|数字金融|fintech", t, re.I):
        return "支付·金融基建"
    if re.search(r"IPO|港交所|上市|募资|融资", t):
        return "资本·融资"
    if re.search(r"东南亚|出海|跨境|Grab|Shopee|TikTok|电商|外卖", t, re.I):
        return "出海·平台"
    return "其他"


BUCKET_META = {
    "监管·展业属地": {
        "id": "reggeo",
        "verdict": "只看展业热力图六国（印度/印尼/泰国/菲律宾/墨西哥/中国香港）当地监管动态；国内证监会与交易所监控不进此桶。公开源少见时本桶可为空。",
    },
    "宏观·货币": {
        "id": "macro",
        "verdict": "利率与汇率影响资金成本、锁汇与现金贷定价天花板。",
    },
    "信贷·监管": {
        "id": "credit",
        "verdict": "资产质量与行业整顿影响信贷原生玩家风险中枢。",
    },
    "支付·金融基建": {
        "id": "infra",
        "verdict": "支付/征信/银行通道变动影响获客闭环与结算路径。",
    },
    "资本·融资": {
        "id": "capital",
        "verdict": "融资与上市窗口影响生态机构与资金参与方活跃度，不直接等同放贷风险偏好。",
    },
    "出海·平台": {
        "id": "overseas",
        "verdict": "场景平台税政与流量政策外生冲击场景原生信贷挂载。",
    },
    "其他": {
        "id": "other",
        "verdict": "背景扫描，与展业属地/牌照交叉后再入库。",
    },
}


def build_brief(
    rows: list[dict],
    *,
    window_start: datetime,
    window_end: datetime,
    display: str,
) -> dict:
    start_ms = int(window_start.timestamp() * 1000)
    end_ms = int(window_end.timestamp() * 1000)
    # [window_start, window_end) — 对齐每日 06:00 定点截断
    window = [
        r
        for r in rows
        if r["publishTime"] and start_ms <= r["publishTime"] < end_ms
    ]
    window.sort(key=lambda x: -x["publishTime"])

    # 全量入桶；FOCUS 仅用于组内排序与信号标签
    enriched = []
    for r in window:
        hits = FOCUS.findall(r["title"] + " " + r["content"])
        enriched.append(
            {
                **r,
                "score": len(hits),
                "tags": list(dict.fromkeys(hits)),
                "focus": bool(hits),
            }
        )

    by_b: dict[str, list] = {}
    for r in enriched:
        by_b.setdefault(bucket(r), []).append(r)

    themes = []
    for name in BUCKET_ORDER:
        lst = by_b.get(name) or []
        # 展业属地桶始终保留：无命中时明示「今日公开聚合源无当地监管快讯」
        if not lst and name != "监管·展业属地":
            continue
        lst.sort(key=lambda x: (-x["score"], -x["publishTime"]))
        meta = BUCKET_META.get(name) or {"id": name, "verdict": "按窗口快讯续盯。"}
        # 摘要取组内前 3 条标题（展示用）；sources 为全量
        top = lst[:3]
        if lst:
            summary = scrub_public_text("；".join(r["title"][:36] for r in top))
            if len(summary) > 96:
                summary = summary[:94] + "…"
        else:
            codes = load_ops_market_codes()
            labels = "、".join(OPS_LABEL.get(c, c) for c in codes)
            summary = f"今日公开聚合源未见{labels}当地监管快讯（属地官网优先）"

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
            first = re.split(r"[。！？]", r["content"])[0].strip()
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
                "sources": [
                    {
                        "title": r["title"],
                        "url": "",
                        "time": r["time"],
                    }
                    for r in lst
                ],
            }
        )

    # —— CRM 综合评述：短句分行，监管一条 + 至多三条要点 + 一条动作 ——
    reg_rows = by_b.get("监管·展业属地") or []
    ops_hits: dict[str, list] = {}
    for r in reg_rows:
        mkt = match_ops_market(r["title"] + r["content"]) or "其它属地"
        ops_hits.setdefault(mkt, []).append(r)

    # 白话短评：先监管，再一两句宏观/信贷，无标签、无「动作」
    if reg_rows:
        ops_only = [k for k in ops_hits if k != "其它属地"]
        if ops_only:
            mkts = "、".join(ops_only[:3])
            overall = f"{mkts}今天有监管或牌照相关消息，先看当地玩家牌照还是否有效。"
        else:
            overall = (
                f"今天有 {len(reg_rows)} 条监管/牌照相关快讯（多在其它市场），"
                "已投市场仍按日常核对牌照与名录即可。"
            )
    else:
        overall = (
            "已投市场（印尼、印度、泰国、菲律宾、墨西哥、香港）今天没有看到明显的监管新规，牌照和名录照常核对即可。"
        )
    bits = []
    if next((t for t in themes if t["id"] == "macro"), None):
        bits.append("利率和汇率仍会影响资金成本和锁汇，现金贷定价要跟着看")
    if next((t for t in themes if t["id"] == "credit"), None):
        bits.append("融资回暖也不等于信贷风险已经好转")
    if bits:
        overall = overall.rstrip("。") + "；" + "；".join(bits[:2]) + "。"

    focus_n = sum(1 for r in enriched if r["focus"])

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
            "relevant": len(window),
            "focusHit": focus_n,
            "regOpsCount": len(reg_rows),
            "themeCount": len(themes),
            "windowHours": 24,
            "cutoffHourCst": 6,
        },
        "headline": f"行业晨报 · {display}",
        "lede": "",
        "overallVerdict": overall,
        "themes": themes,
        "moreUrl": "",
    }


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
        "--out",
        default=str(
            Path(__file__).resolve().parents[1] / "src/data/morning-brief-36kr.json"
        ),
    )
    args = ap.parse_args()

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
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(brief, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"wrote {out} · total={brief['stats']['coverageTotal']} "
        f"focus={brief['stats'].get('focusHit', 0)} themes={brief['stats']['themeCount']}"
    )


if __name__ == "__main__":
    main()
