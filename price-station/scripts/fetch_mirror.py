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
  python3 scripts/fetch_mirror.py --full --sleep 0.6
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import traceback
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
BASE = "https://consumer-api03.dsedt.gov.mo"
UA = "MacauPriceStationMirror/1.0 (+non-commercial; source=Consumer-Council-Macao)"
MACAU = timezone(timedelta(hours=8))
FAIL_LOG: List[str] = []


def now_iso() -> str:
    return datetime.now(MACAU).strftime("%Y-%m-%dT%H:%M:%S+08:00")


def log_fail(msg: str) -> None:
    FAIL_LOG.append(msg)
    print(f"FAIL: {msg}", file=sys.stderr)


def http_get(url: str, timeout: int = 90) -> bytes:
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


def extract_next_data(html: str) -> Optional[Dict[str, Any]]:
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def extract_build_id(html: str) -> Optional[str]:
    nd = extract_next_data(html)
    return nd.get("buildId") if nd else None


def page_props_from_html(html: str) -> Dict[str, Any]:
    nd = extract_next_data(html)
    if not nd:
        raise RuntimeError("無法解析 __NEXT_DATA__")
    return nd.get("props", {}).get("pageProps") or {}


def fetch_search(q: str, merge_index: bool = True) -> Dict[str, Any]:
    qs = urlencode({"q": q, "lang": "cn"})
    url = f"{BASE}/app/supermarket/api/sm/items/search_name?{qs}"
    data = http_get_json(url)
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


def fetch_item(item_id: str, sleep_after: float = 0) -> Dict[str, Any]:
    item_id = str(item_id)
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
        page_props = page_props_from_html(html)

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
    if sleep_after > 0:
        time.sleep(sleep_after)
    return out


def normalize_sm_item(raw: Dict[str, Any], category_oid: str = "", category_name: str = "") -> Dict[str, Any]:
    """統一超市貨品欄位，方便 search_index。支援 itemlist rows[{item, min_price,...}]。"""
    src = raw.get("item") if isinstance(raw.get("item"), dict) else raw
    iid = src.get("_id") or src.get("id") or src.get("itemId") or src.get("item_oid") or src.get("oid")
    return {
        "_id": iid,
        "code": src.get("code") or src.get("barcode") or "",
        "name_cn": src.get("name_cn") or src.get("name_zh") or src.get("name") or src.get("itemName") or "",
        "name_zh": src.get("name_zh") or src.get("name_cn") or src.get("name") or "",
        "name_en": src.get("name_en") or "",
        "name_pt": src.get("name_pt") or "",
        "quantity_cn": src.get("quantity_cn") or src.get("quantity_zh") or src.get("quantity") or "",
        "quantity_zh": src.get("quantity_zh") or src.get("quantity_cn") or "",
        "quantity_en": src.get("quantity_en") or "",
        "quantity_pt": src.get("quantity_pt") or "",
        "categoryOid": category_oid or src.get("categoryOid") or raw.get("categoryOid") or "",
        "categoryName": category_name or src.get("categoryName") or raw.get("categoryName") or "",
        "min_price": raw.get("min_price"),
        "max_price": raw.get("max_price"),
    }


def discover_sm_categories() -> List[Dict[str, Any]]:
    """從 itemlist_price_range 主頁解析 14 類。"""
    html = http_get(f"{BASE}/app/supermarket/itemlist_price_range?lang=cn").decode("utf-8", errors="replace")
    pp = page_props_from_html(html)
    candidates: List[Any] = []
    for key in ("categories", "cats", "categoryList", "itemCategories", "navCategories", "types"):
        if isinstance(pp.get(key), list) and pp[key]:
            candidates = pp[key]
            print(f"categories from pageProps.{key} n={len(candidates)}")
            break
    if not candidates:
        # 掃描 list-of-dicts 含 oid/id + name
        for k, v in pp.items():
            if not isinstance(v, list) or not v or not isinstance(v[0], dict):
                continue
            keys0 = set(v[0].keys())
            if keys0 & {"oid", "id", "category", "coid"} and keys0 & {"name", "name_cn", "cname", "categoryName", "label"}:
                candidates = v
                print(f"categories heuristic pageProps.{k} n={len(v)} keys={list(v[0].keys())[:10]}")
                break
    if not candidates:
        # 常見 oid 後備（若主頁結構變）：稍後 full 會記 fail
        raise RuntimeError(f"找不到分類列表；pageProps keys={list(pp.keys())}")

    out = []
    for c in candidates:
        if not isinstance(c, dict):
            continue
        oid = c.get("oid") or c.get("id") or c.get("category") or c.get("coid") or c.get("value")
        name = (
            c.get("name_cn") or c.get("name") or c.get("cname") or c.get("categoryName")
            or c.get("label") or c.get("title") or str(oid)
        )
        if oid is None:
            continue
        out.append({"oid": str(oid), "name": str(name), "raw": c})
    return out


def fetch_category_items(oid: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """拉單一分類貨品列表。"""
    qs = urlencode({"lang": "cn", "category": oid})
    html_url = f"{BASE}/app/supermarket/itemlist_price_range?{qs}"
    html = http_get(html_url).decode("utf-8", errors="replace")
    build_id = extract_build_id(html)
    pp = None
    if build_id:
        jurl = f"{BASE}/app/supermarket/_next/data/{build_id}/itemlist_price_range.json?{qs}"
        try:
            payload = http_get_json(jurl)
            pp = payload.get("pageProps") or (payload.get("props") or {}).get("pageProps")
        except Exception as e:
            print(f"warn: category _next/data {oid}: {e}", file=sys.stderr)
    if pp is None:
        pp = page_props_from_html(html)

    items_raw: List[Any] = []
    for key in ("rows", "items", "itemList", "products", "list", "data"):
        if isinstance(pp.get(key), list) and pp.get(key):
            items_raw = pp[key]
            print(f"category {oid} items from {key} n={len(items_raw)}")
            break
    if not items_raw:
        # nested
        for k, v in pp.items():
            if isinstance(v, list) and v and isinstance(v[0], dict):
                if {"_id", "id", "itemId", "code", "oid"} & set(v[0].keys()):
                    items_raw = v
                    print(f"category {oid} items from {k} n={len(v)}")
                    break

    cat_name = ""
    for c in (pp.get("categories") or []):
        if str(c.get("oid")) == str(oid):
            cat_name = c.get("name_cn") or c.get("name") or ""
            break
    items = [normalize_sm_item(x, category_oid=str(oid), category_name=cat_name) for x in items_raw if isinstance(x, dict)]
    items = [x for x in items if x.get("_id") is not None]
    meta = {
        "oid": oid,
        "mirroredAt": now_iso(),
        "count": len(items),
        "pagePropKeys": list(pp.keys()),
        "items": items,
    }
    write_json(DATA / "catalog" / f"{oid}.json", meta)
    return items, pp


def discover_market_categories() -> List[Dict[str, Any]]:
    html = http_get(f"{BASE}/app/supermarket/market_price_main?lang=cn").decode("utf-8", errors="replace")
    pp = page_props_from_html(html)
    cats: List[Any] = []
    for key in ("categories", "cats", "tags", "marketCategories", "types", "list"):
        if isinstance(pp.get(key), list) and pp[key]:
            cats = pp[key]
            print(f"market cats from {key} n={len(cats)}")
            break
    if not cats:
        for k, v in pp.items():
            if isinstance(v, list) and v and isinstance(v[0], dict):
                if {"tag", "c", "code", "id"} & set(v[0].keys()):
                    cats = v
                    print(f"market cats heuristic {k} n={len(v)}")
                    break
    if not cats:
        # 已知 6 類後備（Oscar／總管）
        fallback = ["Beef", "Pork", "Poultry", "Fish", "Vegetables", "Fruits"]
        print(f"warn: market cats not found; fallback {fallback}", file=sys.stderr)
        return [{"tag": t, "name": t} for t in fallback]

    out = []
    for c in cats:
        if isinstance(c, str):
            out.append({"tag": c, "name": c})
            continue
        if not isinstance(c, dict):
            continue
        tag = c.get("tag") or c.get("c") or c.get("code") or c.get("id") or c.get("value")
        name = c.get("name_cn") or c.get("name") or c.get("cname") or c.get("label") or str(tag)
        ccn = c.get("ccn") or c.get("categoryName") or c.get("cname") or name
        if tag:
            out.append({"tag": str(tag), "name": str(name), "ccn": str(ccn), "raw": c})
    return out


def fetch_market_lowest(tag: str, ccn: str = "") -> List[Dict[str, Any]]:
    qs = urlencode({"lang": "cn", "c": tag, "ccn": ccn})
    html_url = f"{BASE}/app/supermarket/market_item_lowest_price?{qs}"
    html = http_get(html_url).decode("utf-8", errors="replace")
    build_id = extract_build_id(html)
    pp = None
    if build_id:
        jurl = f"{BASE}/app/supermarket/_next/data/{build_id}/market_item_lowest_price.json?{qs}"
        try:
            payload = http_get_json(jurl)
            pp = payload.get("pageProps") or (payload.get("props") or {}).get("pageProps")
        except Exception as e:
            print(f"warn: market lowest _next {tag}: {e}", file=sys.stderr)
    if pp is None:
        # 有時係 JSON API
        try:
            j = http_get_json(html_url if html_url.endswith("json") else html_url)
            if isinstance(j, dict) and ("items" in j or "props" in j):
                pp = j.get("pageProps") or (j.get("props") or {}).get("pageProps") or j
        except Exception:
            pp = page_props_from_html(html)

    items = pp.get("items") if isinstance(pp, dict) else None
    if not isinstance(items, list):
        items = []
        if isinstance(pp, dict):
            for k, v in pp.items():
                if isinstance(v, list) and v and isinstance(v[0], dict):
                    items = v
                    break
    return items if isinstance(items, list) else []


def fetch_market_detail(
    tag: str,
    tn: str,
    s: str = "",
    ccn: str = "",
    t: str = "today",
) -> Dict[str, Any]:
    qs = urlencode({"lang": "cn", "c": tag, "tn": tn, "s": s, "ccn": ccn, "t": t})
    html_url = f"{BASE}/app/supermarket/market_item_price_detail?{qs}"
    html = http_get(html_url).decode("utf-8", errors="replace")
    build_id = extract_build_id(html)
    page_props = None
    if build_id:
        jurl = f"{BASE}/app/supermarket/_next/data/{build_id}/market_item_price_detail.json?{qs}"
        try:
            payload = http_get_json(jurl)
            page_props = payload.get("pageProps") or (payload.get("props") or {}).get("pageProps")
        except Exception as e:
            print(f"warn: market detail _next {tn}: {e}", file=sys.stderr)
    if page_props is None:
        page_props = page_props_from_html(html)

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
    return detail


def slugify(text: str) -> str:
    s = re.sub(r"[^\w\u4e00-\u9fff\-]+", "_", text.strip())[:60]
    return s or "item"


def fetch_market_veg(
    tag: str = "Vegetables",
    tn: str = "菜心",
    s: str = "Couve chinesa de flor",
    ccn: str = "新鮮食用蔬菜類",
) -> Dict[str, Any]:
    detail = fetch_market_detail(tag, tn, s, ccn)
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


def run_full(sleep: float) -> None:
    t0 = time.time()
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / "catalog").mkdir(parents=True, exist_ok=True)
    (DATA / "items").mkdir(parents=True, exist_ok=True)
    (DATA / "market").mkdir(parents=True, exist_ok=True)
    (DATA / "logs").mkdir(parents=True, exist_ok=True)

    # --- supermarket categories ---
    try:
        cats = discover_sm_categories()
    except Exception as e:
        log_fail(f"discover_sm_categories: {e}")
        cats = []
    write_json(DATA / "catalog" / "_categories.json", {"mirroredAt": now_iso(), "categories": [
        {"oid": c["oid"], "name": c["name"]} for c in cats
    ]})

    by_id: Dict[str, Dict[str, Any]] = {}
    for i, c in enumerate(cats):
        oid = c["oid"]
        print(f"[{i+1}/{len(cats)}] category {oid} {c['name']} …")
        try:
            items, _ = fetch_category_items(oid)
            for it in items:
                by_id[str(it["_id"])] = it
            time.sleep(sleep)
        except Exception as e:
            log_fail(f"category {oid}: {e}")
            traceback.print_exc()
            time.sleep(sleep)

    all_items = list(by_id.values())
    idx = {
        "mirroredAt": now_iso(),
        "source": "full itemlist_price_range categories",
        "querySeed": "*",
        "coverage": "full",
        "categoryCount": len(cats),
        "items": all_items,
    }
    write_json(DATA / "search_index.json", idx)
    print(f"search_index unique items: {len(all_items)}")

    # --- per-item store prices ---
    ok_items = 0
    for i, it in enumerate(all_items):
        iid = str(it.get("_id"))
        print(f"[{i+1}/{len(all_items)}] item {iid} {it.get('name_cn','')} …")
        try:
            fetch_item(iid, sleep_after=0)
            ok_items += 1
        except Exception as e:
            log_fail(f"item {iid}: {e}")
        time.sleep(sleep)

    # --- wet market ---
    try:
        mcats = discover_market_categories()
    except Exception as e:
        log_fail(f"discover_market_categories: {e}")
        mcats = []
    write_json(DATA / "market" / "_categories.json", {"mirroredAt": now_iso(), "categories": mcats})

    market_catalog_items: List[Dict[str, Any]] = []
    ok_market = 0
    for ci, mc in enumerate(mcats):
        tag = mc.get("tag") or ""
        ccn = mc.get("ccn") or mc.get("name") or ""
        print(f"[market cat {ci+1}/{len(mcats)}] {tag} {ccn} …")
        try:
            lowest = fetch_market_lowest(tag, ccn)
            # categoryName from lowest page if available
            if lowest and isinstance(lowest, list):
                pass
            time.sleep(sleep)
        except Exception as e:
            log_fail(f"market_lowest {tag}: {e}")
            lowest = []
            time.sleep(sleep)

        # persist category item list
        write_json(DATA / "market" / f"lowest_{slugify(tag)}.json", {
            "tag": tag,
            "ccn": ccn,
            "mirroredAt": now_iso(),
            "items": lowest,
        })

        for mi, raw in enumerate(lowest):
            if not isinstance(raw, dict):
                continue
            tn = raw.get("itemName") or raw.get("name_cn") or raw.get("name") or raw.get("tn") or ""
            s = raw.get("namePt") or raw.get("name_pt") or raw.get("s") or ""
            item_ccn = raw.get("categoryName") or raw.get("ccn") or ccn or ""
            if not tn:
                continue
            detail_name = f"detail_{slugify(tag)}_{slugify(tn)}.json"
            print(f"  market item {mi+1}/{len(lowest)} {tn}")
            try:
                detail = fetch_market_detail(tag, tn, s, item_ccn)
                write_json(DATA / "market" / detail_name, detail)
                market_catalog_items.append({
                    "id": f"{slugify(tag)}-{slugify(tn)}",
                    "itemName": detail.get("itemName") or tn,
                    "categoryName": detail.get("categoryName") or item_ccn,
                    "tag": tag,
                    "namePt": detail.get("namePt") or s,
                    "detailFile": detail_name,
                    "todayUpdated": detail.get("todayUpdated"),
                })
                ok_market += 1
            except Exception as e:
                log_fail(f"market detail {tag}/{tn}: {e}")
            time.sleep(sleep)

    # keep legacy alias if 菜心 present
    for ent in market_catalog_items:
        if "菜心" in (ent.get("itemName") or ""):
            src = DATA / "market" / ent["detailFile"]
            if src.exists():
                write_json(DATA / "market" / "detail_veg.json", json.loads(src.read_text(encoding="utf-8")))
            break

    catalog = {
        "mirroredAt": now_iso(),
        "coverage": "full",
        "items": market_catalog_items,
    }
    write_json(DATA / "market" / "catalog.json", catalog)

    elapsed = time.time() - t0
    fail_path = DATA / "logs" / f"full_failures_{datetime.now(MACAU).strftime('%Y%m%d_%H%M%S')}.txt"
    fail_path.write_text("\n".join(FAIL_LOG) + ("\n" if FAIL_LOG else ""), encoding="utf-8")
    print(f"wrote {fail_path.relative_to(ROOT)}")

    update_meta(
        coverageMode="full",
        supermarketCategories=len(cats),
        supermarketItems=len(all_items),
        supermarketItemsOk=ok_items,
        marketCategories=len(mcats),
        marketItems=len(market_catalog_items),
        marketItemsOk=ok_market,
        elapsedSec=round(elapsed, 1),
        failures=len(FAIL_LOG),
        search=f"full 索引 {len(all_items)} 品",
        market=f"full {len(market_catalog_items)} 品",
    )

    summary = {
        "mirroredAt": now_iso(),
        "elapsedSec": round(elapsed, 1),
        "supermarketCategories": len(cats),
        "supermarketItems": len(all_items),
        "supermarketItemsOk": ok_items,
        "marketCategories": len(mcats),
        "marketItems": len(market_catalog_items),
        "marketItemsOk": ok_market,
        "failures": FAIL_LOG,
    }
    write_json(DATA / "logs" / "full_summary.json", summary)
    print(json.dumps({k: v for k, v in summary.items() if k != "failures"}, ensure_ascii=False, indent=2))
    print(f"failures: {len(FAIL_LOG)}")
    print("full done.")


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
    ap.add_argument("--full", action="store_true", help="完整鏡像：14 類超市＋街市 6 類")
    ap.add_argument("--sleep", type=float, default=0.8, help="連拉多品時間隔秒數（--full 建議 ≥0.6）")
    args = ap.parse_args()

    if not any([args.search, args.item, args.market_veg, args.all_search_items, args.full]):
        ap.print_help()
        print("\n至少指定 --search / --item / --market-veg / --full 之一。", file=sys.stderr)
        sys.exit(2)

    DATA.mkdir(parents=True, exist_ok=True)

    if args.full:
        if args.sleep < 0.6:
            print("warn: --full 建議 --sleep ≥ 0.6，已提升至 0.6", file=sys.stderr)
            args.sleep = 0.6
        run_full(args.sleep)
        return

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
                log_fail(f"item {iid}: {e}")
            time.sleep(args.sleep)

    if args.market_veg:
        fetch_market_veg()

    print("done.")


if __name__ == "__main__":
    main()
