#!/usr/bin/env python3
"""Generate seed migration SQL from unit_subcategory_hours.csv.
Uses first occurrence per (unit, category, subcategory); no aggregation.
"""
import csv
import sys
from pathlib import Path

def escape_sql(s: str) -> str:
    return s.replace("'", "''")

def main():
    repo = Path(__file__).resolve().parent.parent
    csv_path = repo / "unit_subcategory_hours.csv"
    seen = set()
    rows = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = (row["unit"], row["category"], row["subcategory"])
            if key in seen:
                continue
            seen.add(key)
            rows.append(
                (escape_sql(row["unit"]), escape_sql(row["category"]), escape_sql(row["subcategory"]), row["hours"])
            )
    # Output SQL: batch INSERTs (e.g. 50 per INSERT for readability)
    batch_size = 50
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        values = ", ".join(
            f"('{u}', '{c}', '{s}', {h})" for u, c, s, h in batch
        )
        print(f"INSERT INTO unit_subcategory_hours (unit, category, subcategory, hours) VALUES {values};")
    return 0

if __name__ == "__main__":
    sys.exit(main())
