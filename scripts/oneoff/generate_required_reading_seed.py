#!/usr/bin/env python3
"""
Generate SQL seed for unit_option_groups and unit_option_choices
from data/gatherround/optional-entries-by-type/required-reading.json.
Output is written to stdout for use in 20260204160001_seed_option_tables.sql.
"""

import json
from pathlib import Path


def sql_escape(s: str) -> str:
    """Escape for SQL single-quoted string: ' -> ''."""
    if s is None:
        return ""
    return str(s).replace("\\", "\\\\").replace("'", "''")


def recommended_books_jsonb(books_text: str) -> str:
    """Format books text as JSONB literal for recommended_books column."""
    obj = [{"description": (books_text or "")}]
    json_str = json.dumps(obj, ensure_ascii=False)
    return f"'{sql_escape(json_str)}'::jsonb"


def main():
    data_dir = Path(__file__).resolve().parent.parent / "data" / "gatherround" / "optional-entries-by-type"
    path = data_dir / "required-reading.json"
    entries = json.loads(path.read_text(encoding="utf-8"))

    lines = []
    for e in entries:
        unit = sql_escape(e["unit"])
        body = (e.get("body") or "").replace("\n", "\\n")
        note = sql_escape(body)
        hours_val = e.get("hours")  # None or number
        options = e.get("options")  # None or [[subcat, books_text], ...]

        # One group per entry (unit + label Required Reading)
        lines.append(
            f"INSERT INTO unit_option_groups (unit, category, label, note)\n"
            f"VALUES ('{unit}', 'Language Arts', 'Required Reading', '{note}');"
        )

        if options:
            for subcat, books_text in options:
                subcat_esc = sql_escape(subcat)
                rb = recommended_books_jsonb(books_text)
                if hours_val is not None:
                    hours_sql = f"{float(hours_val)}"
                else:
                    hours_sql = "NULL"
                lines.append(
                    f"INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)\n"
                    f"SELECT id, '{subcat_esc}', {hours_sql}, {rb}\n"
                    f"FROM unit_option_groups WHERE unit = '{unit}' AND label = 'Required Reading';"
                )
        lines.append("")

    print("\n".join(lines).strip())


if __name__ == "__main__":
    main()
