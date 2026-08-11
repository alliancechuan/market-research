#!/usr/bin/env python3
"""Build global T2 disclosure roster from Atlas credit seeds.

Merges hand-filled KPI overlays (kept in listed-player-disclosure.overlays.json
if present, else extracted from previous listed-player-disclosure.json filled rows).

  python3 web/scripts/build_player_disclosure_roster.py
"""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ATLAS = ROOT / "src/Atlas.tsx"
OUT = ROOT / "src/data/listed-player-disclosure.json"
OVERLAYS = ROOT / "src/data/listed-player-disclosure.overlays.json"
LANG = ROOT / "src/data/countryLanguage.ts"

REGION_LABEL = {
    "east-asia": "东亚",
    "se-asia": "东南亚",
    "south-asia": "南亚",
    "central-asia": "中亚",
    "latam": "拉美",
    "mena": "中东北非",
    "africa": "非洲",
    "west": "欧美",
}

# brand suffix → ISO (approx)
SUFFIX_ISO = {
    "CN": ["CN"],
    "HK": ["HK"],
    "TW": ["TW"],
    "JP": ["JP"],
    "KR": ["KR"],
    "MN": ["MN"],
    "ID": ["ID"],
    "VN": ["VN"],
    "MY": ["MY"],
    "TH": ["TH"],
    "PH": ["PH"],
    "SG": ["SG"],
    "IN": ["IN"],
    "BD": ["BD"],
    "PK": ["PK"],
    "LK": ["LK"],
    "KZ": ["KZ"],
    "UZ": ["UZ"],
    "KG": ["KG"],
    "MX": ["MX"],
    "BR": ["BR"],
    "CO": ["CO"],
    "AR": ["AR"],
    "PE": ["PE"],
    "CL": ["CL"],
    "EC": ["EC"],
    "EG": ["EG"],
    "SA": ["SA"],
    "AE": ["AE"],
    "TR": ["TR"],
    "NG": ["NG"],
    "KE": ["KE"],
    "GH": ["GH"],
    "ZA": ["ZA"],
    "TZ": ["TZ"],
    "UG": ["UG"],
    "CI": ["CI"],
    "ZM": ["ZM"],
    "US": ["US"],
    "EU": [],
    "SEA": ["ID", "VN", "MY", "TH", "PH", "SG"],
    "LATAM": ["MX", "BR", "CO", "AR", "PE", "CL"],
    "MENA": ["EG", "SA", "AE", "TR"],
    "MULTI": [],
}

ORIGIN_RULES = [
    (re.compile(r"bnpl|分期|Afterpay|Klarna|Affirm|Akulaku|Kredivo|Aplazo|Maiya|Atome|Pace|Billease|Homecredit|Home Credit", re.I), "bnpl"),
    (re.compile(
        r"Paytm|M-Pesa|GCash|PalmPay|OPay|Opay|PagSeguro|PagBank|Wallet|支付|"
        r"GPay|TrueMoney|Maya|Cash App|Block|Pix|UPI|MoMo|Wave|Orange Money|"
        r"MTN MoMo|Airtel Money|JazzCash|Easypaisa|bKash|Nagad|Tigo|M-Paisa|"
        r"Dana|OVO|LinkAja|ShopeePay|GoPay|GrabPay|KakaoPay|Toss|PayPay",
        re.I,
    ), "payment"),
    (re.compile(r"Shopee|Mercado|Amazon|Kaspi|电商|Lazada|Tokopedia|PDD|拼多多|美团|JD|京东|阿里|淘宝", re.I), "ecommerce"),
    (re.compile(r"Grab|GoTo|Gojek|DiDi|Uber|Foodpanda|Delivery Hero|出行|外卖|99\b|inDrive", re.I), "ride-food"),
    (re.compile(
        r"Bank|Neo Pinjam|SoFi|Nubank|Digibank|数字银行|Tonik|Jago|SeaBank|"
        r"Neo\b|Virtual Bank|Digital Bank|BNC|OwnBank|WeLab|Ant Bank",
        re.I,
    ), "digibank"),
]


def load_zones() -> dict[str, str]:
    text = LANG.read_text(encoding="utf-8")
    zones = {}
    for code, zone in re.findall(r'^\s*([A-Z]{2}):\s*\{\s*zone:\s*"([^"]+)"', text, re.M):
        zones[code] = zone
    return zones


def parse_listed(atlas: str) -> dict[str, str]:
    m = re.search(r"const LISTED_TICKER_BY_GROUP: Record<string, string> = \{([\s\S]*?)\n\};", atlas)
    out = {}
    if not m:
        return out
    for k, v in re.findall(r'"([^"]+)":\s*"([^"]+)"', m.group(1)):
        out[k] = v
    return out


def parse_equity(atlas: str) -> dict[str, str]:
    out = {}
    for g, eq in re.findall(r'"([^"]+)":\s*\{[^}]*?equity:\s*"([^"]+)"', atlas):
        out[g] = eq
    return out


def parse_seeds(atlas: str) -> list[tuple[str, str, str]]:
    return re.findall(r'\["([a-z-]+)",\s*"(cash|bnpl|lease|agent)",\s*"([^"]+)"\]', atlas)


def brand_suffix(group: str) -> str | None:
    m = re.search(r"·([A-Za-z0-9/]{2,12})）\s*$", group)
    if not m:
        return None
    return m.group(1).split("/")[0]


def name_zh(group: str) -> str:
    # Prefer short brand inside （x·YY）
    m = re.search(r"（([^·（]+)·[^）]+）\s*$", group)
    if m:
        return m.group(1).strip()
    # else first segment
    head = group.split("（")[0]
    parts = re.split(r"[/｜|]", head)
    return (parts[-1] if parts else head).strip() or group


def infer_origin(group: str, line: str) -> str:
    if line == "bnpl":
        return "bnpl"
    for rx, origin in ORIGIN_RULES:
        if rx.search(group):
            return origin
    if line == "lease":
        return "credit-native"
    return "credit-native"


def countries_for(suffix: str | None, region: str) -> list[str]:
    if not suffix:
        return []
    if suffix in SUFFIX_ISO:
        return list(SUFFIX_ISO[suffix])
    # 非洲 / 中亚 plain chinese tags sometimes
    if suffix in ("非洲",):
        return []
    if len(suffix) == 2 and suffix.isalpha():
        return [suffix.upper()]
    return []


def slug_id(group: str, used: set[str]) -> str:
    base = re.sub(r"[^a-zA-Z0-9]+", "-", name_zh(group).lower()).strip("-")[:40] or "player"
    # include country hint
    suf = brand_suffix(group)
    if suf:
        base = f"{base}-{suf.lower()}"
    base = re.sub(r"-+", "-", base).strip("-")
    if base not in used:
        used.add(base)
        return base
    i = 2
    while f"{base}-{i}" in used:
        i += 1
    nid = f"{base}-{i}"
    used.add(nid)
    return nid


def load_overlays() -> list[dict]:
    if OVERLAYS.exists():
        return json.loads(OVERLAYS.read_text(encoding="utf-8")).get("players") or []
    if OUT.exists():
        prev = json.loads(OUT.read_text(encoding="utf-8"))
        return [p for p in prev.get("players") or [] if p.get("status") == "filled" and p.get("kpis")]
    return []


def ticker_from_equity(eq: str) -> str:
    m = re.search(r"(?:NYSE|NASDAQ|HKEX|HK|IDX|NSE|BSE|LSE|AIX):\s*([A-Z0-9.]+)", eq, re.I)
    if m:
        return m.group(1).upper()
    m = re.search(r"\b([A-Z]{1,5}\.(?:N|O|HK|JK|NS|DE|US))\b", eq)
    return m.group(1) if m else ""


def main() -> None:
    atlas = ATLAS.read_text(encoding="utf-8")
    zones = load_zones()
    listed = parse_listed(atlas)
    equity = parse_equity(atlas)
    seeds = parse_seeds(atlas)
    overlays = load_overlays()

    # Persist overlays for next runs
    if overlays and not OVERLAYS.exists():
        OVERLAYS.write_text(
            json.dumps({"note": "手填 KPI 覆盖层；build 脚本合并进全量名册", "players": overlays}, ensure_ascii=False, indent=2)
            + "\n",
            encoding="utf-8",
        )

    overlay_by_group: dict[str, dict] = {}
    for o in overlays:
        for g in o.get("groupKeys") or []:
            overlay_by_group[g] = o

    used_ids: set[str] = set()
    players: list[dict] = []
    seen_groups: set[str] = set()

    for region, line, group in seeds:
        if group in seen_groups:
            continue
        seen_groups.add(group)
        suf = brand_suffix(group)
        countries = countries_for(suf, region)
        lang_zones = []
        for c in countries:
            z = zones.get(c)
            if z and z not in lang_zones:
                lang_zones.append(z)
        ticker = listed.get(group) or ticker_from_equity(equity.get(group, ""))
        if ticker in ("未上市/私募",):
            exchange = "私募"
        else:
            exchange = ""
        origin = infer_origin(group, line)
        ov = overlay_by_group.get(group)
        # fuzzy: parent brand overlay — if group contains overlay nameZh
        if not ov:
            for o in overlays:
                keys = o.get("groupKeys") or []
                if any(k in group or group in k for k in keys):
                    ov = o
                    break
                nz = o.get("nameZh") or ""
                if nz and nz.split()[0] in group:
                    # weak — only if ticker shared
                    if o.get("ticker") and ticker and o["ticker"].split("/")[0] in ticker:
                        ov = o
                        break

        row = {
            "id": (ov or {}).get("id") or slug_id(group, used_ids),
            "groupKeys": [group],
            "nameZh": (ov or {}).get("nameZh") or name_zh(group),
            "ticker": (ov or {}).get("ticker") or ticker or "",
            "exchange": (ov or {}).get("exchange") or exchange or "",
            "region": (ov or {}).get("region") or region,
            "countries": (ov or {}).get("countries") or countries,
            "langZones": (ov or {}).get("langZones") or lang_zones,
            "origin": (ov or {}).get("origin") or origin,
            "line": line,
            "relevance": (ov or {}).get("relevance") or f"{REGION_LABEL.get(region, region)} · {line}",
            "irUrl": (ov or {}).get("irUrl") or "",
            "period": (ov or {}).get("period") or "",
            "periodEnd": (ov or {}).get("periodEnd") or "",
            "reportedAt": (ov or {}).get("reportedAt") or "",
            "confidence": (ov or {}).get("confidence") or "",
            "sourceNote": (ov or {}).get("sourceNote") or "",
            "kpis": (ov or {}).get("kpis") or [],
            "cashLoanHint": (ov or {}).get("cashLoanHint") or "",
            "status": "filled" if ov and ov.get("kpis") else "pending",
        }
        # ensure unique id
        if not ov:
            pass
        else:
            used_ids.add(row["id"])
        players.append(row)

    # Ensure every overlay exists even if group not in seeds
    for o in overlays:
        if any(g in seen_groups for g in (o.get("groupKeys") or [])):
            # merge groupKeys onto matching rows
            for p in players:
                if p["groupKeys"][0] in (o.get("groupKeys") or []) or any(
                    k in p["groupKeys"][0] or p["groupKeys"][0] in k for k in (o.get("groupKeys") or [])
                ):
                    if p["status"] != "filled":
                        for field in (
                            "kpis",
                            "period",
                            "periodEnd",
                            "reportedAt",
                            "confidence",
                            "sourceNote",
                            "irUrl",
                            "cashLoanHint",
                            "ticker",
                            "exchange",
                            "origin",
                            "relevance",
                        ):
                            if o.get(field):
                                p[field] = o[field]
                        p["status"] = "filled"
                        p["groupKeys"] = sorted(set(p["groupKeys"] + (o.get("groupKeys") or [])))
            continue
        # add overlay as its own row
        oid = o.get("id") or slug_id(o.get("nameZh") or "overlay", used_ids)
        used_ids.add(oid)
        players.append({**o, "id": oid, "line": o.get("line") or "cash", "status": "filled"})

    # Sort: region order then name
    region_order = list(REGION_LABEL.keys())
    players.sort(key=lambda p: (region_order.index(p["region"]) if p["region"] in region_order else 99, p["nameZh"]))

    filled = sum(1 for p in players if p["status"] == "filled" and p.get("kpis"))
    by_region = Counter(p["region"] for p in players)
    by_origin = Counter(p.get("origin") or "?" for p in players)
    by_line = Counter(p.get("line") or "?" for p in players)

    payload = {
        "asOf": "2026-08-10",
        "note": "T2 全量名册：自 Atlas 信贷种子按洲际×产品线生成；手填 KPI 见 overlays。出身路径=credit-native|payment|ecommerce|ride-food|digibank|bnpl。",
        "origins": {
            "credit-native": "信贷原生",
            "payment": "支付跨界",
            "ecommerce": "电商跨界",
            "ride-food": "出行/外卖",
            "digibank": "数字银行",
            "bnpl": "BNPL/分期",
        },
        "stats": {
            "filled": filled,
            "pending": len(players) - filled,
            "total": len(players),
            "byRegion": dict(by_region),
            "byOrigin": dict(by_origin),
            "byLine": dict(by_line),
        },
        "players": players,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT)
    print("total", len(players), "filled", filled)
    print("byRegion", dict(by_region))
    print("byOrigin", dict(by_origin))


if __name__ == "__main__":
    main()
