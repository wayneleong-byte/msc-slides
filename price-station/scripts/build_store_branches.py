#!/usr/bin/env python3
"""Build data/promo-leaflet/store-branches.json (t546). Never invent addresses."""
import json
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone, timedelta

ROOT = Path(__file__).resolve().parents[1]
MACAU = timezone(timedelta(hours=8))

ENTRIES = [
  ('royal', None, '0101', '來來超市'),
  ('sanmiu', '0102', '0102', '新苗'),
  ('sunsco', '0103', '0103', '新花城'),
  ('taifung', '0104', '0104', '泰豐'),
  ('namkwong', '0121', '0121', '南光 Mart'),
  ('tmart', '0124', '0124', 'Tmart'),
  ('leefong', '0108', '0108', '利豐'),
  ('fokcheong', '0110', '0110', '福倡'),
  ('nanhua', '0122', '0122', '南華美式貨場'),
  ('vangkei', '0107', '0107', '宏基'),
]

def main():
  now = datetime.now(MACAU).strftime('%Y-%m-%dT%H:%M:%S+08:00')
  group_branches = defaultdict(dict)
  for p in (ROOT / 'data/items').glob('*.json'):
    if p.name == 'index.json':
      continue
    d = json.loads(p.read_text(encoding='utf-8'))
    for g in d.get('groups') or []:
      gid = str(g.get('group_id') or g.get('group_code') or '')
      if not gid:
        continue
      for sm in g.get('supermarkets') or []:
        sid = str(sm.get('supermarket_id') or '')
        sname = (sm.get('supermarket_name') or '').strip()
        if sid and sname:
          group_branches[gid][sid] = sname
  try:
    import locale
    for loc in ('zh_HK.UTF-8', 'zh_TW.UTF-8', 'C.UTF-8'):
      try:
        locale.setlocale(locale.LC_ALL, loc)
        break
      except Exception:
        pass
    def sort_zh(xs):
      return sorted(xs, key=locale.strxfrm)
  except Exception:
    def sort_zh(xs):
      return sorted(xs)

  leaf = json.loads((ROOT / 'data/promo-leaflet/index.json').read_text(encoding='utf-8'))
  promo = json.loads((ROOT / 'data/promo/index.json').read_text(encoding='utf-8'))
  leaf_by_id = {s['id']: s for s in leaf.get('stores') or []}
  promo_by_scode = {str(s['scode']): s for s in promo.get('stores') or []}
  stores_out = []
  for id_, scode, gid, fallback in ENTRIES:
    br_map = group_branches.get(gid) or {}
    by_name = {}
    for sid, nm in br_map.items():
      by_name.setdefault(nm, sid)
    names = sort_zh(list(by_name.keys()))
    branches = [{'id': by_name[nm], 'name': nm} for nm in names]
    name_cn = fallback
    if id_ in leaf_by_id:
      name_cn = leaf_by_id[id_].get('name_cn') or leaf_by_id[id_].get('mark') or name_cn
    elif scode and scode in promo_by_scode:
      p = promo_by_scode[scode]
      name_cn = p.get('name_cn') or p.get('groupName') or p.get('mark') or name_cn
    note = ''
    if not branches:
      note = 'items 無此 group／無分店資料' if gid not in group_branches else 'group 無 supermarket 分店'
    stores_out.append({
      'id': id_, 'scode': scode, 'name_cn': name_cn, 'groupId': gid,
      'branches': branches, 'address': None, 'note': note,
    })
  out = {
    'mirroredAt': now,
    'timezone': 'Asia/Macau',
    'source': 'derived from data/items/*.json groups→supermarkets; unique supermarket_name sorted zh-Hant; address never invented',
    'policy': 't546：有分店可選；無分店顯示 address 或「暫無分店／店址資料（待補）」',
    'stores': stores_out,
  }
  path = ROOT / 'data/promo-leaflet/store-branches.json'
  path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
  print('wrote', path)
  for s in stores_out:
    print(f"  {s['id']}: {len(s['branches'])} branches")

if __name__ == '__main__':
  main()
