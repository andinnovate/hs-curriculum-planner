#!/usr/bin/env python3
"""
Split gatherround-optional-entries.json into 4 files by category:
  required-reading.json, la-additions.json, labs.json, other.json
Commented-out entry blocks in the source are included in other.json.
"""

import json
import re
from pathlib import Path


def strip_inline_comment(line: str) -> str:
    """Remove // and rest of line, but not inside strings."""
    in_string = False
    escape = False
    quote = None
    out = []
    i = 0
    while i < len(line):
        c = line[i]
        if escape:
            out.append(c)
            escape = False
            i += 1
            continue
        if c == "\\" and in_string:
            escape = True
            out.append(c)
            i += 1
            continue
        if not in_string and (c == '"' or c == "'"):
            in_string = True
            quote = c
            out.append(c)
            i += 1
            continue
        if in_string and c == quote:
            in_string = False
            out.append(c)
            i += 1
            continue
        if not in_string and i + 1 < len(line) and line[i : i + 2] == "//":
            break
        out.append(c)
        i += 1
    return "".join(out)


def extract_commented_blocks(text: str) -> tuple[list[dict], str]:
    """
    Find blocks of lines that are entirely commented (// { ... // },),
    parse each as a JSON object, and return (list of those objects, text with blocks removed).
    """
    commented_entries = []
    lines = text.splitlines()
    result_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Start of commented block: line is // then optional space then {
        if re.match(r"^\s*//\s*\{", line):
            block_lines = [line]
            i += 1
            while i < len(lines):
                block_lines.append(lines[i])
                # End of block: // } or // },
                if re.match(r"^\s*//\s*\}", lines[i]):
                    i += 1
                    break
                i += 1
            # Uncomment and parse (only strip comma from closing "// }," line)
            uncommented = []
            for idx, bl in enumerate(block_lines):
                m = re.match(r"^(\s*)//\s?(.*)$", bl)
                if m:
                    part = m.group(2).rstrip()
                    if idx == len(block_lines) - 1 and part.endswith(","):
                        part = part[:-1]
                    uncommented.append(m.group(1) + part)
                else:
                    uncommented.append(bl)
            try:
                obj = json.loads("\n".join(uncommented))
                if isinstance(obj, dict):
                    obj["_commented"] = True
                    commented_entries.append(obj)
            except json.JSONDecodeError:
                pass
            # Don't add block to result
            continue
        result_lines.append(line)
        i += 1
    return commented_entries, "\n".join(result_lines)


def strip_all_comments(text: str) -> str:
    """Strip // comments so the rest can be parsed as JSON (uncomment full-line // and strip inline //)."""
    lines = []
    for line in text.splitlines():
        if line.strip().startswith("//"):
            # Uncomment so commented-out objects become part of array
            m = re.match(r"^(\s*)//\s?(.*)$", line)
            if m:
                line = m.group(1) + m.group(2)
            else:
                continue
        else:
            line = strip_inline_comment(line)
        lines.append(line)
    return "\n".join(lines)


def bucket_entry(e: dict, commented: bool) -> str:
    """Return 'required-reading' | 'la-additions' | 'labs' | 'other'."""
    if commented:
        return "other"
    t = (e.get("type") or "").strip()
    if t == "Required Reading":
        return "required-reading"
    if t == "Optional LA Addition":
        return "la-additions"
    if "lab" in t.lower():
        return "labs"
    return "other"


def main():
    data_dir = Path(__file__).resolve().parent.parent / "data" / "gatherround"
    in_path = data_dir / "gatherround-optional-entries.json"
    out_dir = data_dir / "optional-entries-by-type"

    if not in_path.exists():
        raise SystemExit(f"Input file not found: {in_path}")

    raw = in_path.read_text(encoding="utf-8")

    # Extract commented-out blocks and remove them from text so main parse doesn't see them
    commented_entries, text_without_commented = extract_commented_blocks(raw)
    cleaned = strip_all_comments(text_without_commented)

    try:
        entries = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise SystemExit(f"JSON parse error: {e}")

    if not isinstance(entries, list):
        raise SystemExit("Expected JSON array of entries")

    # Mark entries that have inline // ? (commented-question) - treat as other
    all_entries: list[tuple[dict, bool]] = []
    for e in entries:
        if not isinstance(e, dict):
            continue
        # Inline "// ?" means it was questionable; treat as other
        all_entries.append((e, e.pop("_commented", False)))

    for e in commented_entries:
        e.pop("_commented", None)
        all_entries.append((e, True))

    # Bucket into 4 categories
    buckets: dict[str, list[dict]] = {
        "required-reading": [],
        "la-additions": [],
        "labs": [],
        "other": [],
    }
    for e, commented in all_entries:
        bucket = bucket_entry(e, commented)
        buckets[bucket].append(e)

    out_dir.mkdir(parents=True, exist_ok=True)
    for name in ["required-reading", "la-additions", "labs", "other"]:
        out_path = out_dir / f"{name}.json"
        out_path.write_text(
            json.dumps(buckets[name], indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        print(f"  {name}.json: {len(buckets[name])} entries")

    print(f"\nWrote 4 files to {out_dir}")


if __name__ == "__main__":
    main()
