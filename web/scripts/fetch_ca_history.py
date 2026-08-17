#!/usr/bin/env python3
"""Fetch annual current-account / GDP series for Atlas FX-cross charts.

  python3 web/scripts/fetch_ca_history.py

Writes web/src/data/ca-history.json

Source: World Bank WDI BN.CAB.XOKA.GD.ZS (Current account balance % of GDP).
Optional tip: merge fresher CA/GDP from country-macro.json when asOf year is newer.
"""
from __future__ import annotations

import json
import re
import time
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/data/ca-history.json"
MACRO = ROOT / "src/data/country-macro.json"
IMF_WB = ROOT / "src/data/country-imf-wb.json"
INDICATOR = "BN.CAB.XOKA.GD.ZS"
MRV = 16  # ~2010–2025
CHUNK = 25
UA = {"User-Agent": "crm-atlas-ca-history/1.0", "Accept": "application/json"}


def http_get(url: str, timeout: int = 120) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def year_mid(y: int | str) -> str:
    return f"{int(y)}-07-01"


def parse_ca_gdp(text: str | None) -> tuple[float | None, str | None]:
    """Return (value, YYYY-MM asOf) from country-macro currentAccount field."""
    if not text:
        return None, None
    m = re.search(r"CA/GDP约?\s*(-?[\d.]+)\s*%", text, re.I)
    if not m:
        return None, None
    v = float(m.group(1))
    # prefer asOf nearest the CA/GDP clause
    idx = text.lower().find("ca/gdp")
    seg = text[idx : idx + 80] if idx >= 0 else text
    am = re.search(r"（(\d{4}-\d{2})", seg) or re.search(r"（(\d{4}-\d{2})", text)
    return v, am.group(1) if am else None


def fetch_iso3_chunk(iso3_list: list[str]) -> dict[str, list[dict]]:
    joined = ";".join(iso3_list)
    url = (
        f"https://api.worldbank.org/v2/country/{joined}/indicator/{INDICATOR}"
        f"?format=json&mrv={MRV}&per_page=2000"
    )
    data = json.loads(http_get(url).decode("utf-8", "replace"))
    if not isinstance(data, list) or len(data) < 2 or not data[1]:
        return {}
    out: dict[str, list[dict]] = {}
    for r in data[1]:
        if r.get("value") is None:
            continue
        iso3 = (r.get("countryiso3code") or "").strip()
        y = r.get("date")
        if not iso3 or not y:
            continue
        try:
            v = float(r["value"])
        except (TypeError, ValueError):
            continue
        if v != v:
            continue
        out.setdefault(iso3, []).append({"d": year_mid(y), "v": round(v, 4), "y": int(y)})
    for iso3, pts in out.items():
        pts.sort(key=lambda p: p["d"])
        dedup: dict[str, dict] = {}
        for p in pts:
            dedup[p["d"]] = p
        out[iso3] = [dedup[k] for k in sorted(dedup)]
    return out


def main() -> None:
    macro = json.loads(MACRO.read_text(encoding="utf-8"))
    imf = json.loads(IMF_WB.read_text(encoding="utf-8"))
    code_to_iso3: dict[str, str] = {}
    for code, row in (imf.get("byCode") or {}).items():
        iso3 = (row or {}).get("iso3")
        if iso3:
            code_to_iso3[code] = iso3
    # also map any macro-only codes via identity if already ISO3-length no-op
    for code in macro:
        if code not in code_to_iso3 and len(code) == 2:
            pass

    iso3_list = sorted({v for v in code_to_iso3.values() if v})
    # prefer countries present in macro
    macro_iso3 = sorted({code_to_iso3[c] for c in macro if c in code_to_iso3})
    target = macro_iso3 or iso3_list
    print(f"target iso3 {len(target)} (macro-linked)", flush=True)

    by_iso3: dict[str, list[dict]] = {}
    for i in range(0, len(target), CHUNK):
        chunk = target[i : i + CHUNK]
        print(f"  WB chunk {i // CHUNK + 1}: {chunk[0]}..{chunk[-1]} ({len(chunk)})", flush=True)
        try:
            part = fetch_iso3_chunk(chunk)
            for k, v in part.items():
                by_iso3[k] = v
            print(f"    got {len(part)} countries", flush=True)
        except Exception as e:
            print(f"    fail: {e}", flush=True)
        time.sleep(0.35)

    iso3_to_codes: dict[str, list[str]] = {}
    for code, iso3 in code_to_iso3.items():
        iso3_to_codes.setdefault(iso3, []).append(code)

    countries: dict[str, dict] = {}
    for iso3, pts in by_iso3.items():
        codes = [c for c in iso3_to_codes.get(iso3, []) if c in macro] or iso3_to_codes.get(iso3, [])
        if not codes:
            continue
        clean = [{"d": p["d"], "v": p["v"]} for p in pts]
        tip_note = None
        for code in codes:
            tip_v, tip_ym = parse_ca_gdp((macro.get(code) or {}).get("currentAccount"))
            if tip_v is None or not tip_ym:
                continue
            tip_y = int(tip_ym[:4])
            last_y = int(clean[-1]["d"][:4]) if clean else 0
            tip_d = f"{tip_ym}-15"
            if tip_y > last_y or (tip_y == last_y and tip_d > clean[-1]["d"]):
                # replace same-year mid point or append
                if clean and clean[-1]["d"][:4] == tip_ym[:4]:
                    clean[-1] = {"d": tip_d, "v": round(tip_v, 4)}
                else:
                    clean.append({"d": tip_d, "v": round(tip_v, 4)})
                tip_note = f"末端并入国别卡 CA/GDP（{tip_ym}）"
            break

        if len(clean) < 2:
            continue
        row = {
            "unit": "% GDP",
            "source": "World Bank WDI BN.CAB.XOKA.GD.ZS",
            "freq": "annual",
            "points": clean,
        }
        if tip_note:
            row["note"] = tip_note
        for code in codes:
            if code in macro:
                countries[code] = row

    today = date.today().isoformat()
    years = []
    for row in countries.values():
        for p in row["points"]:
            years.append(int(p["d"][:4]))
    y0, y1 = (min(years), max(years)) if years else (2010, int(today[:4]))

    payload = {
        "meta": {
            "asOf": today,
            "range": f"{y0}..{y1}",
            "sample": "annual (+ optional macro tip)",
            "note": "经常账户/GDP：世行年频；国别卡有更新近的 CA/GDP 时并入末端以便对照。",
            "sources": {"caGdp": f"World Bank {INDICATOR}"},
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
