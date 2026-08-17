#!/usr/bin/env python3
"""Fetch annual FX reserves series for Atlas FX-cross charts.

  python3 web/scripts/fetch_reserves_history.py

Writes web/src/data/reserves-history.json

Source: World Bank WDI FI.RES.TOTL.CD via indicator CSV zip
(JSON API often 502; bulk CSV is more reliable).
Stored unit: 亿美元 (= USD / 1e8), aligned with Atlas parseReservesUsdBn.
Optional tip: merge fresher 亿美元 from country-macro.json when newer.
"""
from __future__ import annotations

import csv
import io
import json
import re
import zipfile
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/data/reserves-history.json"
MACRO = ROOT / "src/data/country-macro.json"
IMF_WB = ROOT / "src/data/country-imf-wb.json"
INDICATOR = "FI.RES.TOTL.CD"
CSV_URL = f"https://api.worldbank.org/v2/en/indicator/{INDICATOR}?downloadformat=csv"
YEAR_MIN = 2010
UA = {"User-Agent": "crm-atlas-reserves-history/1.0", "Accept": "*/*"}


def http_get(url: str, timeout: int = 180) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def year_mid(y: int | str) -> str:
    return f"{int(y)}-07-01"


def usd_to_yi(usd: float) -> float:
    return round(usd / 1e8, 4)


def parse_reserves_yi(text: str | None) -> tuple[float | None, str | None]:
    if not text:
        return None, None
    m = re.search(r"约?\s*([\d.]+)\s*亿美元", text)
    if not m:
        m2 = re.search(r"约?\s*([\d.]+)\s*亿(?!美元)", text)
        if m2 and re.search(r"美元|USD|外汇储备", text, re.I):
            m = m2
        else:
            return None, None
    v = float(m.group(1))
    am = re.search(r"（(\d{4}-\d{2})", text)
    return v, am.group(1) if am else None


def load_wb_csv_zip() -> dict[str, list[dict]]:
    print(f"download {CSV_URL}", flush=True)
    blob = http_get(CSV_URL)
    zf = zipfile.ZipFile(io.BytesIO(blob))
    data_name = next(n for n in zf.namelist() if n.startswith("API_") and n.endswith(".csv"))
    text = zf.read(data_name).decode("utf-8-sig")
    lines = text.splitlines()
    hdr_i = next(i for i, ln in enumerate(lines) if ln.lstrip().startswith('"Country Name"') or ln.startswith("Country Name"))
    reader = csv.DictReader(io.StringIO("\n".join(lines[hdr_i:])))
    out: dict[str, list[dict]] = {}
    for row in reader:
        iso3 = (row.get("Country Code") or "").strip()
        if not iso3:
            continue
        pts: list[dict] = []
        for key, raw in row.items():
            if not key or not re.fullmatch(r"\d{4}", key.strip()):
                continue
            y = int(key.strip())
            if y < YEAR_MIN:
                continue
            if raw is None or str(raw).strip() == "":
                continue
            try:
                v = usd_to_yi(float(raw))
            except ValueError:
                continue
            if v != v or v < 0:
                continue
            pts.append({"d": year_mid(y), "v": v})
        if len(pts) >= 2:
            pts.sort(key=lambda p: p["d"])
            out[iso3] = pts
    print(f"  parsed iso3 with series: {len(out)}", flush=True)
    return out


def main() -> None:
    macro = json.loads(MACRO.read_text(encoding="utf-8"))
    imf = json.loads(IMF_WB.read_text(encoding="utf-8"))
    code_to_iso3: dict[str, str] = {}
    for code, row in (imf.get("byCode") or {}).items():
        iso3 = (row or {}).get("iso3")
        if iso3:
            code_to_iso3[code] = iso3

    by_iso3 = load_wb_csv_zip()

    iso3_to_codes: dict[str, list[str]] = {}
    for code, iso3 in code_to_iso3.items():
        iso3_to_codes.setdefault(iso3, []).append(code)

    countries: dict[str, dict] = {}
    for iso3, pts in by_iso3.items():
        codes = [c for c in iso3_to_codes.get(iso3, []) if c in macro]
        if not codes:
            continue
        clean = list(pts)
        tip_note = None
        for code in codes:
            tip_v, tip_ym = parse_reserves_yi((macro.get(code) or {}).get("fxReserves"))
            if tip_v is None or not tip_ym:
                continue
            tip_y = int(tip_ym[:4])
            last_y = int(clean[-1]["d"][:4])
            tip_d = f"{tip_ym}-15"
            if tip_y > last_y or (tip_y == last_y and tip_d > clean[-1]["d"]):
                if clean and clean[-1]["d"][:4] == tip_ym[:4]:
                    clean[-1] = {"d": tip_d, "v": round(tip_v, 4)}
                else:
                    clean.append({"d": tip_d, "v": round(tip_v, 4)})
                tip_note = f"末端并入国别卡外储（{tip_ym}）"
            break

        if len(clean) < 2:
            continue
        row = {
            "unit": "亿美元",
            "source": "World Bank WDI FI.RES.TOTL.CD",
            "freq": "annual",
            "points": clean,
        }
        if tip_note:
            row["note"] = tip_note
        for code in codes:
            countries[code] = row

    today = date.today().isoformat()
    years = [int(p["d"][:4]) for row in countries.values() for p in row["points"]]
    y0, y1 = (min(years), max(years)) if years else (YEAR_MIN, int(today[:4]))
    payload = {
        "meta": {
            "asOf": today,
            "range": f"{y0}..{y1}",
            "sample": "annual (+ optional macro tip)",
            "note": "外汇储备：世行总储备（含黄金）现价美元折亿美元；国别卡有更新近点时并入末端。",
            "sources": {"fxReserves": f"World Bank {INDICATOR} (CSV zip)"},
        },
        "countries": countries,
    }
    OUT.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":"), allow_nan=False),
        encoding="utf-8",
    )
    print(f"wrote {OUT} countries={len(countries)}", flush=True)


if __name__ == "__main__":
    main()
