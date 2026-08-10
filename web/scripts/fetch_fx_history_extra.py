#!/usr/bin/env python3
"""补拉 Frankfurter 没有的币种周序列（currency-api），合并进 fx-history.json。

  python3 web/scripts/fetch_fx_history_extra.py
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from datetime import date, timedelta
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "src/data/fx-history.json"

# Atlas 国码 → ISO4217（currency-api 小写）
EXTRA_CCY: dict[str, str] = {
    "TW": "twd",
    "MN": "mnt",
    "VN": "vnd",
    "BD": "bdt",
    "PK": "pkr",
    "LK": "lkr",
    "KZ": "kzt",
    "UZ": "uzs",
    "KG": "kgs",
    "TJ": "tjs",
    "CO": "cop",
    "AR": "ars",
    "PE": "pen",
    "CL": "clp",
    "EG": "egp",
    "MA": "mad",
    "DZ": "dzd",
    "TN": "tnd",
    "SA": "sar",
    "AE": "aed",
    "BH": "bhd",
    "QA": "qar",
    "KW": "kwd",
    "OM": "omr",
    "JO": "jod",
    "LB": "lbp",
    "IQ": "iqd",
    "NG": "ngn",
    "KE": "kes",
    "GH": "ghs",
    "TZ": "tzs",
    "UG": "ugx",
    "RW": "rwf",
    "ET": "etb",
    "CI": "xof",
    "SN": "xof",
    "BJ": "xof",
    "BF": "xof",
    "ML": "xof",
    "CM": "xaf",
    "GA": "xaf",
    "AO": "aoa",
    "MZ": "mzn",
    "ZM": "zmw",
    "BW": "bwp",
    "NA": "nad",
    "MU": "mur",
    "MG": "mga",
    "RU": "rub",
    "CD": "cdf",
    "LY": "lyd",
    "SD": "sdg",
    # 宏观卡水平约 26 对应 ZiG（API 键 zwg）；zwl 为旧巨额报价勿混用
    "ZW": "zwg",
}


def fetch_usd_day(d: date) -> dict[str, float] | None:
    ds = d.isoformat()
    urls = [
        f"https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{ds}/v1/currencies/usd.min.json",
        f"https://{ds}.currency-api.pages.dev/v1/currencies/usd.min.json",
    ]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "crm-atlas-fx-extra/1.0"})
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode())
            usd = data.get("usd") or {}
            return {k.lower(): float(v) for k, v in usd.items() if isinstance(v, (int, float))}
        except Exception:
            continue
    return None


def week_dates(start: date, end: date) -> list[date]:
    # 对齐到周一
    cur = start - timedelta(days=start.weekday())
    out: list[date] = []
    while cur <= end:
        if cur >= start:
            out.append(cur)
        cur += timedelta(days=7)
    if not out or out[-1] != end:
        out.append(end)
    return out


def main() -> None:
    payload = json.loads(OUT.read_text())
    countries: dict = payload.setdefault("countries", {})
    end = date.today()
    # currency-api 历史大致自 2024-03
    start = date(2024, 3, 5)
    dates = week_dates(start, end)
    print(f"weeks {len(dates)} {start}..{end}", flush=True)

    # date -> rates
    by_day: dict[str, dict[str, float]] = {}
    for i, d in enumerate(dates):
        rates = fetch_usd_day(d)
        if rates:
            by_day[d.isoformat()] = rates
            if i % 10 == 0:
                print(f"  ok {d} n={len(rates)}", flush=True)
        else:
            print(f"  miss {d}", flush=True)
        time.sleep(0.08)

    added = 0
    for code, ccy in EXTRA_CCY.items():
        pts = []
        for ds, rates in sorted(by_day.items()):
            v = rates.get(ccy)
            if v is not None and v > 0:
                pts.append({"d": ds, "v": round(float(v), 6)})
        if len(pts) < 8:
            print(f"skip {code} {ccy} pts={len(pts)}", flush=True)
            continue
        countries[code] = {
            "ccy": ccy.upper(),
            "pair": f"{ccy.upper()}/USD",
            "unit": f"{ccy.upper()} / 1USD",
            "quote": "lcy_per_usd",
            "source": "currency-api (jsDelivr)",
            "note": "周抽样；覆盖自 API 可查日起（约 2024-03 起）",
            "points": pts,
        }
        added += 1
        print(f"wrote {code} {ccy} n={len(pts)} {pts[0]['d']}..{pts[-1]['d']}", flush=True)

    meta = payload.setdefault("meta", {})
    meta["extraAsOf"] = end.isoformat()
    meta["extraNote"] = "非 ECB 币种由 currency-api 周抽样补全"
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print("done added", added, "total countries", len(countries))


if __name__ == "__main__":
    main()
