#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""澳門物價站｜官方 API → data/ 鏡像

主拉機：LAPTOP-7JUE4FNQ（Windows；machineId a31b43c0-6d8a-4d2b-ba15-1a8897dfa708）。
亦可喺其他對 consumer-api03 可 HTTP 200 嘅機執行（舊 ADM-3 已退役）。
Box／多數雲端 egress 常被 Tengine WAF 回 405；GitHub Pages 瀏覽器亦無 CORS。

依賴：Python 3.9+ 標準庫（urllib）；可選 requests（若已安裝則優先）。

用法例子：
  python scripts/fetch_mirror.py --search 牛奶
  python scripts/fetch_mirror.py --item 115
  python scripts/fetch_mirror.py --market-veg
  python scripts/fetch_mirror.py --promo --sleep 0.6
  python scripts/fetch_mirror.py --special --sleep 0.6
  python scripts/fetch_mirror.py --full --sleep 0.6
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

# Windows console (cp950) 會炸罕見漢字 print；強制 stdout/stderr 用 utf-8 replace
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
BASE = "https://consumer-api03.dsedt.gov.mo"
UA = "MacauPriceStationMirror/1.0 (+non-commercial; source=Consumer-Council-Macao)"
MACAU = timezone(timedelta(hours=8))
FAIL_LOG: List[str] = []

SOURCE_NOTE = (
    "澳門特別行政區政府／消費者委員會「澳門物價情報站」公開資料（Open Data／公開 API 鏡像）；本站非官方；資料僅供參考。"
)


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
                f"HTTP 405 from {url}\n此機 IP 可能被 WAF 擋。請改喺可 200 嘅機（如 LAPTOP-7JUE4FNQ）跑。"
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
                f"HTTP 405 from {url}\n此機 IP 可能被 WAF 擋。請改喺可 200 嘅機（如 LAPTOP-7JUE4FNQ）跑。"
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
    meta.setdefault("sourceNote", SOURCE_NOTE)
    meta["sourceNote"] = SOURCE_NOTE  # keep aligned with current Open Data wording
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


DEFAULT_GOOD_TYPES = [
    {"code": "C001", "name": "糧油調味", "image": "c001.png"},
    {"code": "C002", "name": "食品速食", "image": "c002.png"},
    {"code": "C003", "name": "飲品乳類", "image": "c003.png"},
    {"code": "C004", "name": "餅乾零食", "image": "c004.png"},
    {"code": "C005", "name": "個人護理", "image": "c005.png"},
    {"code": "C006", "name": "日常用品", "image": "c006.png"},
    {"code": "C007", "name": "其他", "image": "c007.png"},
]

DS_IMG_BASE = f"{BASE}/app/supermarket/images"


def _cond_url(path: str, cond: Dict[str, Any]) -> str:
    cond_json = json.dumps(cond, ensure_ascii=False, separators=(",", ":"))
    return f"{BASE}{path}?cond={quote(cond_json)}"


def _as_list(payload: Any) -> List[Any]:
    if payload is None:
        return []
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for k in ("data", "list", "items", "rows", "result", "goodtypes", "goodTypes"):
            v = payload.get(k)
            if isinstance(v, list):
                return v
            if isinstance(v, dict):
                for kk in ("data", "list", "items"):
                    if isinstance(v.get(kk), list):
                        return v[kk]
    return []


def parse_ds_good_types(pp: Dict[str, Any]) -> List[Dict[str, Any]]:
    raw = None
    for key in ("ds_good_types", "dsGoodTypes", "good_types", "goodTypes", "goodtypes"):
        if isinstance(pp.get(key), list) and pp[key]:
            raw = pp[key]
            break
    out: List[Dict[str, Any]] = []
    if raw:
        for g in raw:
            if not isinstance(g, dict):
                continue
            code = (
                g.get("code") or g.get("gtcode") or g.get("gt_code")
                or g.get("value") or g.get("id") or ""
            )
            code = str(code).strip().upper()
            if code and not code.startswith("C") and code.isdigit():
                code = f"C{int(code):03d}"
            name = (
                g.get("name_cn") or g.get("name") or g.get("label")
                or g.get("cname") or g.get("title") or code
            )
            img = (
                g.get("value_1_cn") or g.get("image") or g.get("img")
                or g.get("icon") or ""
            )
            if isinstance(img, str) and img and not img.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                # sometimes value_1_cn is bare stem like c003
                img = img if "." in img else f"{img}.png"
            if not img and code:
                img = f"{code.lower()}.png"
            if not code:
                continue
            out.append({"code": code, "name": name, "image": img})
    if not out:
        out = [dict(x) for x in DEFAULT_GOOD_TYPES]
    # ensure C001–C007 present as fallback names
    by = {x["code"]: x for x in out}
    for d in DEFAULT_GOOD_TYPES:
        by.setdefault(d["code"], dict(d))
    return [by[c["code"]] for c in DEFAULT_GOOD_TYPES if c["code"] in by] or list(by.values())


def _looks_like_image_ref(val: Any) -> bool:
    if not val or not isinstance(val, str):
        return False
    s = val.strip()
    if not s:
        return False
    if re.search(r"\.(png|jpe?g|webp|gif|svg)(\?|$)", s, re.I):
        return True
    # bare stem used as image key (e.g. c002 / sanmiu_logo)
    if re.search(r"[\u4e00-\u9fff]", s):
        return False
    return bool(re.match(r"^[A-Za-z0-9_./-]+$", s)) and ("/" in s or "_" in s or s.lower().endswith(("logo", "img")))


def parse_ds_stores(pp: Dict[str, Any]) -> List[Dict[str, Any]]:
    """從 ds/main pageProps 抽超市組／scode／中文名（mark）／logo／syncDate。

    實際欄位：pageProps.ds_supermarket_groups[] = {code, name(英), mark(中), value_1_cn?}
    """
    candidates: List[Any] = []
    for key in (
        "ds_supermarket_groups", "dsSupermarketGroups",
        "supermarkets", "stores", "storeList", "ds_stores", "dsStores",
        "groups", "supermarket_list", "supermarketList", "sp_list", "list",
    ):
        v = pp.get(key)
        if isinstance(v, list) and v:
            candidates = v
            print(f"ds stores from pageProps.{key} n={len(v)}")
            break
    if not candidates:
        for k, v in pp.items():
            if not isinstance(v, list) or not v or not isinstance(v[0], dict):
                continue
            keys0 = set(v[0].keys())
            if keys0 & {"scode", "s_code", "storeCode", "code"} and keys0 & {
                "name", "name_cn", "sname", "storeName", "supermarket_name",
                "label", "title", "mark",
            }:
                candidates = v
                print(f"ds stores heuristic pageProps.{k} n={len(v)}")
                break

    sync_map: Dict[str, str] = {}
    sync_raw = pp.get("ds_sp_sync_date") or pp.get("dsSpSyncDate") or pp.get("sync_dates") or {}
    if isinstance(sync_raw, dict):
        for sk, sv in sync_raw.items():
            if isinstance(sv, dict):
                sync_map[str(sk)] = str(sv.get("date") or sv.get("sync_date") or sv.get("sdate") or "")
            else:
                sync_map[str(sk)] = str(sv or "")
    elif isinstance(sync_raw, list):
        for row in sync_raw:
            if not isinstance(row, dict):
                continue
            sk = row.get("scode") or row.get("code") or row.get("id")
            if sk is None:
                continue
            sync_map[str(sk)] = str(
                row.get("date") or row.get("sync_date") or row.get("sdate") or ""
            )

    # optional enrich from supermarket item mirrors (group_id → group_name_cn)
    group_cn_map: Dict[str, str] = {}
    items_dir = DATA / "items"
    if items_dir.is_dir():
        for ip in items_dir.glob("*.json"):
            try:
                payload = json.loads(ip.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            for g in payload.get("groups") or []:
                if not isinstance(g, dict):
                    continue
                gid = str(g.get("group_id") or g.get("group_code") or "")
                cn = g.get("group_name_cn") or g.get("group_name") or ""
                if gid and cn and re.search(r"[\u4e00-\u9fff]", str(cn)):
                    group_cn_map.setdefault(gid, str(cn))

    out: List[Dict[str, Any]] = []
    for s in candidates:
        if not isinstance(s, dict):
            continue
        nested = []
        if isinstance(s.get("supermarkets"), list):
            nested = s["supermarkets"]
        elif isinstance(s.get("stores"), list):
            nested = s["stores"]
        rows = nested if nested else [s]
        group_name = (
            s.get("group_name_cn") or s.get("mark") or s.get("group_name")
            or s.get("name_cn") or s.get("name") or ""
        )
        for row in rows:
            if not isinstance(row, dict):
                continue
            scode = (
                row.get("scode") or row.get("s_code") or row.get("storeCode")
                or row.get("code") or row.get("id") or row.get("sid")
            )
            if scode is None:
                continue
            scode = str(scode)
            name_en = (
                row.get("name") or row.get("sname") or row.get("storeName")
                or row.get("supermarket_name") or row.get("label")
                or row.get("title") or ""
            )
            name_cn = (
                row.get("mark") or row.get("name_cn") or row.get("name_zh")
                or row.get("group_name_cn") or group_cn_map.get(scode)
                or ""
            )
            # value_1_cn on groups is sometimes a Chinese label, not a logo path
            v1 = row.get("value_1_cn")
            if not name_cn and isinstance(v1, str) and re.search(r"[\u4e00-\u9fff]", v1):
                name_cn = v1
            if not name_cn:
                name_cn = group_name if re.search(r"[\u4e00-\u9fff]", str(group_name or "")) else ""
            display = name_cn or name_en or group_name or scode
            logo_cand = (
                row.get("logo") or row.get("image") or row.get("img")
                or row.get("icon") or ""
            )
            if not logo_cand and _looks_like_image_ref(v1):
                logo_cand = v1
            sync = (
                row.get("sync_date") or row.get("syncDate") or row.get("ds_sp_sync_date")
                or row.get("date") or sync_map.get(scode) or ""
            )
            out.append({
                "scode": scode,
                "name": name_en or display,  # keep API English when present
                "name_cn": name_cn or display,
                "name_zh": name_cn or display,
                "mark": row.get("mark") or name_cn or "",
                "logo": logo_cand or "",
                "syncDate": str(sync) if sync else "",
                "groupName": group_name or name_cn or name_en or "",
            })
    seen = {}
    for s in out:
        seen[s["scode"]] = s
    return list(seen.values())


def normalize_discount_items(payload: Any) -> List[Dict[str, Any]]:
    rows = _as_list(payload)
    items: List[Dict[str, Any]] = []
    for r in rows:
        if not isinstance(r, dict):
            continue
        name = (
            r.get("name_cn") or r.get("name") or r.get("itemName")
            or r.get("pname") or r.get("goods_name") or r.get("title") or ""
        )
        price = r.get("price") if "price" in r else r.get("original_price") or r.get("ori_price")
        discount = r.get("discount") if "discount" in r else r.get("discount_price") or r.get("promo_price")
        sync = r.get("sync_date") or r.get("syncDate") or r.get("date") or r.get("sdate") or ""
        items.append({
            "name": name,
            "price": price,
            "discount": discount,
            "sync_date": str(sync) if sync else "",
            "barcode": r.get("barcode") or r.get("code") or None,
            "raw": {k: r[k] for k in r if k not in ("raw",)},
        })
    return items


def fetch_promo(sleep: float = 0.6) -> Dict[str, Any]:
    """優惠情報站：ds/main → active_goodtype → discount_price。"""
    promo_dir = DATA / "promo"
    stores_dir = promo_dir / "stores"
    prices_dir = promo_dir / "prices"
    promo_dir.mkdir(parents=True, exist_ok=True)
    stores_dir.mkdir(parents=True, exist_ok=True)
    prices_dir.mkdir(parents=True, exist_ok=True)

    html = http_get(f"{BASE}/app/supermarket/ds/main?lang=cn").decode("utf-8", errors="replace")
    pp = page_props_from_html(html)
    good_types = parse_ds_good_types(pp)
    stores = parse_ds_stores(pp)
    if not stores:
        log_fail("promo: ds/main 找不到店列表（scode）；pageProps keys=" + ",".join(list(pp.keys())[:40]))
        stores = []

    index = {
        "mirroredAt": now_iso(),
        "stub": False,
        "source": "supermarket/ds/main + active_goodtype + discount_price",
        "stores": stores,
        "goodTypes": good_types,
        "pagePropKeys": list(pp.keys()),
    }
    write_json(promo_dir / "index.json", index)

    sync_dates: Dict[str, str] = {}
    price_files = 0
    ok_stores = 0

    for i, st in enumerate(stores):
        scode = st["scode"]
        print(f"[promo {i+1}/{len(stores)}] store {scode} {st.get('name','')} …")
        active_url = _cond_url("/app/supermarket/api/ds/active_goodtype", {"scode": scode})
        try:
            active_payload = http_get_json(active_url)
            write_json(stores_dir / f"{scode}.json", {
                "scode": scode,
                "name": st.get("name"),
                "name_cn": st.get("name_cn") or st.get("mark") or st.get("name"),
                "name_zh": st.get("name_zh") or st.get("name_cn") or st.get("name"),
                "mirroredAt": now_iso(),
                "raw": active_payload,
            })
            ok_stores += 1
        except Exception as e:
            log_fail(f"promo active_goodtype {scode}: {e}")
            active_payload = {}
            time.sleep(sleep)
            continue

        # extract active gt codes
        active_codes: List[str] = []
        for row in _as_list(active_payload):
            if isinstance(row, str):
                active_codes.append(row.strip().upper())
                continue
            if not isinstance(row, dict):
                continue
            code = row.get("gtcode") or row.get("code") or row.get("gt_code") or row.get("value") or row.get("id")
            if code is None:
                continue
            code = str(code).strip().upper()
            if code and not code.startswith("C") and code.isdigit():
                code = f"C{int(code):03d}"
            active_codes.append(code)
        # if API returns success with empty / unexpected, try all good types
        if not active_codes:
            # some payloads: data is dict of code->flag
            if isinstance(active_payload, dict) and isinstance(active_payload.get("data"), dict):
                for k, v in active_payload["data"].items():
                    if v in (1, "1", True, "Y", "y", "yes"):
                        active_codes.append(str(k).strip().upper())
            if not active_codes:
                active_codes = [g["code"] for g in good_types]
                print(f"  warn: no active gtcode for {scode}; falling back to all goodTypes", file=sys.stderr)

        # unique preserve order
        seen_c = set()
        uniq_codes = []
        for c in active_codes:
            if c and c not in seen_c:
                seen_c.add(c)
                uniq_codes.append(c)

        time.sleep(sleep)

        for gtcode in uniq_codes:
            print(f"  discount_price {scode}×{gtcode}")
            price_url = _cond_url(
                "/app/supermarket/api/ds/discount_price",
                {"scode": scode, "gtcode": gtcode},
            )
            try:
                price_payload = http_get_json(price_url)
                items = normalize_discount_items(price_payload)
                for it in items:
                    if it.get("sync_date"):
                        sync_dates[f"{scode}_{gtcode}"] = it["sync_date"]
                        break
                out = {
                    "scode": scode,
                    "gtcode": gtcode,
                    "storeName": st.get("name_cn") or st.get("name"),
                    "storeNameEn": st.get("name"),
                    "mirroredAt": now_iso(),
                    "itemCount": len(items),
                    "items": items,
                    "rawSuccess": (price_payload.get("success")
                                   if isinstance(price_payload, dict) else None),
                }
                write_json(prices_dir / f"{scode}_{gtcode}.json", out)
                price_files += 1
            except Exception as e:
                log_fail(f"promo discount_price {scode}/{gtcode}: {e}")
            time.sleep(sleep)

        if st.get("syncDate"):
            sync_dates[scode] = st["syncDate"]

    meta = {
        "mirroredAt": now_iso(),
        "stub": False,
        "storeCount": len(stores),
        "storesOk": ok_stores,
        "priceFiles": price_files,
        "syncDates": sync_dates,
        "goodTypes": good_types,
        "source": index["source"],
    }
    write_json(promo_dir / "meta.json", meta)
    update_meta(
        promo=f"{ok_stores}/{len(stores)} 店 · {price_files} 價檔",
        promoStores=len(stores),
        promoPriceFiles=price_files,
    )
    print(f"promo done: stores={len(stores)} ok={ok_stores} priceFiles={price_files}")
    return meta


def _flatten_special_name(name: Any) -> Tuple[str, Optional[Dict[str, Any]]]:
    """categories[].name 實際係物件 {name_cn, name_en, link, report, …}。"""
    if isinstance(name, dict):
        label = (
            name.get("name_cn") or name.get("name") or name.get("name_zh")
            or name.get("name_en") or ""
        )
        return str(label) if label else "", name
    if name is None:
        return "", None
    return str(name), None


def _links_from_special_blob(blob: Any) -> List[Dict[str, Any]]:
    """由 category name 物件或 get_category_pdf data 抽 PDF／nss URL。"""
    links: List[Dict[str, Any]] = []
    seen = set()
    report_base = "http://api03.consumer.gov.mo/export/sp/report/"

    def add(url: Any, typ: str, label: str = "") -> None:
        if not url or not isinstance(url, str):
            return
        u = url.strip()
        if not u or u in seen:
            return
        seen.add(u)
        if not u.startswith("http") and u.lower().endswith(".pdf"):
            u = report_base + u.lstrip("/")
        elif u.startswith("/") and not u.startswith("//"):
            u = BASE + u
        links.append({"type": typ, "url": u, "name": label or typ})

    if not isinstance(blob, dict):
        return links
    add(blob.get("link"), "link", "中文報告／頁面")
    add(blob.get("link_en"), "link_en", "English report")
    add(blob.get("link_pt"), "link_pt", "Relatório PT")
    add(blob.get("pdf"), "pdf", "PDF")
    add(blob.get("url"), "url", "連結")
    add(blob.get("nss"), "nss", "nss")
    add(blob.get("nss_link"), "nss_link", "nss")
    for key, label in (
        ("report", "中文 PDF"),
        ("report_en", "English PDF"),
        ("report_pt", "PDF PT"),
    ):
        r = blob.get(key)
        if isinstance(r, str) and r.strip():
            u = r if r.startswith("http") else report_base + r.lstrip("/")
            add(u, key, label)
    cat = blob.get("category")
    if isinstance(cat, dict):
        for lk in _links_from_special_blob(cat):
            add(lk["url"], lk.get("type") or "link", lk.get("name") or "")
    return links


def parse_special_categories(pp: Dict[str, Any]) -> List[Dict[str, Any]]:
    raw = None
    for key in ("categories", "cats", "categoryList", "specialCategories"):
        if isinstance(pp.get(key), list) and pp[key]:
            raw = pp[key]
            print(f"special categories from pageProps.{key} n={len(raw)}")
            break
    if not raw:
        raise RuntimeError(f"special/main 無 categories；pageProps keys={list(pp.keys())}")
    out: List[Dict[str, Any]] = []
    for c in raw:
        if not isinstance(c, dict):
            continue
        coid = c.get("coid") or c.get("id") or c.get("oid") or c.get("category")
        if coid is None:
            continue
        name_label, name_obj = _flatten_special_name(
            c.get("name") if c.get("name") is not None else (
                c.get("cateogry") or c.get("category") or c.get("name_cn") or c.get("cname") or c.get("title")
            )
        )
        if not name_label:
            name_label = str(coid)
        date = c.get("date") or c.get("sdate") or c.get("updateDate") or ""
        if isinstance(date, dict):
            date = date.get("date") or date.get("sdate") or ""
        image_url = (
            c.get("imageUrl") or c.get("image") or c.get("img")
            or f"{BASE}/app/special/images/cat/{coid}.png"
        )
        spe = c.get("spe_type") or c.get("speType") or c.get("type")
        if spe is None and name_obj:
            spe = name_obj.get("spe_type")
        links = _links_from_special_blob(name_obj) if name_obj else []
        row = {
            "id": coid,
            "coid": coid,
            "name": name_label,
            "name_cn": name_label,
            "name_zh": name_label,
            "name_en": (name_obj or {}).get("name_en") if name_obj else "",
            "date": str(date) if date else "",
            "spe_type": spe,
            "imageUrl": image_url,
            "links": links,
        }
        if name_obj:
            row["nameObj"] = name_obj
        out.append(row)
    return out


def _nss_url_from_links(links: List[Dict[str, Any]]) -> Optional[str]:
    for lk in links or []:
        u = (lk or {}).get("url") or ""
        if not isinstance(u, str):
            continue
        if "/app/nss/" in u:
            # ensure lang=cn
            if "lang=" not in u:
                u = u + ("&" if "?" in u else "?") + "lang=cn"
            elif "lang=" in u and "lang=cn" not in u and re.search(r"lang=(?:&|$)", u):
                u = u.replace("lang=", "lang=cn")
            return u
    return None


def _region_label(entity: Dict[str, Any], freg_map: Dict[str, str]) -> str:
    tags = entity.get("tag_groups") or []
    for t in tags:
        if isinstance(t, str) and t in freg_map:
            return freg_map[t]
    for t in tags:
        if isinstance(t, str) and t.startswith("freg_"):
            return t
    return ""


def _normalize_price_rows(
    item: Dict[str, Any],
    rows: List[Dict[str, Any]],
    freg_map: Dict[str, str],
) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    item_oid = item.get("oid")
    item_name = item.get("name_cn") or item.get("name") or ""
    qty = item.get("quantity_cn") or item.get("quantity") or ""
    for r in rows or []:
        if not isinstance(r, dict):
            continue
        ent = r.get("entity") if isinstance(r.get("entity"), dict) else {}
        price = r.get("price")
        out.append({
            "itemOid": item_oid,
            "itemName": item_name,
            "quantity": qty,
            "price": str(price) if price is not None else "",
            "flag": r.get("flag") or "",
            "storeOid": ent.get("oid") or r.get("sid") or r.get("osid"),
            "storeName": ent.get("name_cn") or ent.get("name") or "",
            "address": ent.get("address_cn") or ent.get("address") or "",
            "region": _region_label(ent, freg_map),
            "phone": ent.get("phone") or "",
        })
    return out


def fetch_nss_price_table(
    nss_url: str,
    sleep: float = 0.6,
) -> Dict[str, Any]:
    """從 nss 頁 pageProps + /app/nss/api/ss/price_by_item 組表格式價。

    Schema（回傳 dict）：
      mode: \"table\"
      nss: {url, page, ss_cat, did, sdate}
      items: [{oid, name_cn, quantity_cn, minPrice, priceCount}]
      prices: [{itemOid, itemName, quantity, price, storeName, address, region, flag}]
      types / regions: 原始輔助清單（可空）
    """
    html = http_get(nss_url).decode("utf-8", errors="replace")
    pp = page_props_from_html(html)
    items_raw = [x for x in (pp.get("ds_items") or []) if isinstance(x, dict)]
    types_raw = [x for x in (pp.get("ds_types") or []) if isinstance(x, dict)]
    fregs = pp.get("ds_fregs") or pp.get("ds_regions") or []
    freg_map: Dict[str, str] = {}
    for f in fregs:
        if not isinstance(f, dict):
            continue
        code = f.get("name") or (f"freg_{f.get('code')}" if f.get("code") is not None else None)
        label = f.get("desp_cn") or f.get("desp") or f.get("mark") or ""
        if code:
            freg_map[str(code)] = str(label)
            # also map freg_N from code
            if f.get("code") is not None:
                freg_map[f"freg_{f.get('code')}"] = str(label)

    sdate_obj = pp.get("sdate") if isinstance(pp.get("sdate"), dict) else None
    did = sdate_obj.get("oid") if sdate_obj else None
    sdate = ""
    if sdate_obj:
        sdate = str(sdate_obj.get("date") or "")[:10]

    ss_cat = pp.get("ss_cat_tag") or pp.get("cat") or ""
    if not ss_cat and isinstance(pp.get("ss_cat"), dict):
        ss_cat = pp["ss_cat"].get("name") or pp["ss_cat"].get("code") or ""

    page_name = "unknown"
    if "/main_typecat_cosa" in nss_url:
        page_name = "main_typecat_cosa"
    elif "/main_typecat_baby" in nss_url:
        page_name = "main_typecat_baby"
    elif "/main_typecat" in nss_url:
        page_name = "main_typecat"
    elif "/main_type" in nss_url:
        page_name = "main_type"

    prices: List[Dict[str, Any]] = []
    items_out: List[Dict[str, Any]] = []
    for it in items_raw:
        oid = it.get("oid")
        if oid is None:
            continue
        qs = {"item": str(oid)}
        if did is not None:
            qs["did"] = str(did)
        api = f"{BASE}/app/nss/api/ss/price_by_item?{urlencode(qs)}"
        try:
            payload = http_get_json(api)
            rows = payload.get("data") if isinstance(payload, dict) else None
            if not isinstance(rows, list):
                rows = []
        except Exception as e:
            log_fail(f"nss price_by_item item={oid}: {e}")
            rows = []
        norm = _normalize_price_rows(it, rows, freg_map)
        prices.extend(norm)
        nums = []
        for n in norm:
            try:
                nums.append(float(n["price"]))
            except (TypeError, ValueError):
                pass
        items_out.append({
            "oid": oid,
            "name_cn": it.get("name_cn") or it.get("name") or "",
            "name_en": it.get("name_en") or "",
            "quantity_cn": it.get("quantity_cn") or "",
            "minPrice": f"{min(nums):g}" if nums else "",
            "maxPrice": f"{max(nums):g}" if nums else "",
            "priceCount": len(norm),
        })
        time.sleep(sleep)

    # Optional brand/type low-price summary (baby / typecat)
    type_summaries: List[Dict[str, Any]] = []
    if types_raw and ss_cat:
        for t in types_raw:
            tname = t.get("name")
            if not tname:
                continue
            qs = {"cat": str(ss_cat), "type": str(tname)}
            if did is not None:
                qs["did"] = str(did)
            # baby uses low_price_by_type; chicken main_type uses price_by_type
            for endpoint in ("low_price_by_type", "price_by_type"):
                api = f"{BASE}/app/nss/api/ss/{endpoint}?{urlencode(qs)}"
                try:
                    payload = http_get_json(api)
                    data = payload.get("data") if isinstance(payload, dict) else None
                    if isinstance(data, list) and data:
                        type_summaries.append({
                            "endpoint": endpoint,
                            "type": tname,
                            "typeLabel": t.get("desp_cn") or t.get("mark") or tname,
                            "rows": data[:80],  # keep raw sample; UI mainly uses prices[]
                            "count": len(data),
                        })
                        break
                except Exception as e:
                    log_fail(f"nss {endpoint} type={tname}: {e}")
            time.sleep(max(0.2, sleep * 0.5))

    mode = "table" if prices or items_out else "none"
    return {
        "mode": mode,
        "nss": {
            "url": nss_url,
            "page": page_name,
            "ss_cat": ss_cat,
            "did": did,
            "sdate": sdate,
        },
        "items": items_out,
        "prices": prices,
        "types": [
            {
                "code": t.get("code"),
                "name": t.get("name"),
                "label": t.get("desp_cn") or t.get("mark") or "",
            }
            for t in types_raw
        ],
        "regions": [
            {
                "code": f.get("code"),
                "name": f.get("name"),
                "label": f.get("desp_cn") or f.get("desp") or f.get("mark") or "",
            }
            for f in fregs if isinstance(f, dict)
        ],
        "typeSummaries": [
            {"type": ts["type"], "typeLabel": ts["typeLabel"], "endpoint": ts["endpoint"], "count": ts["count"]}
            for ts in type_summaries
        ],
        "priceCount": len(prices),
        "itemCount": len(items_out),
    }


def _is_pdf_link(lk: Dict[str, Any]) -> bool:
    url = (lk or {}).get("url") or ""
    typ = str((lk or {}).get("type") or "")
    if not isinstance(url, str) or not url:
        return False
    if re.search(r"\.pdf($|\?)", url, re.I):
        return True
    if typ in ("pdf", "report", "report_en", "report_pt") or "report" in typ:
        return True
    return False


def download_special_pdfs(
    coid: Any,
    links: List[Dict[str, Any]],
    pdf_dir: Path,
) -> List[Dict[str, Any]]:
    """下載 PDF 到 data/special/pdfs/；失敗記 httpStatus／error，唔假造。"""
    pdf_dir.mkdir(parents=True, exist_ok=True)
    out: List[Dict[str, Any]] = []
    seen = set()
    for lk in links or []:
        if not _is_pdf_link(lk):
            continue
        url = lk["url"]
        if url in seen:
            continue
        seen.add(url)
        typ = str(lk.get("type") or "pdf")
        # local filename
        leaf = url.rstrip("/").split("/")[-1].split("?")[0] or f"{coid}-{typ}.pdf"
        if not leaf.lower().endswith(".pdf"):
            leaf = f"{coid}-{typ}.pdf"
        safe = re.sub(r"[^A-Za-z0-9._-]+", "_", leaf)
        local_name = f"{coid}-{typ}-{safe}"
        if not local_name.lower().endswith(".pdf"):
            local_name += ".pdf"
        dest = pdf_dir / local_name
        rel = f"data/special/pdfs/{local_name}"
        entry: Dict[str, Any] = {
            "name": lk.get("name") or typ,
            "type": typ,
            "url": url,
            "localPath": None,
            "httpStatus": None,
        }
        try:
            raw = http_get(url, timeout=120)
            # basic PDF magic
            if not (raw.startswith(b"%PDF") or len(raw) > 1000):
                entry["httpStatus"] = 200
                entry["error"] = "response not PDF magic / too small"
                entry["bytes"] = len(raw)
            else:
                dest.write_bytes(raw)
                entry["localPath"] = rel
                entry["httpStatus"] = 200
                entry["bytes"] = len(raw)
                print(f"wrote {rel} ({len(raw)} bytes)")
        except HTTPError as e:
            entry["httpStatus"] = e.code
            entry["error"] = f"HTTP {e.code}"
            log_fail(f"special pdf coid={coid} {url}: HTTP {e.code}")
        except Exception as e:
            entry["error"] = str(e)
            log_fail(f"special pdf coid={coid} {url}: {e}")
        out.append(entry)
    return out



def _spe_type_str(cat: Dict[str, Any]) -> str:
    spe = cat.get("spe_type")
    if spe is None and isinstance(cat.get("nameObj"), dict):
        spe = cat["nameObj"].get("spe_type")
    return str(spe).strip() if spe is not None and str(spe).strip() != "" else ""


def _normalize_itemlist_item(it: Dict[str, Any]) -> Dict[str, Any]:
    """itemlist 品項 → 同 nss items[] 相近欄位，兼保留 official lowest_*。"""
    store = it.get("lowest_price_store") if isinstance(it.get("lowest_price_store"), dict) else None
    lowest = it.get("lowest_price")
    min_price = ""
    if lowest is not None and lowest != "":
        try:
            min_price = f"{float(lowest):g}"
        except (TypeError, ValueError):
            min_price = str(lowest)
    out: Dict[str, Any] = {
        "oid": it.get("oid") if it.get("oid") is not None else it.get("_id") or it.get("id"),
        "name_cn": (it.get("name_cn") or it.get("name") or "").strip(),
        "name_en": (it.get("name_en") or "").strip(),
        "quantity_cn": (it.get("quantity_cn") or "").strip(),
        "minPrice": min_price,
        "maxPrice": "",
        "priceCount": it.get("price_count") if it.get("price_count") is not None else 0,
        "lowest_price": lowest,
        "price_count": it.get("price_count"),
        "rank": it.get("rank"),
        "image": it.get("image"),
    }
    if store:
        out["lowest_price_store"] = {
            "oid": store.get("oid") or store.get("_id") or store.get("id"),
            "name_cn": store.get("name_cn") or store.get("name") or "",
            "address_cn": store.get("address_cn") or store.get("address") or "",
            "phone": store.get("phone") or "",
            "shop_group": store.get("shop_group"),
        }
    return out


def _normalize_storelist_rows(
    item: Dict[str, Any],
    stores: List[Any],
) -> List[Dict[str, Any]]:
    """storelist stores[] → 同 nss prices[] 相近列。"""
    out: List[Dict[str, Any]] = []
    item_oid = item.get("oid")
    item_name = item.get("name_cn") or ""
    qty = item.get("quantity_cn") or ""
    for row in stores:
        if not isinstance(row, dict):
            continue
        st = row.get("store") if isinstance(row.get("store"), dict) else {}
        price = row.get("price")
        price_s = ""
        if price is not None and price != "":
            try:
                price_s = f"{float(price):g}"
            except (TypeError, ValueError):
                price_s = str(price)
        out.append({
            "itemOid": item_oid,
            "itemName": item_name,
            "quantity": qty,
            "price": price_s,
            "flag": "",
            "storeOid": st.get("oid") or st.get("_id") or st.get("id"),
            "storeName": st.get("name_cn") or st.get("name") or "",
            "address": st.get("address_cn") or st.get("address") or "",
            "region": "",
            "phone": st.get("phone") or "",
            "priceDate": row.get("price_date") or "",
            "lastPrice": row.get("last_price"),
            "lastPriceDate": row.get("last_price_date"),
        })
    return out


def fetch_special_itemlist(
    coid: Any,
    sleep: float = 0.6,
    storelist_limit: Optional[int] = None,
) -> Dict[str, Any]:
    """spe_type 0／2：special/itemlist（必做）＋可選 storelist。

    storelist_limit:
      None → 每品都拉 storelist
      0    → 唔拉 storelist（只留 lowest）
      N>0  → 只拉前 N 品
    """
    qs = urlencode({"lang": "cn", "cid": str(coid)})
    url = f"{BASE}/app/special/itemlist?{qs}"
    html = http_get(url).decode("utf-8", errors="replace")
    pp = page_props_from_html(html)
    if pp.get("error"):
        raise RuntimeError(f"itemlist error for cid={coid}: {pp.get('error')}")
    raw_items = [x for x in (pp.get("items") or []) if isinstance(x, dict)]
    category = pp.get("category") if isinstance(pp.get("category"), dict) else {}
    items_out = [_normalize_itemlist_item(it) for it in raw_items]

    prices: List[Dict[str, Any]] = []
    storelist_fetched = 0
    storelist_skipped = 0
    if storelist_limit == 0:
        storelist_skipped = len(items_out)
    else:
        limit = len(items_out) if storelist_limit is None else max(0, int(storelist_limit))
        for idx, it in enumerate(items_out):
            if idx >= limit:
                storelist_skipped += 1
                continue
            oid = it.get("oid")
            if oid is None:
                storelist_skipped += 1
                continue
            sqs = urlencode({"item": str(oid), "lang": "cn", "cat": str(coid)})
            surl = f"{BASE}/app/special/storelist?{sqs}"
            try:
                spp = page_props_from_html(
                    http_get(surl).decode("utf-8", errors="replace")
                )
                stores = spp.get("stores") if isinstance(spp, dict) else None
                if not isinstance(stores, list):
                    stores = []
                rows = _normalize_storelist_rows(it, stores)
                prices.extend(rows)
                # fill maxPrice from storelist
                nums: List[float] = []
                for r in rows:
                    try:
                        nums.append(float(r["price"]))
                    except (TypeError, ValueError, KeyError):
                        pass
                if nums:
                    it["maxPrice"] = f"{max(nums):g}"
                    if not it.get("minPrice"):
                        it["minPrice"] = f"{min(nums):g}"
                    # keep priceCount honest if API said 0 but we have rows
                    if not it.get("priceCount"):
                        it["priceCount"] = len(rows)
                pub = spp.get("publish_date") if isinstance(spp, dict) else None
                if pub and not it.get("_publish_date"):
                    it["_publish_date"] = str(pub)[:10]
                storelist_fetched += 1
            except Exception as e:
                log_fail(f"special storelist coid={coid} item={oid}: {e}")
            time.sleep(sleep)

    # publish_date: prefer storelist, else blank（itemlist pageProps 無統一 sdate）
    sdate = ""
    for it in items_out:
        if it.get("_publish_date"):
            sdate = it["_publish_date"]
            break
    for it in items_out:
        it.pop("_publish_date", None)

    mode = "itemlist" if items_out else "none"
    return {
        "mode": mode,
        "itemlist": {
            "url": url,
            "cid": coid,
            "categoryOid": category.get("oid"),
            "spe_type": category.get("spe_type"),
            "storelistFetched": storelist_fetched,
            "storelistSkipped": storelist_skipped,
        },
        "items": items_out,
        "prices": prices,
        "priceCount": len(prices),
        "itemCount": len(items_out),
        "sdate": sdate,
        "category": {
            "oid": category.get("oid"),
            "name_cn": category.get("name_cn") or category.get("name") or "",
            "spe_type": category.get("spe_type"),
        },
    }


def fetch_special(sleep: float = 0.6) -> Dict[str, Any]:
    """專項物價：special/main → get_category_pdf →（B）nss／（itemlist spe0/2）／（A）PDF。"""
    special_dir = DATA / "special"
    detail_dir = special_dir / "detail"
    pdf_dir = special_dir / "pdfs"
    special_dir.mkdir(parents=True, exist_ok=True)
    detail_dir.mkdir(parents=True, exist_ok=True)
    pdf_dir.mkdir(parents=True, exist_ok=True)

    html = http_get(f"{BASE}/app/special/main?lang=cn").decode("utf-8", errors="replace")
    pp = page_props_from_html(html)
    categories = parse_special_categories(pp)

    cats_out = {
        "mirroredAt": now_iso(),
        "stub": False,
        "source": "special/main pageProps.categories",
        "categories": categories,
        "schemaNote": (
            "detail/{coid}.json：mode=table|itemlist|pdf|none；"
            "table＝nss price_by_item；itemlist＝special/itemlist(+storelist)；"
            "pdf 用 pdfs[].localPath 同源 embed；PDF 404 唔阻表"
        ),
    }
    write_json(special_dir / "categories.json", cats_out)

    compat = {
        "mirroredAt": now_iso(),
        "source": "derived from special/main categories",
        "data": [
            {
                "id": c["coid"],
                "cateogry": c["name"],
                "date": c.get("date") or "",
            }
            for c in categories
        ],
    }
    write_json(DATA / "special_categories.json", compat)

    ok = 0
    mode_counts = {"table": 0, "itemlist": 0, "pdf": 0, "none": 0}
    for i, cat in enumerate(categories):
        coid = cat["coid"]
        date = cat.get("date") or ""
        print(f"[special {i+1}/{len(categories)}] coid={coid} {cat.get('name')} date={date}")
        qs = urlencode({"coid": str(coid), "date": str(date)})
        url = f"{BASE}/app/special/api/sp/get_category_pdf?{qs}"
        links: List[Dict[str, Any]] = list(cat.get("links") or [])
        seen_urls = {lk.get("url") for lk in links if isinstance(lk, dict)}
        sdate = date
        raw_payload: Any = None
        notes: List[str] = []
        table_blob: Optional[Dict[str, Any]] = None
        pdfs: List[Dict[str, Any]] = []
        mode = "none"

        try:
            raw_bytes = http_get(url)
            try:
                raw_payload = json.loads(raw_bytes.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                raw_payload = None
                if url not in seen_urls:
                    links.append({
                        "type": "pdf",
                        "url": url,
                        "name": "PDF",
                        "note": "response was non-JSON (likely PDF)",
                    })
                    seen_urls.add(url)
            if isinstance(raw_payload, dict):
                data_obj = raw_payload.get("data")
                if isinstance(data_obj, dict):
                    for lk in _links_from_special_blob(data_obj):
                        if lk["url"] not in seen_urls:
                            links.append(lk)
                            seen_urls.add(lk["url"])
                    sd = data_obj.get("sdate") or data_obj.get("date")
                    if isinstance(sd, dict):
                        sdate = sd.get("date") or sd.get("sdate") or sdate
                    elif sd:
                        sdate = str(sd)
                else:
                    for lk in _links_from_special_blob(raw_payload):
                        if lk["url"] not in seen_urls:
                            links.append(lk)
                            seen_urls.add(lk["url"])
                    if raw_payload.get("success") == -1 or data_obj is None:
                        notes.append("get_category_pdf success=-1／無 data")
        except Exception as e:
            log_fail(f"special get_category_pdf {coid}: {e}")
            notes.append(f"get_category_pdf error: {e}")

        # --- B: nss tabular prices (spe_type 3) ---
        nss_url = _nss_url_from_links(links)
        spe = _spe_type_str(cat)
        itemlist_blob: Optional[Dict[str, Any]] = None
        if nss_url or spe == "3":
            if nss_url:
                try:
                    print(f"  nss table ← {nss_url}")
                    table_blob = fetch_nss_price_table(nss_url, sleep=sleep)
                    if table_blob.get("priceCount") or table_blob.get("itemCount"):
                        mode = "table"
                        if table_blob.get("nss", {}).get("sdate"):
                            sdate = table_blob["nss"]["sdate"] or sdate
                    else:
                        notes.append("nss 頁有開但 price_by_item 無列")
                except Exception as e:
                    log_fail(f"special nss table {coid}: {e}")
                    notes.append(f"nss table error: {e}")
                    traceback.print_exc()
            elif spe == "3":
                notes.append("spe_type=3 但無 nss 連結")

        # --- itemlist：spe_type 0／2（或缺表時兜底）---
        if mode == "none" and spe in ("0", "2"):
            try:
                print(f"  itemlist ← cid={coid} spe_type={spe}")
                itemlist_blob = fetch_special_itemlist(
                    coid, sleep=sleep, storelist_limit=None
                )
                if itemlist_blob.get("itemCount"):
                    mode = "itemlist"
                    if itemlist_blob.get("sdate"):
                        sdate = itemlist_blob["sdate"] or sdate
                else:
                    notes.append("itemlist 頁有開但 items 空")
            except Exception as e:
                log_fail(f"special itemlist {coid}: {e}")
                notes.append(f"itemlist error: {e}")
                traceback.print_exc()

        # --- A: download PDFs（404 唔阻已有 table／itemlist）---
        pdfs = download_special_pdfs(coid, links, pdf_dir)
        local_pdfs = [p for p in pdfs if p.get("localPath")]
        if mode not in ("table", "itemlist"):
            if local_pdfs:
                mode = "pdf"
            elif pdfs:
                notes.append("PDF 連結存在但下載失敗（多數官方 export 404）")
            elif not nss_url and spe not in ("0", "2"):
                notes.append("無 nss／itemlist／PDF 可用來源")
            elif spe in ("0", "2") and mode == "none":
                notes.append("spe_type 0／2 但 itemlist 失敗，亦無 PDF")

        mode_counts[mode] = mode_counts.get(mode, 0) + 1

        if mode == "table":
            source = "nss price_by_item + get_category_pdf"
        elif mode == "itemlist":
            source = "special/itemlist + storelist + get_category_pdf"
        elif mode == "pdf":
            source = "local PDF"
        else:
            source = "get_category_pdf metadata only"

        detail: Dict[str, Any] = {
            "coid": coid,
            "name": cat.get("name_cn") or cat.get("name"),
            "name_cn": cat.get("name_cn") or cat.get("name"),
            "name_zh": cat.get("name_zh") or cat.get("name_cn") or cat.get("name"),
            "date": date,
            "sdate": sdate,
            "spe_type": cat.get("spe_type"),
            "mode": mode,
            "links": links,
            "pdfs": pdfs,
            "mirroredAt": now_iso(),
            "source": source,
            "apiUrl": url,
            "rawKeys": list(raw_payload.keys()) if isinstance(raw_payload, dict) else [],
            "rawSuccess": (raw_payload.get("success") if isinstance(raw_payload, dict) else None),
            "notes": notes,
        }
        if cat.get("nameObj"):
            detail["nameObj"] = cat["nameObj"]
        if table_blob:
            detail["nss"] = table_blob.get("nss")
            detail["items"] = table_blob.get("items") or []
            detail["prices"] = table_blob.get("prices") or []
            detail["types"] = table_blob.get("types") or []
            detail["regions"] = table_blob.get("regions") or []
            detail["typeSummaries"] = table_blob.get("typeSummaries") or []
            detail["priceCount"] = table_blob.get("priceCount") or 0
            detail["itemCount"] = table_blob.get("itemCount") or 0
        if itemlist_blob:
            detail["itemlist"] = itemlist_blob.get("itemlist")
            detail["items"] = itemlist_blob.get("items") or []
            detail["prices"] = itemlist_blob.get("prices") or []
            detail["priceCount"] = itemlist_blob.get("priceCount") or 0
            detail["itemCount"] = itemlist_blob.get("itemCount") or 0
            if itemlist_blob.get("category"):
                detail["itemlistCategory"] = itemlist_blob["category"]

        write_json(detail_dir / f"{coid}.json", detail)
        ok += 1
        time.sleep(sleep)

    update_meta(
        special=f"{ok}/{len(categories)} 分類",
        specialCategories=len(categories),
        specialDetailsOk=ok,
        specialModes=mode_counts,
    )
    print(f"special done: categories={len(categories)} ok={ok} modes={mode_counts}")
    return cats_out



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


    # --- promo + special (phase 2) ---
    promo_meta: Dict[str, Any] = {}
    special_meta: Dict[str, Any] = {}
    try:
        promo_meta = fetch_promo(sleep)
    except Exception as e:
        log_fail(f"fetch_promo: {e}")
        traceback.print_exc()
    try:
        special_meta = fetch_special(sleep)
    except Exception as e:
        log_fail(f"fetch_special: {e}")
        traceback.print_exc()

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
        promoStores=promo_meta.get("storeCount"),
        promoPriceFiles=promo_meta.get("priceFiles"),
        specialCategories=len((special_meta.get("categories") or [])),
        elapsedSec=round(elapsed, 1),
        failures=len(FAIL_LOG),
        search=f"full 索引 {len(all_items)} 品",
        market=f"full {len(market_catalog_items)} 品",
        promo=f"full {promo_meta.get('storesOk', 0)}/{promo_meta.get('storeCount', 0)} 店",
        special=f"full {len(special_meta.get('categories') or [])} 分類",
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
        "promoStores": promo_meta.get("storeCount"),
        "promoPriceFiles": promo_meta.get("priceFiles"),
        "specialCategories": len(special_meta.get("categories") or []),
        "failures": FAIL_LOG,
    }
    write_json(DATA / "logs" / "full_summary.json", summary)
    print(json.dumps({k: v for k, v in summary.items() if k != "failures"}, ensure_ascii=False, indent=2))
    print(f"failures: {len(FAIL_LOG)}")
    print("full done.")


def main() -> None:
    ap = argparse.ArgumentParser(
        description="澳門物價站鏡像拉數（主拉機 LAPTOP-7JUE4FNQ／Windows）"
    )
    ap.add_argument("--search", metavar="Q", help="search_name 關鍵字（如 牛奶）")
    ap.add_argument("--item", metavar="ID", help="超市貨品 _id（如 115）")
    ap.add_argument(
        "--all-search-items",
        action="store_true",
        help="對目前 search_index.json 內每品拉分店價（慎用、較慢）",
    )
    ap.add_argument("--market-veg", action="store_true", help="拉菜心分街市價樣本")
    ap.add_argument("--promo", action="store_true", help="優惠情報站：ds/main＋active_goodtype＋discount_price → data/promo/")
    ap.add_argument("--special", action="store_true", help="專項物價：special/main＋get_category_pdf → data/special/")
    ap.add_argument(
        "--full",
        action="store_true",
        help="完整鏡像：超市＋街市＋promo＋special（--sleep 建議 ≥0.6）",
    )
    ap.add_argument("--sleep", type=float, default=0.8, help="連拉多品時間隔秒數（--full／--promo／--special 建議 ≥0.6）")
    args = ap.parse_args()

    if not any([
        args.search, args.item, args.market_veg, args.all_search_items,
        args.full, args.promo, args.special,
    ]):
        ap.print_help()
        print(
            "\n至少指定 --search / --item / --market-veg / --promo / --special / --full 之一。",
            file=sys.stderr,
        )
        sys.exit(2)

    DATA.mkdir(parents=True, exist_ok=True)

    if args.full or args.promo or args.special:
        if args.sleep < 0.6:
            print("warn: --full／--promo／--special 建議 --sleep ≥ 0.6，已提升至 0.6", file=sys.stderr)
            args.sleep = 0.6

    if args.full:
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

    if args.promo:
        fetch_promo(args.sleep)

    if args.special:
        fetch_special(args.sleep)

    print("done.")


if __name__ == "__main__":
    main()
