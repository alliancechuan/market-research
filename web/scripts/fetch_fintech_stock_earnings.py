#!/usr/bin/env python3
"""Sync latest earnings cache for fintech stock watchlist.

Primary source: listed-player-disclosure.json (T2 filled KPI).
Preserves manually curated rows in fintech-stock-earnings.json when disclosure
has no newer period.

  python3 web/scripts/fetch_fintech_stock_earnings.py
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

CST = timezone(timedelta(hours=8))
ROOT = Path(__file__).resolve().parents[1]
WATCH = ROOT / "src/data/fintech-stock-watchlist.json"
DISCLOSURE = ROOT / "src/data/listed-player-disclosure.json"
OUT = ROOT / "src/data/fintech-stock-earnings.json"

# disclosure player id / ticker → watchlist id
ID_MAP = {
    "lx": "lexin",
    "lexin": "lexin",
    "finv": "finv",
    "jfin": "jfin",
    "qfin": "qfin",
    "yrd": "yrd",
    "vcredit": "vcredit",
    "grab": "grab",
    "bajaj": "bajaj",
    "nu": "nu",
    "xyf": "xyf",
    "lufax": "lufax",
    "afrm": "afrm",
    "affirm": "afrm",
    "opfi": "opfi",
    "oppfi": "opfi",
    "upst": "upst",
    "upstart": "upst",
    "sofi": "sofi",
    "sofi-lending-us": "sofi",
    "syf": "syf",
    "synchrony": "syf",
    "synchrony-us": "syf",
    "synchrony-us-2": "syf",
    "pags": "pags",
    "pagseguro": "pags",
    "stne": "stne",
    "stone": "stne",
    "meli": "meli",
    "mercadolibre": "meli",
    "sea": "sea",
    "kaspi": "kaspi",
    "inter": "inter-br",
    "inter-br": "inter-br",
    "intr": "inter-br",
    "pypl": "pypl",
    "paypal": "pypl",
    "block": "block",
    "square": "block",
    "xyz": "block",
    "visa": "visa",
    "ma": "ma",
    "mastercard": "ma",
    "goto": "goto",
    "experian": "experian",
    "equifax": "equifax",
    "transunion": "transunion",
    "tru": "transunion",
    "enva": "enva",
    "enova": "enva",
    "lc": "lc",
    "lendingclub": "lc",
    "bairong": "bairong",
    "nubank-br": "nubank-br",
    "wise": "wise",
    "paytm": "paytm",
    "dlo": "dlo",
    "dlocal": "dlo",
    "fico": "fico",
    "sbi-cards": "sbi-cards",
    "sbicard": "sbi-cards",
    "capitec": "capitec",
}

TICKER_MAP = {
    "LX": "lexin",
    "LX.O": "lexin",
    "FINV": "finv",
    "FINV.N": "finv",
    "JFIN": "jfin",
    "JFIN.O": "jfin",
    "QFIN": "qfin",
    "QFIN.O": "qfin",
    "YRD": "yrd",
    "YRD.N": "yrd",
    "2003.HK": "vcredit",
    "2003": "vcredit",
    "GRAB": "grab",
    "GRAB.O": "grab",
    "BAJFINANCE.NS": "bajaj",
    "BAJFINANCE": "bajaj",
    "NU": "nu",
    "NU.N": "nu",
    "XYF": "xyf",
    "LU": "lufax",
    "AFRM": "afrm",
    "OPFI": "opfi",
    "UPST": "upst",
    "SOFI": "sofi",
    "SYF": "syf",
    "PAGS": "pags",
    "STNE": "stne",
    "MELI": "meli",
    "SE": "sea",
    "KSPI": "kaspi",
    "INTR": "inter-br",
    "PYPL": "pypl",
    "XYZ": "block",
    "SQ": "block",
    "V": "visa",
    "MA": "ma",
    "GOTO.JK": "goto",
    "GOTO": "goto",
    "EXPN.L": "experian",
    "EXPN": "experian",
    "EFX": "equifax",
    "TRU": "transunion",
    "ENVA": "enva",
    "LC": "lc",
    "6608.HK": "bairong",
    "6608": "bairong",
    "NUBR33.SA": "nubank-br",
    "WISE.L": "wise",
    "WISE": "wise",
    "PAYTM.NS": "paytm",
    "PAYTM": "paytm",
    "DLO": "dlo",
    "FICO": "fico",
    "SBICARD.NS": "sbi-cards",
    "SBICARD": "sbi-cards",
    "CPI.JO": "capitec",
    "CPI": "capitec",
}


def period_key(period: str | None, period_end: str | None) -> str:
    if period_end:
        return period_end
    return period or ""


def normalize_ticker(raw: str | None) -> list[str]:
    if not raw:
        return []
    out = []
    for part in raw.replace("，", ",").split(","):
        t = part.split("/")[0].strip().upper()
        if t:
            out.append(t)
            out.append(t.split(".")[0])
    return out



def rebuild_source_links() -> None:
    """Refresh Yahoo/IR/exchange portals used by 信源目录."""
    import urllib.parse
    watch = json.loads(WATCH.read_text(encoding="utf-8"))
    earn_path = OUT
    earn_items = []
    if earn_path.exists():
        earn_items = json.loads(earn_path.read_text(encoding="utf-8")).get("items") or []
    earn = {x["id"]: x for x in earn_items}
    EX = {
        "NASDAQ": "https://www.nasdaq.com/",
        "NYSE": "https://www.nyse.com/",
        "HKEX": "https://www.hkexnews.hk/",
        "IDX": "https://www.idx.co.id/",
        "SET": "https://www.set.or.th/",
        "NSE": "https://www.nseindia.com/",
        "NSE Kenya": "https://www.nse.co.ke/",
        "JSE": "https://www.jse.co.za/",
        "NGX": "https://ngxgroup.com/",
        "EGX": "https://www.egx.com.eg/",
        "Tadawul": "https://www.saudiexchange.sa/",
        "BMV": "https://www.bmv.com.mx/",
        "B3": "https://www.b3.com.br/",
        "PSE": "https://www.pse.com.ph/",
        "KASE": "https://kase.kz/",
        "LSE": "https://www.londonstockexchange.com/",
        "ADX": "https://www.adx.ae/",
        "ASX": "https://www.asx.com.au/",
        "Euronext": "https://www.euronext.com/",
        "Bursa MY": "https://www.bursamalaysia.com/",
        "GSE": "https://gse.com.gh/",
        "QE": "https://www.qe.com.qa/",
        "CSE": "https://www.casablanca-bourse.com/",
    }
    companies = []
    for row in watch.get("items") or []:
        er = earn.get(row.get("id") or "")
        y = row.get("yahoo") or row.get("symbol")
        companies.append({
            "id": row.get("id"),
            "nameZh": row.get("nameZh"),
            "symbol": row.get("symbol"),
            "yahoo": y,
            "yahooUrl": f"https://finance.yahoo.com/quote/{urllib.parse.quote(str(y))}",
            "exchange": row.get("exchange"),
            "exchangeUrl": EX.get(row.get("exchange") or ""),
            "region": row.get("region"),
            "origin": row.get("origin"),
            "irUrl": (er or {}).get("irUrl"),
            "period": (er or {}).get("period"),
            "sourceNote": (er or {}).get("sourceNote"),
        })
    links = ROOT / "src/data/fintech-stock-source-links.json"
    payload = {
        "asOf": datetime.now(CST).strftime("%Y-%m-%d"),
        "note": "上市公司数据链：行情快照入口 + 定期披露原文 + 交易所门户；对齐顶栏「上市公司」与 T2 披露缓存。",
        "dataKeys": [
            "fintech-stock-watchlist",
            "fintech-stock-quotes",
            "fintech-stock-earnings",
            "listed-player-disclosure",
        ],
        "hubs": [
            {"id": "yahoo", "titleZh": "Yahoo Finance（股价/市值快照）", "url": "https://finance.yahoo.com/", "kind": "market_data", "citeNo": 16},
            {"id": "sec-edgar", "titleZh": "SEC EDGAR（美股 6-K/10-Q/8-K）", "url": "https://www.sec.gov/edgar/search/", "kind": "disclosure", "citeNo": 17},
            {"id": "hkexnews", "titleZh": "港交所披露易", "url": "https://www.hkexnews.hk/", "kind": "disclosure", "citeNo": 18},
            {"id": "exchanges", "titleZh": "本地交易所门户（总入口）", "url": None, "kind": "exchange", "citeNo": 19, "note": "见 exchanges[]"},
            {"id": "disclosure-cache", "titleZh": "上市定期披露 KPI 缓存（T2）", "url": None, "kind": "disclosure", "citeNo": 20},
        ],
        "exchanges": [{"name": k, "url": v} for k, v in sorted(EX.items())],
        "companies": companies,
        "stats": {
            "companies": len(companies),
            "withIr": sum(1 for c in companies if c.get("irUrl")),
            "exchanges": len(EX),
        },
    }
    links.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", links, "ir", payload["stats"]["withIr"])



def main() -> None:
    watch = json.loads(WATCH.read_text(encoding="utf-8"))
    watch_ids = {x["id"] for x in watch.get("items") or []}

    prior_items: dict[str, dict] = {}
    if OUT.exists():
        try:
            prior = json.loads(OUT.read_text(encoding="utf-8"))
            for it in prior.get("items") or []:
                if it.get("id"):
                    prior_items[it["id"]] = it
        except json.JSONDecodeError:
            pass

    disclosure = json.loads(DISCLOSURE.read_text(encoding="utf-8"))
    filled = [
        p
        for p in disclosure.get("players") or []
        if p.get("status") == "filled" and p.get("kpis")
    ]

    synced: dict[str, dict] = dict(prior_items)
    from_disclosure = 0

    for p in filled:
        wid = ID_MAP.get(p.get("id") or "")
        if not wid:
            for t in normalize_ticker(p.get("ticker")):
                if t in TICKER_MAP:
                    wid = TICKER_MAP[t]
                    break
        if not wid or wid not in watch_ids:
            continue

        incoming = {
            "id": wid,
            "nameZh": p.get("nameZh") or synced.get(wid, {}).get("nameZh"),
            "ticker": p.get("ticker"),
            "period": p.get("period"),
            "periodEnd": p.get("periodEnd"),
            "reportedAt": p.get("reportedAt"),
            "kpis": p.get("kpis") or [],
            "irUrl": p.get("irUrl"),
            "sourceNote": p.get("sourceNote") or "listed-player-disclosure",
            "cashLoanHint": p.get("cashLoanHint") or None,
            "confidence": p.get("confidence") or "高",
            "source": "listed-player-disclosure",
        }

        old = synced.get(wid)
        if old and period_key(old.get("period"), old.get("periodEnd")) > period_key(
            incoming.get("period"), incoming.get("periodEnd")
        ):
            # keep newer cached period
            continue
        # 保留手工 fundamentals（折美元骨架），披露同步不覆盖
        if old and old.get("fundamentals") and not incoming.get("fundamentals"):
            incoming["fundamentals"] = old["fundamentals"]
        synced[wid] = incoming
        from_disclosure += 1

    # attach display names from watchlist when missing
    name_by_id = {x["id"]: x.get("nameZh") for x in watch.get("items") or []}
    items = []
    for wid, row in synced.items():
        if wid not in watch_ids:
            continue
        if not row.get("nameZh"):
            row["nameZh"] = name_by_id.get(wid)
        items.append(row)

    items.sort(key=lambda x: period_key(x.get("period"), x.get("periodEnd")), reverse=True)

    now = datetime.now(CST).strftime("%Y-%m-%d %H:%M")
    payload = {
        "asOf": now,
        "note": "最近一期财报/业绩 KPI 缓存；主源 T2 listed-player-disclosure，可手工续写。",
        "stats": {
            "total": len(items),
            "fromDisclosure": from_disclosure,
            "watchlist": len(watch_ids),
            "coverage": round(len(items) / max(len(watch_ids), 1), 3),
        },
        "items": items,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT, "cached", len(items), "fromDisclosure", from_disclosure)
    rebuild_source_links()


if __name__ == "__main__":
    main()
