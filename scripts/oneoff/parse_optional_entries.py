#!/usr/bin/env python3
"""
Parse optional/configurable entries from Gather Round curriculum CSV files.
Extracts type (Required Reading, Optional LA Addition, Optional Labs, etc.)
and body text, associated with each unit. Outputs JSON.
"""

import csv
import json
import re
import os
from pathlib import Path


# Types we consider "optional/configurable" (exact or prefix match on cell content)
TYPE_PATTERNS = [
    "Required Reading",
    "Optional Lab Addition",
    "Optional LA Addition",
    "Optional PE Addition",
    "Optional Chemistry Lab",
    "Optional Biology Lab",
    "Optional Physics Lab",
    "Optional Physics Labs",
    "Optional Labs",
    "Optional Life Science Lab",
    "Optional Physical Science Lab",
    "Optional Physics/Earth Science Labs",
    "Optional Chemistry/Physics Lab",
    "Optional Chemistry/\nPhysics Lab",
    "Required PE Add-on:",
]


def normalize_unit_name(s: str) -> str:
    """Replace newlines with space and strip extra whitespace."""
    if not s:
        return ""
    return " ".join(s.replace("\n", " ").split()).strip()


def is_type_label(cell: str) -> bool:
    """Return True if cell content is one of our known type labels."""
    if not cell or not cell.strip():
        return False
    t = cell.strip()
    for pattern in TYPE_PATTERNS:
        if pattern in t or t in pattern:
            return True
    if t == "Required Reading":
        return True
    if t.startswith("Optional ") and ("Lab" in t or "LA Addition" in t or "PE " in t):
        return True
    if t.startswith("Required PE"):
        return True
    return False


def normalize_type(cell: str) -> str:
    """Return a clean type string for the cell (use as-is if it's a known type)."""
    t = cell.strip()
    # Normalize slash variants
    t = t.replace("\n", " ").replace("  ", " ")
    return t


def parse_one_file(filepath: Path, year: int) -> list[dict]:
    """Parse one Gather Round year CSV and return list of { year, unit, type, body }."""
    entries = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        return entries

    # Unit names: first row, columns 1 to end; drop last if it's TOTALS
    raw_units = rows[0][1:]
    units = []
    for u in raw_units:
        u = normalize_unit_name(u)
        if u and u.upper() != "TOTALS":
            units.append(u)
    # If we still have one extra (TOTALS was in the middle in some files), trim to match data
    n_units = len(units)

    # Find where optional section starts (first row that has a type label in col 1 or any col)
    start_row = None
    for i, row in enumerate(rows):
        if not row:
            continue
        for j in range(1, min(len(row), n_units + 1)):
            if is_type_label(row[j] if j < len(row) else ""):
                start_row = i
                break
        if start_row is not None:
            break

    if start_row is None:
        return entries

    # From start_row to end, collect (col_index, type, body)
    i = start_row
    while i < len(rows):
        row = rows[i]
        # Pad row so we can index up to n_units
        padded = (row + [""] * (n_units + 2))[: n_units + 2]
        next_row = rows[i + 1] if i + 1 < len(rows) else []
        next_padded = (next_row + [""] * (n_units + 2))[: n_units + 2]

        for j in range(1, n_units + 1):
            cell = padded[j].strip() if j < len(padded) else ""
            if not cell:
                continue
            if not is_type_label(cell):
                continue
            typ = normalize_type(padded[j])
            # Body: next row, same column (if that cell is not another type)
            body = ""
            if j < len(next_padded):
                next_cell = next_padded[j].strip()
                if next_cell and not is_type_label(next_cell):
                    body = next_padded[j].strip()

            unit_name = units[j - 1] if j <= len(units) else ""
            if not unit_name:
                continue
            entries.append({
                "year": year,
                "unit": unit_name,
                "type": typ,
                "body": body,
            })
        i += 1

    return entries


def main():
    data_dir = Path(__file__).resolve().parent.parent / "data" / "gatherround"
    if not data_dir.is_dir():
        raise SystemExit(f"Data directory not found: {data_dir}")

    all_entries = []
    for path in sorted(data_dir.glob("gather round year *.csv")):
        m = re.search(r"year\s*(\d+)", path.name, re.I)
        year = int(m.group(1)) if m else 0
        entries = parse_one_file(path, year)
        all_entries.extend(entries)

    out_path = data_dir / "gatherround-optional-entries.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_entries, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(all_entries)} entries to {out_path}")


if __name__ == "__main__":
    main()
