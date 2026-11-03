#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""試探：新苗優惠促銷列表 → data/promo/news/0102.json（唔下載空／壞圖）。"""
from __future__ import annotations
import json, re, ssl, sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "promo" / "news"
LIST = "http://www.sanmiu.com/news.asp?sortid=25&sortpath=0,25"
UA = "MacauPriceStationPromoNewsProbe/0.1"
MACAU = timezone(timedelta(hours=8))

def now_iso() -> str:
    return datetime.now(MACAU).strftime("%Y-%m-%dT%H:%M:%S+08:00")

def get(url: str) -> bytes:
    ctx = ssl.create_default_context()
    req = Request(url, headers={"User-Agent": UA})
    with urlopen(req, timeout=40, context=ctx) as r:
        return r.read()

def decode(b: bytes) -> str:
    for enc in ("gbk", "utf-8", "gb2312"):
        try:
            return b.decode(enc)
        except Exception:
            pass
    return b.decode("utf-8", "replace")

def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    html = decode(get(LIST))
    items = []
    for m in re.finditer(r'newsview\.asp\?([^"\']+)', html, re.I):
        qs = m.group(1)
        id_m = re.search(r'ID=(\d+)', qs, re.I)
        nid = id_m.group(1) if id_m else qs
        # title/date near match is fragile; keep minimal
        items.append({
            "id": nid,
            "title": "",
            "publishedAt": "",
            "url": "http://www.sanmiu.com/newsview.asp?" + qs,
            "imageUrl": None,
            "imageStatus": "skipped",
            "localImage": None,
            "notes": ["列表解析；詳情／圖請人工或進階腳本補"],
        })
    # dedupe by id
    seen = set()
    uniq = []
    for it in items:
        if it["id"] in seen:
            continue
        seen.add(it["id"])
        uniq.append(it)
    payload = {
        "scode": "0102",
        "name_cn": "新苗",
        "status": "ok" if uniq else "empty",
        "sourceUrl": LIST,
        "mirroredAt": now_iso(),
        "items": uniq,
        "notes": ["自動列表；圖檔探測請見 docs/promo-news-probe.md"],
    }
    path = OUT / "0102.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", path, "items", len(uniq))
    return 0

if __name__ == "__main__":
    sys.exit(main())
