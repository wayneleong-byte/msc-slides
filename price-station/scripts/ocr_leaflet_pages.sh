#!/usr/bin/env bash
# Re-OCR leaflet pages (chi_tra+eng). Run from repo root or any cwd.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="$ROOT/data/promo-leaflet/2026-11-03"
OCR="$BASE/ocr"
mkdir -p "$OCR"
for i in 1 2 3 4 5 6 7 8; do
  tesseract "$BASE/royal/DM$i.jpg" "$OCR/royal-DM$i" -l chi_tra+eng --psm 6 2>"$OCR/royal-DM$i.tesseract.log"
done
n=0
for f in "$BASE"/taifung/tf-*.jpg; do
  n=$((n+1))
  printf -v num '%02d' "$n"
  tesseract "$f" "$OCR/taifung-$num" -l chi_tra+eng --psm 6 2>"$OCR/taifung-$num.tesseract.log"
done
for i in 01 02 03 04 05 06 07 08; do
  f="$BASE/sanmiu/sanmiu-$i.jpg"
  if [[ -f "$f" ]]; then
    tesseract "$f" "$OCR/sanmiu-$i" -l chi_tra+eng --psm 6 2>"$OCR/sanmiu-$i.tesseract.log"
  fi
done

for i in 01 02 03 04 05 06 07 08; do
  f="$BASE/sunsco/sunsco-$i.jpg"
  if [[ -f "$f" ]]; then
    tesseract "$f" "$OCR/sunsco-$i" -l chi_tra+eng --psm 6 2>"$OCR/sunsco-$i.tesseract.log"
  fi
done

for i in 01 02 03 04 05; do
  f="$BASE/namkwong/namkwong-$i.jpg"
  if [[ -f "$f" ]]; then
    tesseract "$f" "$OCR/namkwong-$i" -l chi_tra+eng --psm 6 2>"$OCR/namkwong-$i.tesseract.log"
  fi
done
echo "OCR done → $OCR"
