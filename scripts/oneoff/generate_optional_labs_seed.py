#!/usr/bin/env python3
"""
Generate SQL seed for unit_optional_items from
data/gatherround/optional-entries-by-type/labs.json.

Outputs SQL to stdout for use in a migration.
"""

import csv
import json
import re
from pathlib import Path


def sql_escape(value: str) -> str:
    """Escape for SQL single-quoted string: backslash and '."""
    if value is None:
        return ""
    return str(value).replace("\\", "\\\\").replace("'", "''")


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip()).lower()

def split_blocks(body: str) -> list[str]:
    if not body:
        return []
    normalized = body.strip().replace("\r\n", "\n")
    blocks = re.split(r"\n\s*\n", normalized)
    return [block.strip() for block in blocks if block.strip()]


def pick_block(blocks: list[str], option_label: str, index: int) -> str:
    if not blocks:
        return option_label
    option_norm = normalize(option_label)
    for block in blocks:
        if option_norm in normalize(block):
            return block
    if len(blocks) == 1:
        return blocks[0]
    if index < len(blocks):
        return blocks[index]
    return option_label


def main() -> None:
    repo = Path(__file__).resolve().parent.parent.parent
    data_dir = repo / "data" / "gatherround"
    labs_path = data_dir / "optional-entries-by-type" / "labs.json"
    csv_path = data_dir / "unit_subcategory_hours.csv"

    entries = json.loads(labs_path.read_text(encoding="utf-8"))

    unit_map: dict[str, dict[str, object]] = {}
    with csv_path.open(encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            unit_key = normalize(row["unit"])
            sub_key = normalize(row["subcategory"])
            category_key = normalize(row["category"])
            entry = unit_map.setdefault(
                unit_key, {"canonical": row["unit"], "subs": {}, "categories": {}}
            )
            entry["subs"][sub_key] = {
                "category": row["category"],
                "subcategory": row["subcategory"],
            }
            entry["categories"][category_key] = row["category"]

    lines: list[str] = []
    warnings: list[str] = []
    type_label = "Optional Lab"

    for entry in entries:
        options = entry.get("options")
        if not options:
            warnings.append(f"Skip {entry.get('unit')} ({entry.get('type')}): no options")
            continue

        unit_key = normalize(entry["unit"])
        unit_entry = unit_map.get(unit_key)
        if not unit_entry:
            warnings.append(f"Skip {entry.get('unit')} ({entry.get('type')}): unit not found")
            continue

        canonical_unit = unit_entry["canonical"]
        subs = unit_entry["subs"]
        categories = unit_entry["categories"]

        blocks = split_blocks(entry.get("body") or "")

        for index, option in enumerate(options):
            if not isinstance(option, list) or len(option) < 2:
                warnings.append(f"Skip {entry.get('unit')} ({entry.get('type')}): invalid option")
                continue
            sub_key = normalize(option[1])
            sub_entry = subs.get(sub_key)
            if sub_entry:
                category = sub_entry["category"]
                subcategory = sub_entry["subcategory"]
            else:
                category_match = categories.get(sub_key)
                if not category_match:
                    warnings.append(
                        f"Skip {entry.get('unit')} ({entry.get('type')}): subcategory {option[1]!r} not found"
                    )
                    continue
                category = category_match
                subcategory = category_match

            hours = entry.get("hours")
            try:
                hours_val = float(hours)
            except (TypeError, ValueError):
                warnings.append(
                    f"Skip {entry.get('unit')} ({entry.get('type')}): invalid hours"
                )
                continue

            option_label = option[0] if option else ""
            block = pick_block(blocks, str(option_label), index)
            if option_label and normalize(option_label) not in normalize(block):
                description = f"{option_label}: {block}"
            else:
                description = block
            description = sql_escape(description.replace("\n", "\\n"))

            lines.append(
                "INSERT INTO unit_optional_items (unit, category, subcategory, hours, description, curriculum_id, type)\n"
                f"VALUES ('{sql_escape(canonical_unit)}', '{sql_escape(category)}', "
                f"'{sql_escape(subcategory)}', {hours_val}, '{description}', 'gatherround', '{type_label}');"
            )

    header = [
        "-- Generated from data/gatherround/optional-entries-by-type/labs.json",
        "-- Uses data/gatherround/unit_subcategory_hours.csv for category lookup",
    ]
    if warnings:
        header.append("-- Skipped entries:")
        header.extend([f"-- - {msg}" for msg in warnings])
    header.append("")

    print("\n".join(header + lines).strip())


if __name__ == "__main__":
    main()
