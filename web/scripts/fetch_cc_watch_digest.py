#!/usr/bin/env python3
"""Fetch consumer-credit directed news for invested + hot markets.

Primary: Google News RSS (often reset from CN networks).
Fallback: regional finance RSS (Kontan / Antara / Rappler etc.).
Always merge into prior digest — never wipe curated who/what/how/result.

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
    r"NBFC|fintech|lending|loan|credit|SOFOM|OJK|RBI|BOT|BSP|SEC|"
    r"CNBV|Condusef|HKMA|money.?lender|pinjaman|nano.?finance|"
    r"personal.?loan|consumer.?finance|P2P|LPBBTI|virtual.?bank|"
    r"digital.?bank|interest.?rate|NPL|collection|监管|牌照|小贷|消金|"
    r"消费贷|现金贷|放债|金管局|信贷|利率|pinjol|pindar|OLP|BNPL",
    re.I,
)
DROP = re.compile(
    r"football|soccer|cricket|movie|celebrity|Bitcoin ETF|"
    r"英伟达|黄金期货|白银",
    re.I,
)

# Google 不可达时的区域财经 RSS（按市场）
ALT_FEEDS: dict[str, list[tuple[str, str]]] = {
    "ID": [
        ("Kontan", "https://keuangan.kontan.co.id/rss"),
        ("Antara", "https://www.antaranews.com/rss/ekonomi.xml"),
    ],
    "PH": [
        ("Rappler", "https://www.rappler.com/business/feed/"),
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
    """Keep curated prior first; append fresh titles not already present."""
    seen = {_title_key(it.get("title") or "") for it in prior_items}
    out = list(prior_items)
    for it in fresh:
        k = _title_key(it.get("title") or "")
        if not k or k in seen:
            continue
        # soft near-dup
        if any(k[:40] in s or s[:40] in k for s in seen if s):
            continue
        # preserve richer prior fields if URL matches
        url = (it.get("url") or "").strip()
        if url and any((p.get("url") or "").strip() == url for p in prior_items):
            continue
        out.append(it)
        seen.add(k)
    return out[:cap]


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

    # 保留 watchlist 之外的热点国（diandian_hot 等），避免被脚本冲掉
    for code, prev in prior_by_code.items():
        if code in watch_codes:
            continue
        items = list(prev.get("items") or [])
        markets_out.append(
            {
                **{k: v for k, v in prev.items() if k != "items"},
                "count": len(items),
                "items": items,
            }
        )
        total += len(items)

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
