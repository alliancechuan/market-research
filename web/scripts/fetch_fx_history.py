#!/usr/bin/env python3
"""Fetch multi-year USD→LCY series from Frankfurter (ECB ref) for Atlas FX charts.

  python3 web/scripts/fetch_fx_history.py

Writes web/src/data/fx-history.json — weekly samples, quote = units of LCY per 1 USD
(同 Atlas「本币对美元」口径). 默认约 5 年。
"""
from __future__ import annotations

import json
import time
import urllib.request
from datetime import date, timedelta
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "src/data/fx-history.json"
YEARS = 5

# ISO2 → ISO4217（仅 Frankfurter 支持币种）
COUNTRY_CCY: dict[str, str] = {
    "CN": "CNY",
    "HK": "HKD",
    "JP": "JPY",
    "KR": "KRW",
    "ID": "IDR",
    "MY": "MYR",
    "TH": "THB",
    "PH": "PHP",
    "IN": "INR",
    "MX": "MXN",
    "BR": "BRL",
    "US": "EUR",  # 美国卡：用 EURUSD 的倒数展示「美元强弱」对照（见 note）
    "CA": "CAD",
    "GB": "GBP",
    "DE": "EUR",
    "FR": "EUR",
    "NL": "EUR",
    "ES": "EUR",
    "PT": "EUR",
    "IT": "EUR",
    "IE": "EUR",
    "SE": "SEK",
    "PL": "PLN",
    "TR": "TRY",
    "ZA": "ZAR",
    "IL": "ILS",
    "SG": "SGD",
}

PAIR_NOTE = {
    "US": "美国卡用 EUR 对美元对照（ECB·EUR per USD 取倒数示意美元强弱），非广义美元指数",
}


def fetch_range(ccy: str, start: str, end: str) -> dict[str, float]:
    if ccy == "USD":
        return {}
    url = f"https://api.frankfurter.app/{start}..{end}?from=USD&to={ccy}"
    req = urllib.request.Request(url, headers={"User-Agent": "crm-atlas-fx/1.0"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = json.loads(resp.read().decode())
    out: dict[str, float] = {}
    for d, rates in (data.get("rates") or {}).items():
        v = rates.get(ccy)
        if v is not None:
            out[d] = float(v)
    return out


def fetch_range_chunked(ccy: str, start: date, end: date) -> dict[str, float]:
    """长区间按年切片，避免单次请求过大失败。"""
    out: dict[str, float] = {}
    cur = start
    while cur < end:
        nxt = min(cur + timedelta(days=370), end)
        try:
            part = fetch_range(ccy, cur.isoformat(), nxt.isoformat())
            out.update(part)
            print(f"  {ccy} {cur}..{nxt} -> {len(part)}", flush=True)
        except Exception as e:
            print(f"  fail chunk {ccy} {cur}..{nxt}: {e}", flush=True)
        cur = nxt
        time.sleep(0.25)
    return out


def weekly_sample(series: dict[str, float]) -> list[dict]:
    items = sorted(series.items())
    if not items:
        return []
    picked: list[tuple[str, float]] = []
    last_week = None
    for d, v in items:
        y, w, _ = date.fromisoformat(d).isocalendar()
        key = (y, w)
        if key != last_week:
            picked.append((d, v))
            last_week = key
    if items[-1] != picked[-1]:
        picked.append(items[-1])
    return [{"d": d, "v": round(v, 6)} for d, v in picked]


def main() -> None:
    end = date.today()
    start = end - timedelta(days=365 * YEARS + 14)
    start_s, end_s = start.isoformat(), end.isoformat()

    by_ccy: dict[str, list[dict]] = {}
    unique = sorted({c for c in COUNTRY_CCY.values() if c != "USD"})
    for ccy in unique:
        print("fetch", ccy, flush=True)
        try:
            raw = fetch_range_chunked(ccy, start, end)
            by_ccy[ccy] = weekly_sample(raw)
        except Exception as e:
            print("  fail", ccy, e)
            by_ccy[ccy] = []
        time.sleep(0.2)

    countries: dict[str, dict] = {}
    for code, ccy in COUNTRY_CCY.items():
        pts = by_ccy.get(ccy) or []
        if code == "US" and pts:
            pts = [{"d": p["d"], "v": round(1.0 / p["v"], 6)} for p in pts if p["v"]]
            pair = "USD/EUR"
            unit = "美元/欧元"
        else:
            pair = f"{ccy}/USD"
            unit = f"{ccy} / 1USD"
        countries[code] = {
            "ccy": ccy if code != "US" else "USD",
            "pair": pair,
            "unit": unit,
            "quote": "lcy_per_usd" if code != "US" else "usd_per_eur",
            "source": "Frankfurter / ECB reference",
            "note": PAIR_NOTE.get(code),
            "points": pts,
        }

    payload = {
        "meta": {
            "asOf": end_s,
            "range": f"{start_s}..{end_s}",
            "sample": "weekly ISO week + last",
            "years": YEARS,
            "note": "本币对美元=LCY per 1 USD（与宏观卡文案一致）。缺币种国由前端示意合成。",
        },
        "countries": countries,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print("wrote", OUT, "countries", len(countries), "eg MX", len(countries.get("MX", {}).get("points") or []))


if __name__ == "__main__":
    main()
