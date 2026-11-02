#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""澳門物價站｜官方 API → data/ 鏡像

只宜喺 ADM-3（或其他對 consumer-api03 可 HTTP 200 嘅機）執行。
Box／多數雲端 egress 常被 Tengine WAF 回 405；GitHub Pages 瀏覽器亦無 CORS。

依賴：Python 3.9+ 標準庫（urllib）；可選 requests（若已安裝則優先）。

用法例子：
  python3 scripts/fetch_mirror.py --search 牛奶
  python3 scripts/fetch_mirror.py --item 115
  python3 scripts/fetch_mirror.py --market-veg
  python3 scripts/fetch_mirror.py --search 牛奶 --item 115 --market-veg --all-search-items
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
BASE = "https://consumer-api03.dsedt.gov.mo"
UA = "MacauPriceStationMirror/1.0 (+non-commercial; attribution: 消費者委員會)"
MACAU = timezone(timedelta(hours=8))


def now_iso() -> str:
    return datetime.now(MACAU).strftime("%Y-%m-%dT%H:%M:%S+08:00")


def http_get(url: str, timeout: int = 60) -> bytes:
    try:
        import requests  # type: ignore

        r = requests.get(url, headers={"User-Agent": UA, "Accept": "*/*"}, timeout=timeout)
        if r.status_code == 405:
            raise SystemExit(
                f"HTTP 405 from {url}\n此機 IP 可能被 WAF 擋。請改喺 ADM-3 跑。"
            )
        r.raise_for_status()
        return r.content
    except ImportError:
        pass
    req = Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except HTTPError as e:
        if e.code == 405:
            raise SystemExit(
                f"HTTP 405 from {url}\n此機 IP 可能被 WAF 擋。請改喺 ADM-3 跑。"
            ) from e
        raise
    except URLError as e:
        raise SystemExit(f"網路錯誤：{e}") from e


def http_get_json(url: str) -> Any:
    raw = http_get(url)
    return json.loads(raw.decode("utf-8"))


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {path.relative_to(ROOT)}")


def update_meta(**coverage_bits: Any) -> None:
    meta_path = DATA / "meta.json"
    meta: Dict[str, Any] = {}
    if meta_path.exists():
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    meta["mirroredAt"] = now_iso()
    meta["timezone"] = "Asia/Macau"
    meta.setdefault(
        "sourceNote",
        "資料來源：消費者委員會（澳門物價情報站鏡像）。本站非官方網站。",
    )
    cov = meta.setdefault("coverage", {})
    for k, v in coverage_bits.items():
        if v is not None:
            cov[k] = v
    write_json(meta_path, meta)


def fetch_search(q: str, merge_index: bool = True) -> Dict[str, Any]:
    qs = urlencode({"q": q, "lang": "cn"})
    url = f"{BASE}/app/supermarket/api/sm/items/search_name?{qs}"
    data = http_get_json(url)
    out = {
        "mirroredAt": now_iso(),
        "source": f"search_name q={q} lang=cn",
        "query": q,
        "raw": data,
    }
    # filename-safe
    safe = re.sub(r"[^\w\u4e00-\u9fff\-]+", "_", q)[:80] or "query"
    write_json(DATA / "search" / f"{safe}.json", data)

    items = data.get("data") or []
    if merge_index:
        idx_path = DATA / "search_index.json"
        if idx_path.exists():
            idx = json.loads(idx_path.read_text(encoding="utf-8"))
        else:
            idx = {"items": []}
        by_id = {str(x.get("_id")): x for x in (idx.get("items") or [])}
        for it in items:
            by_id[str(it.get("_id"))] = it
        merged = list(by_id.values())
        idx = {
            "mirroredAt": now_iso(),
            "source": f"merged search; last q={q}",
            "querySeed": q,
            "items": merged,
        }
        write_json(idx_path, idx)
        update_meta(search=f"索引 {len(merged)} 品（最近搜尋：{q}）")
    return data


def extract_build_id(html: str) -> Optional[str]:
    # __NEXT_DATA__ buildId
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        return None
    try:
        nd = json.loads(m.group(1))
        return nd.get("buildId")
    except json.JSONDecodeError:
        return None


def fetch_item(item_id: str) -> Dict[str, Any]:
    item_id = str(item_id)
    # Prefer HTML → parse buildId → _next/data JSON; fallback to pageProps in HTML
    html_url = f"{BASE}/app/supermarket/supermarketlist_pricerange?item={quote(item_id)}&lang=cn"
    html = http_get(html_url).decode("utf-8", errors="replace")
    build_id = extract_build_id(html)
    page_props = None
    if build_id:
        jurl = (
            f"{BASE}/app/supermarket/_next/data/{build_id}/supermarketlist_pricerange.json"
            f"?item={quote(item_id)}&lang=cn"
        )
        try:
            payload = http_get_json(jurl)
            page_props = (payload.get("pageProps")
                          or (payload.get("props") or {}).get("pageProps"))
            if not page_props and "item" in payload:
                page_props = payload
        except Exception as e:
            print(f"warn: _next/data failed ({e}); fallback __NEXT_DATA__", file=sys.stderr)
    if page_props is None:
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
        if not m:
            raise SystemExit("無法解析超市價頁 __NEXT_DATA__")
        nd = json.loads(m.group(1))
        page_props = nd.get("props", {}).get("pageProps") or {}

    out = {
        "item": page_props.get("item"),
        "groups": page_props.get("groups") or [],
        "regions": page_props.get("regions") or [],
        "updateDate": page_props.get("updateDate"),
        "itemId": page_props.get("itemId") or item_id,
        "mirroredAt": now_iso(),
        "source": f"supermarketlist_pricerange item={item_id}",
        "buildId": build_id,
    }
    write_json(DATA / "items" / f"{item_id}.json", out)
    # track coverage
    existing = []
    meta_path = DATA / "meta.json"
    if meta_path.exists():
        existing = (json.loads(meta_path.read_text(encoding="utf-8"))
                    .get("coverage", {}).get("items") or [])
    ids = sorted(set([str(x) for x in existing] + [item_id]), key=lambda x: int(x) if x.isdigit() else x)
    update_meta(items=ids)
    return out


def fetch_market_veg(
    tag: str = "Vegetables",
    tn: str = "菜心",
    s: str = "Couve chinesa de flor",
    ccn: str = "新鮮食用蔬菜類",
) -> Dict[str, Any]:
    """優先 HTML／_next；亦可用同參數嘅頁面。"""
    qs = urlencode(
        {"lang": "cn", "c": tag, "tn": tn, "s": s, "ccn": ccn, "t": "today"}
    )
    html_url = f"{BASE}/app/supermarket/market_item_price_detail?{qs}"
    html = http_get(html_url).decode("utf-8", errors="replace")
    build_id = extract_build_id(html)
    page_props = None
    if build_id:
        jurl = (
            f"{BASE}/app/supermarket/_next/data/{build_id}/market_item_price_detail.json?{qs}"
        )
        try:
            payload = http_get_json(jurl)
            page_props = payload.get("pageProps") or (payload.get("props") or {}).get("pageProps")
        except Exception as e:
            print(f"warn: market _next/data failed ({e})", file=sys.stderr)
    if page_props is None:
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
        if not m:
            raise SystemExit("無法解析街市價頁")
        nd = json.loads(m.group(1))
        page_props = nd.get("props", {}).get("pageProps") or {}

    detail = {
        "tag": page_props.get("tag") or tag,
        "categoryName": page_props.get("categoryName") or ccn,
        "itemName": page_props.get("itemName") or tn,
        "namePt": page_props.get("namePt") or s,
        "markets": page_props.get("markets") or [],
        "todayUpdated": page_props.get("todayUpdated"),
        "weekUpdated": page_props.get("weekUpdated"),
        "mirroredAt": now_iso(),
        "source": f"market_item_price_detail {tn}",
    }
    write_json(DATA / "market" / "detail_veg.json", detail)
    catalog = {
        "mirroredAt": now_iso(),
        "items": [
            {
                "id": "veg-choisum",
                "itemName": detail["itemName"],
                "categoryName": detail["categoryName"],
                "tag": detail["tag"],
                "namePt": detail["namePt"],
                "detailFile": "detail_veg.json",
                "todayUpdated": detail.get("todayUpdated"),
            }
        ],
    }
    write_json(DATA / "market" / "catalog.json", catalog)
    update_meta(market=[f"{detail['itemName']}／detail_veg.json"])
    return detail


def main() -> None:
    ap = argparse.ArgumentParser(description="澳門物價站 ADM-3 鏡像拉數")
    ap.add_argument("--search", metavar="Q", help="search_name 關鍵字（如 牛奶）")
    ap.add_argument("--item", metavar="ID", help="超市貨品 _id（如 115）")
    ap.add_argument(
        "--all-search-items",
        action="store_true",
        help="對目前 search_index.json 內每品拉分店價（慎用、較慢）",
    )
    ap.add_argument("--market-veg", action="store_true", help="拉菜心分街市價樣本")
    ap.add_argument("--sleep", type=float, default=0.8, help="連拉多品時間隔秒數")
    args = ap.parse_args()

    if not any([args.search, args.item, args.market_veg, args.all_search_items]):
        ap.print_help()
        print("\n至少指定 --search / --item / --market-veg 之一。", file=sys.stderr)
        sys.exit(2)

    DATA.mkdir(parents=True, exist_ok=True)

    if args.search:
        fetch_search(args.search)

    if args.item:
        fetch_item(args.item)

    if args.all_search_items:
        idx_path = DATA / "search_index.json"
        if not idx_path.exists():
            raise SystemExit("未有 data/search_index.json，請先 --search")
        idx = json.loads(idx_path.read_text(encoding="utf-8"))
        for it in idx.get("items") or []:
            iid = it.get("_id")
            if iid is None:
                continue
            print(f"fetch item {iid} …")
            try:
                fetch_item(str(iid))
            except Exception as e:
                print(f"fail item {iid}: {e}", file=sys.stderr)
            time.sleep(args.sleep)

    if args.market_veg:
        fetch_market_veg()

    print("done.")


if __name__ == "__main__":
    main()
