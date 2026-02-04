#!/usr/bin/env python3
"""
Generate app/src/data/gatherround-plan.json from data/gatherround/unit_subcategory_hours.csv.
Uses first occurrence of each unit to get its year. Run from repo root when CSV changes.
"""
import csv
import json
from pathlib import Path

def main():
    # script lives at scripts/archive/gatherround/ -> repo is parent.parent.parent.parent
    repo = Path(__file__).resolve().parent.parent.parent.parent
    csv_path = repo / "data" / "gatherround" / "unit_subcategory_hours.csv"
    out_path = repo / "app" / "src" / "data" / "gatherround-plan.json"

    out_path.parent.mkdir(parents=True, exist_ok=True)

    seen = {}
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            unit = row["unit"]
            if unit not in seen:
                year = int(row["year"])
                if 1 <= year <= 4:
                    seen[unit] = year

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(seen, f, indent=2)

    print(f"Wrote {len(seen)} unit->year entries to {out_path}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
