#!/usr/bin/env python3
"""Build data/promo-leaflet/store-branches.json from data/items/*.json (scode-keyed)."""
import json
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ITEMS = ROOT / "data" / "items"
OUT = ROOT / "data" / "promo-leaflet" / "store-branches.json"

LEAFLET_ALIAS = {
    "royal": "0101",
    "taifung": "0104",
    "sanmiu": "0102",
    "sunsco": "0103",
    "namkwong": "0121",
}

REQUIRED = {
    "0101": "來來",
    "0102": "新苗",
    "0103": "新花城",
    "0104": "泰豐",
    "0121": "南光 Mart",
    "0124": "Tmart",
    "0108": "利豐",
    "0110": "福倡",
    "0122": "南華美式貨場",
    "0107": "宏基",
}


def main():
    promo_names = {}
    promo_path = ROOT / "data" / "promo" / "index.json"
    if promo_path.exists():
        pi = json.loads(promo_path.read_text())
        for s in pi.get("stores") or []:
            sc = str(s.get("scode") or "")
            if not sc:
                continue
            nm = s.get("name_cn") or s.get("name_zh") or s.get("groupName") or s.get("mark") or s.get("name")
            if nm:
                promo_names[sc] = str(nm)

    leaflet_names = {}
    aliases = dict(LEAFLET_ALIAS)
    li_path = ROOT / "data" / "promo-leaflet" / "index.json"
    if li_path.exists():
        li = json.loads(li_path.read_text())
        for s in li.get("stores") or []:
            sid = s.get("id")
            sc = s.get("scode") or aliases.get(sid)
            if sc:
                sc = str(sc)
                if sid:
                    aliases.setdefault(sid, sc)
            nm = s.get("name_cn") or s.get("mark")
            if sc and nm:
                leaflet_names[str(sc)] = str(nm)

    by = defaultdict(lambda: {"name_cn": None, "branches": {}})
    for p in sorted(ITEMS.glob("*.json"), key=lambda x: int(x.stem) if x.stem.isdigit() else x.stem):
        try:
            d = json.loads(p.read_text())
        except Exception:
            continue
        for g in d.get("groups") or []:
            code = str(g.get("group_code") or "").strip()
            if not code:
                continue
            name = g.get("group_name_cn") or g.get("group_name") or ""
            if name and not by[code]["name_cn"]:
                by[code]["name_cn"] = str(name)
            for s in g.get("supermarkets") or []:
                sid = str(s.get("supermarket_id") or "").strip()
                sname = (s.get("supermarket_name") or "").strip()
                if not sid or not sname:
                    continue
                if sid not in by[code]["branches"]:
                    by[code]["branches"][sid] = sname

    macau = timezone(timedelta(hours=8))
    now = datetime.now(macau).strftime("%Y-%m-%dT%H:%M:%S+08:00")
    out = {
        "builtAt": now,
        "timezone": "Asia/Macau",
        "source": "data/items/*/groups[].supermarkets (dedupe by supermarket_id)",
        "note": "分店名取自物價站公開資料；唔假造門牌。若 items 無該 scode 則 branches 為空。",
        "aliases": aliases,
        "stores": {},
    }

    all_codes = set(by.keys()) | set(REQUIRED.keys())
    for code in sorted(all_codes):
        name = (
            leaflet_names.get(code)
            or promo_names.get(code)
            or (by[code]["name_cn"] if code in by else None)
            or REQUIRED.get(code)
            or code
        )
        if code in REQUIRED and (not by[code]["name_cn"] or code in ("0121", "0124")):
            name = leaflet_names.get(code) or promo_names.get(code) or REQUIRED[code]
        branches_map = by[code]["branches"] if code in by else {}

        def sort_key(item):
            sid, _ = item
            return (0, int(sid)) if sid.isdigit() else (1, sid)

        branches = [{"id": sid, "name": nm} for sid, nm in sorted(branches_map.items(), key=sort_key)]
        note = ""
        if not branches:
            note = "物價站 items 暫無此 scode 分店名單；只顯示品牌名，唔假造門牌。"
        elif len(branches) == 1:
            note = "僅一間分店（物價站名單）。"
        out["stores"][code] = {
            "name_cn": name,
            "scode": code,
            "branches": branches,
            "note": note,
        }

    lookup = {}
    for code, entry in out["stores"].items():
        lookup[code] = {
            "scode": entry["scode"],
            "name_cn": entry["name_cn"],
            "branchCount": len(entry["branches"]),
        }
    for alias, code in aliases.items():
        if code in out["stores"]:
            e = out["stores"][code]
            lookup[alias] = {
                "scode": e["scode"],
                "name_cn": e["name_cn"],
                "branchCount": len(e["branches"]),
            }
    out["lookup"] = lookup

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print("Wrote", OUT)
    for code in ["0101", "0102", "0103", "0104", "0121", "0124", "0108", "0110", "0122", "0107"]:
        e = out["stores"].get(code, {})
        print(f"  {code} {e.get('name_cn')} branches={len(e.get('branches') or [])}")


if __name__ == "__main__":
    main()
