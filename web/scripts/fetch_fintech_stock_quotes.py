#!/usr/bin/env python3
"""Fetch fintech listed quotes into Atlas snapshot JSON.

Primary: 腾讯行情 qt.gtimg.cn（美/港/伦等；Yahoo 常 403）
Fallback: Yahoo chart + quoteSummary（可达时补）
Merge: 抓不到则保留 OUT 既有价/市值/PE，避免 UI 变空

  python3 web/scripts/fetch_fintech_stock_quotes.py

Writes web/src/data/fintech-stock-quotes.json — static Pages snapshot.
"""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

CST = timezone(timedelta(hours=8))
ROOT = Path(__file__).resolve().parents[1]
WATCH = ROOT / "src/data/fintech-stock-watchlist.json"
OUT = ROOT / "src/data/fintech-stock-quotes.json"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# 粗汇率：把非美股市值折美元
FX_TO_USD = {
    "USD": 1.0,
    "HKD": 1 / 7.80,
    "GBX": 1 / 100 / 0.78,  # pence → GBP → USD
    "GBP": 1 / 0.78,
    "EUR": 1 / 0.92,
    "JPY": 1 / 150.0,
    "KRW": 1 / 1350.0,
}


def _http_get(url: str, headers: dict | None = None) -> bytes | None:
    h = {"User-Agent": UA, "Accept": "*/*"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return resp.read()
    except Exception as e:
        print("http fail", url.split("?")[0][-56:], e)
        return None


def _mcap_label(usd: float | None) -> str | None:
    if usd is None or usd <= 0:
        return None
    if usd >= 1e12:
        return f"${usd / 1e12:.2f}T"
    if usd >= 1e9:
        return f"${usd / 1e9:.1f}B"
    if usd >= 1e6:
        return f"${usd / 1e6:.0f}M"
    return f"${usd:,.0f}"


def _pe_ok(v) -> float | None:
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if f != f or f <= 0 or f > 500:
        return None
    return round(f, 2)


def yahoo_to_tencent(yahoo: str, exchange: str | None) -> str | None:
    """Map watchlist yahoo symbol → 腾讯行情代码；无法映射返回 None。"""
    y = (yahoo or "").strip().upper()
    ex = (exchange or "").strip()
    if not y:
        return None

    if y.endswith(".HK") or ex == "HKEX":
        num = re.sub(r"\D", "", y.split(".")[0])
        if not num:
            return None
        return f"hk{num.zfill(5)}"

    if y.endswith(".L") or ex == "LSE":
        base = y.split(".")[0]
        # Halyk GDR 等在腾讯侧为 uk+代码
        return f"uk{base}"

    # LSE GDR 有时不带 .L（如 HSBK）
    if y in ("HSBK", "BGEO", "TBCB") or (ex == "LSE"):
        return f"uk{y.split('.')[0]}"

    if y.endswith(".AS") or ex == "Euronext":
        return f"nl{y.split('.')[0]}"

    # 东证：3769.T → jp3769
    if y.endswith(".T") or ex == "TSE":
        num = y.split(".")[0]
        if num.isdigit():
            return f"jp{num}"

    # 韩交所：323410.KS / .KQ → kr323410
    if y.endswith(".KS") or y.endswith(".KQ") or ex == "KRX":
        num = y.split(".")[0]
        if num.isdigit():
            return f"kr{num}"

    # 美股及存托：去掉 .O/.N 等后缀
    if ex in ("NYSE", "NASDAQ") or "." not in y:
        base = y.split(".")[0]
        # 避免把 ZIP.AX 误映射成美股 Ziprecruiter
        if ex == "ASX":
            return None
        return f"us{base}"

    # 其它本地所暂无稳定腾讯码
    return None


def fetch_tencent_batch(codes: list[str]) -> dict[str, dict]:
    """Batch fetch 腾讯行情；返回 code → quote dict。"""
    out: dict[str, dict] = {}
    if not codes:
        return out
    # 分批，避免 URL 过长
    for i in range(0, len(codes), 50):
        chunk = codes[i : i + 50]
        url = "https://qt.gtimg.cn/q=" + ",".join(chunk)
        raw_b = _http_get(url)
        if not raw_b:
            continue
        raw = raw_b.decode("gbk", "replace")
        for part in raw.strip().split(";"):
            part = part.strip()
            if not part or "pv_none" in part or '="' not in part:
                continue
            key, val = part.split("=", 1)
            code = key[2:] if key.startswith("v_") else key
            fields = val.strip().strip('"').split("~")
            if len(fields) < 33:
                continue
            try:
                price = float(fields[3])
            except (TypeError, ValueError):
                continue
            if price <= 0:
                continue
            try:
                prev = float(fields[4]) if fields[4] not in ("", "0") else None
            except (TypeError, ValueError):
                prev = None
            try:
                chg = float(fields[32]) if fields[32] not in ("",) else None
            except (TypeError, ValueError):
                chg = None
            if chg is None and prev not in (None, 0):
                chg = (price - prev) / prev * 100.0

            ccy = (fields[35] if len(fields) > 35 else "") or "USD"
            # 港股字段错位时 ccy 可能是价；强制
            if code.startswith("hk"):
                ccy = "HKD"
            elif code.startswith("uk"):
                ccy = ccy if ccy in ("GBX", "GBP", "USD") else "GBX"
            elif code.startswith("us"):
                ccy = "USD"
            elif code.startswith("jp"):
                ccy = "JPY"
            elif code.startswith("kr"):
                ccy = "KRW"

            pe = _pe_ok(fields[39]) if len(fields) > 39 else None

            mcap_usd = None
            if code.startswith("us") and len(fields) > 45:
                # 美股：总市值字段为「亿美元」量级（如 6774 → $677.4B）
                try:
                    yi = float(fields[45])
                    if yi > 0:
                        mcap_usd = yi * 1e8
                except (TypeError, ValueError):
                    pass
            elif code.startswith("hk") and len(fields) > 45:
                # 港股：约「亿港元」
                try:
                    yi = float(fields[45])
                    if yi > 0:
                        mcap_usd = yi * 1e8 * FX_TO_USD["HKD"]
                except (TypeError, ValueError):
                    pass
            elif code.startswith("jp") and len(fields) > 45:
                # 东证：约「亿日元」
                try:
                    yi = float(fields[45])
                    if yi > 0:
                        mcap_usd = yi * 1e8 * FX_TO_USD["JPY"]
                except (TypeError, ValueError):
                    pass
            elif code.startswith("kr") and len(fields) > 45:
                # 韩交所：约「亿韩元」
                try:
                    yi = float(fields[45])
                    if yi > 0:
                        mcap_usd = yi * 1e8 * FX_TO_USD["KRW"]
                except (TypeError, ValueError):
                    pass
            elif code.startswith("uk") and len(fields) > 46:
                # 伦股：常见为百万英镑量级落在靠后字段
                try:
                    raw_m = float(fields[46]) if fields[46] else float(fields[45] or 0)
                    if raw_m > 0:
                        # 经验：>100 视为百万本币
                        mcap_usd = raw_m * 1e6 * FX_TO_USD.get("GBP", 1.28)
                except (TypeError, ValueError):
                    pass

            out[code] = {
                "price": price,
                "previousClose": prev,
                "changePct": round(chg, 2) if chg is not None else None,
                "marketCapUsd": mcap_usd,
                "marketCapLabel": _mcap_label(mcap_usd),
                "peRatio": pe,
                "currency": ccy,
                "marketState": "QQ",
                "exchangeName": "tencent",
            }
        time.sleep(0.05)
    return out


def fetch_yahoo(yahoo: str) -> dict | None:
    qs = urllib.parse.urlencode({"interval": "1d", "range": "5d", "includePrePost": "false"})
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(yahoo)}?{qs}"
    raw_b = _http_get(url)
    if not raw_b:
        return None
    try:
        raw = json.loads(raw_b.decode("utf-8"))
        result = (raw.get("chart") or {}).get("result") or []
        if not result:
            return None
        meta = result[0].get("meta") or {}
        price = meta.get("regularMarketPrice")
        prev = meta.get("chartPreviousClose") or meta.get("previousClose")
        if price is None:
            return None
        change_pct = None
        if prev not in (None, 0):
            change_pct = (float(price) - float(prev)) / float(prev) * 100.0
        mcap = meta.get("marketCap") or meta.get("marketCapitalization")
        mcap_f = float(mcap) if mcap not in (None, "", 0) else None
        # trailing PE
        pe = None
        qs2 = urllib.parse.urlencode({"modules": "summaryDetail,defaultKeyStatistics"})
        url2 = (
            f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/"
            f"{urllib.parse.quote(yahoo)}?{qs2}"
        )
        raw2 = _http_get(url2)
        if raw2:
            try:
                j2 = json.loads(raw2.decode("utf-8"))
                res = ((j2.get("quoteSummary") or {}).get("result") or [None])[0] or {}
                detail = res.get("summaryDetail") or {}
                stats = res.get("defaultKeyStatistics") or {}
                for blob in (detail, stats):
                    for key in ("trailingPE", "forwardPE"):
                        val = blob.get(key)
                        if isinstance(val, dict):
                            val = val.get("raw")
                        pe = _pe_ok(val)
                        if pe is not None and key == "trailingPE":
                            break
                    if pe is not None:
                        break
            except Exception:
                pass
        return {
            "price": float(price),
            "previousClose": float(prev) if prev is not None else None,
            "changePct": round(change_pct, 2) if change_pct is not None else None,
            "marketCapUsd": mcap_f,
            "marketCapLabel": _mcap_label(mcap_f),
            "peRatio": pe,
            "currency": meta.get("currency") or "USD",
            "marketState": meta.get("marketState") or "",
            "exchangeName": meta.get("exchangeName") or meta.get("fullExchangeName") or "yahoo",
        }
    except Exception as e:
        print("yahoo parse fail", yahoo, e)
        return None


def main() -> None:
    watch = json.loads(WATCH.read_text(encoding="utf-8"))
    prior_by_id: dict[str, dict] = {}
    if OUT.exists():
        try:
            prior = json.loads(OUT.read_text(encoding="utf-8"))
            for it in prior.get("items") or []:
                if it.get("id") and it.get("price") is not None:
                    prior_by_id[it["id"]] = it
        except json.JSONDecodeError:
            pass

    # 预映射腾讯码并批量拉
    code_for: dict[str, str] = {}  # id → tencent code
    for row in watch.get("items") or []:
        code = yahoo_to_tencent(row.get("yahoo") or row.get("symbol") or "", row.get("exchange"))
        if code:
            code_for[row["id"]] = code
    tencent_map = fetch_tencent_batch(sorted(set(code_for.values())))
    print("tencent codes", len(code_for), "hit", len(tencent_map))

    items_out = []
    ok = 0
    fresh = 0
    for row in watch.get("items") or []:
        yahoo = row.get("yahoo") or row.get("symbol")
        base = {
            "id": row.get("id"),
            "nameZh": row.get("nameZh"),
            "symbol": row.get("symbol"),
            "yahoo": yahoo,
            "exchange": row.get("exchange"),
            "region": row.get("region"),
            "country": row.get("country"),
            "markets": row.get("markets"),
            "origin": row.get("origin"),
            "groupKey": row.get("groupKey"),
            "url": f"https://finance.yahoo.com/quote/{urllib.parse.quote(str(yahoo))}",
        }
        q = None
        tc = code_for.get(row["id"] or "")
        if tc and tc in tencent_map:
            q = tencent_map[tc]
        if not q:
            q = fetch_yahoo(str(yahoo))
            if q:
                time.sleep(0.2)

        if q:
            # 市值缺失时用旧快照补，避免本地所空白
            prev = prior_by_id.get(row["id"] or "")
            if q.get("marketCapUsd") is None and prev:
                q["marketCapUsd"] = prev.get("marketCapUsd")
                q["marketCapLabel"] = prev.get("marketCapLabel") or _mcap_label(prev.get("marketCapUsd"))
            if q.get("peRatio") is None and prev and prev.get("peRatio"):
                q["peRatio"] = prev.get("peRatio")
            base.update(q)
            ok += 1
            fresh += 1
            print(
                "ok",
                yahoo,
                q.get("price"),
                q.get("changePct"),
                q.get("marketCapLabel"),
                "PE",
                q.get("peRatio"),
                q.get("exchangeName"),
            )
        else:
            prev = prior_by_id.get(row["id"] or "")
            if prev:
                base["price"] = prev.get("price")
                base["changePct"] = prev.get("changePct")
                base["currency"] = prev.get("currency")
                base["previousClose"] = prev.get("previousClose")
                base["marketCapUsd"] = prev.get("marketCapUsd")
                base["marketCapLabel"] = prev.get("marketCapLabel")
                base["peRatio"] = prev.get("peRatio")
                base["marketState"] = prev.get("marketState") or "STALE"
                ok += 1
                print("stale", yahoo, base.get("price"), base.get("marketCapLabel"), "PE", base.get("peRatio"))
            else:
                base["price"] = None
                base["changePct"] = None
                base["marketCapUsd"] = None
                base["marketCapLabel"] = None
                base["peRatio"] = None
                print("skip", yahoo)
        items_out.append(base)

    items_out.sort(key=lambda x: -(x.get("marketCapUsd") or 0))
    with_cap = sum(1 for x in items_out if x.get("marketCapUsd"))
    with_pe = sum(1 for x in items_out if x.get("peRatio") not in (None, 0))
    with_chg = sum(1 for x in items_out if x.get("changePct") is not None)

    now = datetime.now(CST)
    source = (
        f"腾讯行情为主（新鲜 {fresh}）+ Yahoo 回退；PE≈TTM"
        if fresh
        else "行情源不可达，保留既有快照"
    )
    payload = {
        "asOf": now.strftime("%Y-%m-%d"),
        "source": source,
        "note": "asOf 为行情快照日期；peRatio 为约 TTM；涨跌相对昨收。静态站非盘中流式。本地交易所未覆盖者可能仍为旧快照。",
        "stats": {
            "total": len(items_out),
            "quoted": ok,
            "withMarketCap": with_cap,
            "withPe": with_pe,
            "withChangePct": with_chg,
            "fresh": fresh,
        },
        "items": items_out,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        "wrote",
        OUT,
        "quoted",
        ok,
        "/",
        len(items_out),
        "fresh",
        fresh,
        "chg",
        with_chg,
        "cap",
        with_cap,
        "pe",
        with_pe,
    )


if __name__ == "__main__":
    main()
