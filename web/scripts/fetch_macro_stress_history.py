#!/usr/bin/env python3
"""Fetch monthly inflation / policy-rate / retail-gasoline series for Atlas stress charts.

  python3 web/scripts/fetch_macro_stress_history.py

Writes web/src/data/macro-stress-history.json

Sources:
  - inflation: BIS WS_LONG_CPI (UNIT_MEASURE=771, YoY %)
  - policyRate: BIS WS_CBPOL (monthly policy rate %)
  - gasolineRetail: country-macro TE snapshot level × Brent path (FRED/datasets),
    marked synthetic — pump-price level from TE, shape from Brent YoY proxy.
"""
from __future__ import annotations

import csv
import io
import json
import re
import time
import urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/data/macro-stress-history.json"
MACRO = ROOT / "src/data/country-macro.json"
START = "2021-01"
UA = {"User-Agent": "crm-atlas-macro-stress/1.0", "Accept": "text/csv,*/*"}

# BIS long-CPI YoY unit code (annual % change)
CPI_YOY_UNIT = "771"


def http_get(url: str, timeout: int = 180) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def bis_csv(dataset: str, key: str = "M", start: str = START) -> list[dict]:
    url = f"https://stats.bis.org/api/v1/data/{dataset}/{key}?format=csv&startPeriod={start}"
    text = http_get(url).decode("utf-8", "replace")
    return list(csv.DictReader(io.StringIO(text)))


def month_end(ym: str) -> str:
    """2024-01 -> 2024-01-31-ish ISO date for chart axis (use mid-month day 15)."""
    return f"{ym}-15"


def series_from_rows(rows: list[dict], area_field: str = "REF_AREA") -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {}
    for r in rows:
        area = (r.get(area_field) or "").strip()
        period = (r.get("TIME_PERIOD") or "").strip()
        raw = (r.get("OBS_VALUE") or "").strip()
        if not area or not period or not raw:
            continue
        try:
            v = float(raw)
        except ValueError:
            continue
        if v != v:  # NaN
            continue
        # normalize period to YYYY-MM
        if re.fullmatch(r"\d{4}-\d{2}", period):
            d = month_end(period)
        elif re.fullmatch(r"\d{4}-\d{2}-\d{2}", period):
            d = period
        else:
            continue
        out.setdefault(area, []).append({"d": d, "v": round(v, 4)})
    for code, pts in out.items():
        pts.sort(key=lambda p: p["d"])
        # dedupe by date keep last
        dedup: dict[str, float] = {}
        for p in pts:
            dedup[p["d"]] = p["v"]
        out[code] = [{"d": d, "v": dedup[d]} for d in sorted(dedup)]
    return out


def parse_gas_usd(s: str | None) -> float | None:
    if not s:
        return None
    m = re.search(r"([\d.]+)\s*美元", s) or re.search(r"([\d.]+)", s.replace(",", ""))
    return float(m.group(1)) if m else None


def fetch_brent_monthly() -> list[dict]:
    """Monthly average Brent USD/bbl. Tries several open mirrors."""
    urls = [
        "https://cdn.jsdelivr.net/gh/datasets/oil-prices@master/data/brent-daily.csv",
        "https://raw.githubusercontent.com/datasets/oil-prices/master/data/brent-daily.csv",
        "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILBRENTEU&cosd=2021-01-01",
    ]
    daily: list[tuple[str, float]] = []
    last_err: Exception | None = None
    for url in urls:
        try:
            text = http_get(url, timeout=60).decode("utf-8", "replace")
            lines = [ln for ln in text.strip().splitlines() if ln and not ln.startswith("#")]
            if len(lines) < 10:
                continue
            # header sniff
            header = lines[0].lower()
            start_i = 1 if ("date" in header or "observation" in header) else 0
            for ln in lines[start_i:]:
                parts = [p.strip() for p in ln.split(",")]
                if len(parts) < 2:
                    continue
                d, raw = parts[0], parts[1]
                if raw in ("", ".", "NA", "null"):
                    continue
                try:
                    v = float(raw)
                except ValueError:
                    continue
                if v != v:  # NaN
                    continue
                # normalize date
                if re.fullmatch(r"\d{4}-\d{2}-\d{2}", d):
                    daily.append((d, v))
                elif re.fullmatch(r"\d{4}-\d{2}", d):
                    daily.append((month_end(d), v))
            if daily:
                print(f"  brent from {url.split('/')[-1]} n_daily={len(daily)}", flush=True)
                break
        except Exception as e:
            last_err = e
            print(f"  brent fail {url[:48]}: {e}", flush=True)
            time.sleep(0.3)
    if not daily:
        if last_err:
            print(f"  brent unavailable: {last_err}", flush=True)
        return []

    # monthly average
    buckets: dict[str, list[float]] = {}
    for d, v in daily:
        if d < f"{START}-01":
            continue
        ym = d[:7]
        buckets.setdefault(ym, []).append(v)
    out = []
    for ym in sorted(buckets):
        vals = buckets[ym]
        out.append({"d": month_end(ym), "v": round(sum(vals) / len(vals), 4)})
    return out


def scale_gas_to_brent(level: float, brent: list[dict]) -> list[dict]:
    if not brent or level <= 0:
        return []
    clean = [p for p in brent if isinstance(p.get("v"), (int, float)) and p["v"] == p["v"] and p["v"] > 0]
    if not clean:
        return []
    last = clean[-1]["v"]
    out = []
    for p in clean:
        v = round(level * (p["v"] / last), 4)
        if v == v:
            out.append({"d": p["d"], "v": v})
    return out


def monthly_sample(points: list[dict]) -> list[dict]:
    """Already monthly; keep as-is but ensure sorted."""
    return sorted(points, key=lambda p: p["d"])


def main() -> None:
    macro = json.loads(MACRO.read_text(encoding="utf-8"))
    codes = sorted(macro.keys())
    print(f"macro countries {len(codes)}", flush=True)

    print("BIS WS_CBPOL …", flush=True)
    cbpol_rows = bis_csv("WS_CBPOL")
    policy_by = series_from_rows(cbpol_rows)
    print(f"  policy areas {len(policy_by)}", flush=True)

    print("BIS WS_LONG_CPI (YoY unit) …", flush=True)
    cpi_rows = [
        r for r in bis_csv("WS_LONG_CPI") if (r.get("UNIT_MEASURE") or "").strip() == CPI_YOY_UNIT
    ]
    infl_by = series_from_rows(cpi_rows)
    print(f"  inflation areas {len(infl_by)}", flush=True)

    print("Brent path for gasoline proxy …", flush=True)
    brent = fetch_brent_monthly()

    countries: dict[str, dict] = {}
    for code in codes:
        snap = macro.get(code) or {}
        infl = monthly_sample(infl_by.get(code) or [])
        rate = monthly_sample(policy_by.get(code) or [])
        gas_level = parse_gas_usd(snap.get("gasolineRetail"))
        gas_pts: list[dict] = []
        gas_meta: dict = {}
        if gas_level is not None and brent:
            gas_pts = scale_gas_to_brent(gas_level, brent)
            gas_meta = {
                "synthetic": True,
                "method": "te_level_x_brent",
                "levelUsdPerL": gas_level,
                "note": "泵价水平取自国别卡 TE 快照；走势按布伦特月均同比示意，非官方零售汽油序时。",
            }
        elif gas_level is not None:
            # single tip so UI can still show latest without fake path
            as_of = date.today().isoformat()
            m = re.search(r"（(\d{4}-\d{2})", snap.get("gasolineRetail") or "")
            if m:
                as_of = month_end(m.group(1))
            gas_pts = [{"d": as_of, "v": gas_level}]
            gas_meta = {
                "synthetic": False,
                "note": "仅快照时点；布伦特路径暂不可用，未做示意回填。",
            }

        if not infl and not rate and len(gas_pts) < 2:
            continue

        countries[code] = {
            "inflation": {
                "unit": "% YoY",
                "source": "BIS WS_LONG_CPI",
                "points": infl,
            },
            "policyRate": {
                "unit": "%",
                "source": "BIS WS_CBPOL",
                "points": rate,
            },
            "gasolineRetail": {
                "unit": "USD/L",
                "source": "TE snapshot × Brent" if gas_meta.get("synthetic") else "TE snapshot",
                "points": gas_pts,
                **gas_meta,
            },
        }

    today = date.today().isoformat()
    payload = {
        "meta": {
            "asOf": today,
            "range": f"{START}..{today[:7]}",
            "sample": "monthly",
            "note": "景气与定价压测序时：通胀/政策利率为 BIS 观测；零售汽油多为 TE 水平×布伦特示意。",
            "sources": {
                "inflation": "BIS WS_LONG_CPI UNIT_MEASURE=771",
                "policyRate": "BIS WS_CBPOL",
                "gasolineRetail": "country-macro TE level × Brent monthly (synthetic when path available)",
            },
        },
        "countries": countries,
    }
    OUT.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":"), allow_nan=False),
        encoding="utf-8",
    )
    print(
        f"wrote {OUT} countries={len(countries)} "
        f"infl={sum(1 for c in countries.values() if c['inflation']['points'])} "
        f"rate={sum(1 for c in countries.values() if c['policyRate']['points'])} "
        f"gas={sum(1 for c in countries.values() if len(c['gasolineRetail']['points']) >= 2)}",
        flush=True,
    )


if __name__ == "__main__":
    main()
