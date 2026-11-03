#!/usr/bin/env bash
# Re-OCR all P0 leaflet pages (chi_tra+eng). Run from repo root or any cwd.
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
echo "OCR done → $OCR"
