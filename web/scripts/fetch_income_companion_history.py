#!/usr/bin/env python3
"""Fetch annual income-companion series to pair with sector-mix snapshot.

  python3 web/scripts/fetch_income_companion_history.py

Writes web/src/data/income-companion-history.json

World Bank WDI (CSV zip; JSON API often 502):
  - NY.GDP.PCAP.CD          GDP per capita (current US$)
  - BX.TRF.PWKR.DT.GD.ZS    Personal remittances received (% of GDP)
  - NV.AGR.TOTL.ZS          Agriculture, value added (% of GDP)
  - NV.SRV.TOTL.ZS          Services, value added (% of GDP)

三产静态占比 alone cannot judge per-capita income trend; these series are
the intended companion read (level + direction).
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
OUT = ROOT / "src/data/income-companion-history.json"
MACRO = ROOT / "src/data/country-macro.json"
IMF_WB = ROOT / "src/data/country-imf-wb.json"
YEAR_MIN = 2005
UA = {"User-Agent": "crm-atlas-income-companion/1.0", "Accept": "*/*"}

INDICATORS: list[tuple[str, str, str]] = [
    # key, wb code, unit
    ("gdpPerCapita", "NY.GDP.PCAP.CD", "USD"),
    ("remittancesGdp", "BX.TRF.PWKR.DT.GD.ZS", "%GDP"),
    ("agriShare", "NV.AGR.TOTL.ZS", "%GDP"),
    ("servicesShare", "NV.SRV.TOTL.ZS", "%GDP"),
]


def http_get(url: str, timeout: int = 180) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def year_mid(y: int | str) -> str:
    return f"{int(y)}-07-01"


def load_wb_csv_zip(indicator: str) -> dict[str, list[dict]]:
    url = f"https://api.worldbank.org/v2/en/indicator/{indicator}?downloadformat=csv"
    print(f"download {indicator}", flush=True)
    blob = http_get(url)
    zf = zipfile.ZipFile(io.BytesIO(blob))
    data_name = next(n for n in zf.namelist() if n.startswith("API_") and n.endswith(".csv"))
    text = zf.read(data_name).decode("utf-8-sig")
    lines = text.splitlines()
    hdr_i = next(
        i
        for i, ln in enumerate(lines)
        if ln.lstrip().startswith('"Country Name"') or ln.startswith("Country Name")
    )
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
                v = float(raw)
            except ValueError:
                continue
            if v != v:
                continue
            pts.append({"d": year_mid(y), "v": round(v, 4)})
        if len(pts) >= 2:
            pts.sort(key=lambda p: p["d"])
            out[iso3] = pts
    print(f"  {indicator}: iso3={len(out)}", flush=True)
    return out


def parse_gdp_pc(text: str | None) -> tuple[float | None, str | None]:
    if not text:
        return None, None
    m = re.search(r"约?\s*([\d.]+)\s*美元", text)
    if not m:
        return None, None
    am = re.search(r"（(\d{4}-\d{2})", text) or re.search(r"（(\d{4})", text)
    asof = am.group(1) if am else None
    if asof and len(asof) == 4:
        asof = f"{asof}-12"
    return float(m.group(1)), asof


def tip_merge(pts: list[dict], tip_v: float | None, tip_ym: str | None) -> tuple[list[dict], str | None]:
    if tip_v is None or not tip_ym:
        return pts, None
    tip_y = int(tip_ym[:4])
    tip_d = f"{tip_ym}-15" if len(tip_ym) >= 7 else f"{tip_ym}-12-15"
    last_y = int(pts[-1]["d"][:4])
    if tip_y > last_y or (tip_y == last_y and tip_d > pts[-1]["d"]):
        clean = list(pts)
        if clean and clean[-1]["d"][:4] == tip_ym[:4]:
            clean[-1] = {"d": tip_d, "v": round(tip_v, 4)}
        else:
            clean.append({"d": tip_d, "v": round(tip_v, 4)})
        return clean, f"末端并入国别卡（{tip_ym}）"
    return pts, None


def main() -> None:
    macro = json.loads(MACRO.read_text(encoding="utf-8"))
    imf = json.loads(IMF_WB.read_text(encoding="utf-8"))
    code_to_iso3: dict[str, str] = {}
    for code, row in (imf.get("byCode") or {}).items():
        iso3 = (row or {}).get("iso3")
        if iso3:
            code_to_iso3[code] = iso3

    iso3_to_codes: dict[str, list[str]] = {}
    for code, iso3 in code_to_iso3.items():
        if code in macro:
            iso3_to_codes.setdefault(iso3, []).append(code)

    by_key_iso3: dict[str, dict[str, list[dict]]] = {}
    for key, code, _unit in INDICATORS:
        by_key_iso3[key] = load_wb_csv_zip(code)

    countries: dict[str, dict] = {}
    for iso3, codes in iso3_to_codes.items():
        row: dict = {}
        for key, wb_code, unit in INDICATORS:
            pts = by_key_iso3.get(key, {}).get(iso3)
            if not pts or len(pts) < 2:
                continue
            clean = list(pts)
            note = None
            if key == "gdpPerCapita":
                for c in codes:
                    tip_v, tip_ym = parse_gdp_pc((macro.get(c) or {}).get("gdpPerCapitaUsd"))
                    clean, note = tip_merge(clean, tip_v, tip_ym)
                    if note:
                        break
            series = {
                "unit": unit,
                "source": f"World Bank WDI {wb_code}",
                "freq": "annual",
                "points": clean,
            }
            if note:
                series["note"] = note
            row[key] = series
        if not row:
            continue
        for c in codes:
            countries[c] = row

    today = date.today().isoformat()
    years: list[int] = []
    for row in countries.values():
        for s in row.values():
            for p in s.get("points") or []:
                years.append(int(p["d"][:4]))
    y0, y1 = (min(years), max(years)) if years else (YEAR_MIN, int(today[:4]))
    payload = {
        "meta": {
            "asOf": today,
            "range": f"{y0}..{y1}",
            "sample": "annual",
            "note": "配看三产：人均GDP/侨汇/农业·服务占GDP序时；三产静态图≠人均增减结论。",
            "sources": {k: f"World Bank {c}" for k, c, _ in INDICATORS},
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
