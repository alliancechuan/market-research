#!/usr/bin/env python3
"""Fetch consumer-credit directed news for invested markets (Google News RSS).

Writes web/src/data/cc-watch-digest.json — morning-brief primary lane.
36kr remains a weak secondary scan.

  python3 web/scripts/fetch_cc_watch_digest.py
"""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path

CST = timezone(timedelta(hours=8))
ROOT = Path(__file__).resolve().parents[1]
WATCH = ROOT / "src/data/cc-source-watchlist.json"
OUT = ROOT / "src/data/cc-watch-digest.json"
UA = "Mozilla/5.0 (compatible; crm-atlas-cc-watch/1.0)"

# 标题需再过一道消费信贷相关，避免 RSS 泛政治/体育误入
KEEP = re.compile(
    r"NBFC|fintech|lending|loan|credit|SOFOM|OJK|RBI|BOT|BSP|SEC|"
    r"CNBV|Condusef|HKMA|money.?lender|pinjaman|nano.?finance|"
    r"personal.?loan|consumer.?finance|P2P|LPBBTI|virtual.?bank|"
    r"interest.?rate|NPL|collection|监管|牌照|小贷|消金|消费贷|现金贷|"
    r"放债|金管局|信贷|利率",
    re.I,
)
DROP = re.compile(
    r"football|soccer|cricket|movie|celebrity|Bitcoin ETF|"
    r"英伟达|黄金期货|白银",
    re.I,
)


def fetch_rss(query: str, max_items: int = 8) -> list[dict]:
    """Google News RSS — often reset from CN networks; return [] on failure."""
    q = urllib.parse.quote_plus(query)
    url = f"https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=18) as resp:
            raw = resp.read()
    except Exception as e:
        print("rss fail", query[:40], e)
        return []
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as e:
        print("xml fail", e)
        return []
    items = []
    for item in root.findall(".//item")[:max_items]:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        source = ""
        src_el = item.find("source")
        if src_el is not None and src_el.text:
            source = src_el.text.strip()
        if not title:
            continue
        if DROP.search(title):
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


def main() -> None:
    watch = json.loads(WATCH.read_text(encoding="utf-8"))
    prior = {}
    if OUT.exists():
        try:
            prior = json.loads(OUT.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            prior = {}
    prior_by_code = {m.get("code"): m for m in (prior.get("markets") or []) if m.get("code")}

    markets_out = []
    total = 0
    rss_ok = 0
    for m in watch.get("markets") or []:
        seen = set()
        hits = []
        for q in m.get("queries") or []:
            for it in fetch_rss(q, max_items=6):
                key = it["title"].lower()[:80]
                if key in seen:
                    continue
                seen.add(key)
                hits.append(it)
                rss_ok += 1
            time.sleep(0.35)
        # RSS 全空时保留上一轮人工/已核验条目，避免覆盖成空白
        if not hits and m["code"] in prior_by_code:
            kept = prior_by_code[m["code"]]
            hits = list(kept.get("items") or [])
            print(m["code"], "rss empty → keep prior", len(hits))
        else:
            print(m["code"], "hits", len(hits))
        hits = hits[:12]
        total += len(hits)
        prev = prior_by_code.get(m["code"]) or {}
        markets_out.append(
            {
                "code": m["code"],
                "nameZh": m["nameZh"],
                "regulator": m.get("regulator"),
                "portals": m.get("portals") or [],
                "count": len(hits),
                "items": hits,
                "cashLoanHint": prev.get("cashLoanHint")
                or f"核 {m.get('regulator')} 牌照/名录与消费贷规则是否变动",
            }
        )

    now = datetime.now(CST)
    note = (
        "Google News RSS · 展业六国关键词；需人工点开核原文。36氪为辅。"
        if rss_ok
        else "本轮 RSS 不可达，保留已核验人工条目；请点开监管门户核对。36氪为辅。"
    )
    verdict = prior.get("overallVerdict") if not rss_ok and prior.get("overallVerdict") else None
    if not verdict:
        verdict = (
            "以下为已投六国消费信贷/牌照相关公开报道扫描；"
            "以当地监管官网与协会名录为准，RSS 仅作线索。"
            if total
            else "今日定向扫描暂无命中，请回查各国监管门户。"
        )
    payload = {
        "source": "展业国消费信贷定向扫描",
        "generatedAt": now.strftime("%Y-%m-%d %H:%M"),
        "displayDate": now.strftime("%Y-%m-%d"),
        "note": note,
        "stats": {"marketCount": len(markets_out), "itemTotal": total, "rssHits": rss_ok},
        "markets": markets_out,
        "overallVerdict": verdict,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT, "items", total, "rssHits", rss_ok)


if __name__ == "__main__":
    main()
