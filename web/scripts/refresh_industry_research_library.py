#!/usr/bin/env python3
"""行业研究报告库 · 定期检索/入库脚手架。

用法:
  # 查看队列与最新报告摘要
  python3 refresh_industry_research_library.py status

  # 从已落盘 PDF 文本再抽取校验（不改 JSON，只打印 diff 提示）
  python3 refresh_industry_research_library.py check-pdf

约定:
  - 新研报先复制到 web/src/data/reports/，再人工/半自动写入 industry-research-library.json
  - 玩家命中用 groupKeys 挂 CRM；流量口径置信默认「中」
  - 勿用下载量/MAU 覆盖信贷主尺（发放/AUM/不良）
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
LIB = DATA / "industry-research-library.json"
REPORTS = DATA / "reports"


def load() -> dict:
    return json.loads(LIB.read_text(encoding="utf-8"))


def cmd_status() -> int:
    lib = load()
    ref = lib.get("refresh") or {}
    q = ref.get("queue") or {}
    print(f"asOf={lib.get('asOf')} nextDue={ref.get('nextDue')} cadence={ref.get('cadence')}")
    print(f"reports={len(lib.get('reports') or [])} pending={q.get('pending')} done={q.get('done')}")
    for r in lib.get("reports") or []:
        n = len(r.get("playerUpdates") or [])
        print(f"  - {r.get('id')}: {r.get('title')} · players={n} · {r.get('confidence')}")
        v = (r.get("analysis") or {}).get("verdict")
        if v:
            print(f"    verdict: {v[:120]}…")
    print(f"pdf_dir={REPORTS} exists={REPORTS.is_dir()}")
    if REPORTS.is_dir():
        for p in sorted(REPORTS.glob("*.pdf")):
            print(f"  pdf: {p.name} ({p.stat().st_size} bytes)")
    return 0


def cmd_check_pdf() -> int:
    pdf = REPORTS / "2026-h1-overseas-cashloan-diandian.pdf"
    if not pdf.exists():
        print("missing pdf:", pdf)
        return 1
    try:
        import fitz  # type: ignore
    except ImportError:
        print("pymupdf (fitz) not installed; skip text check")
        return 0
    doc = fitz.open(pdf)
    text = "\n".join(page.get_text("text") for page in doc)
    needles = [
        "DiDi Finanzas",
        "Kredivo",
        "JazzCash",
        "FairMoney",
        "8856",
        "US$2.318B",
        "Rp103.73T",
    ]
    print(f"pages={len(doc)} chars={len(text)}")
    for n in needles:
        print(f"  [{'OK' if n in text else 'MISS'}] {n}")
    return 0


def main(argv: list[str]) -> int:
    cmd = (argv[1] if len(argv) > 1 else "status").strip()
    if cmd == "status":
        return cmd_status()
    if cmd in {"check-pdf", "check"}:
        return cmd_check_pdf()
    print(__doc__)
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
