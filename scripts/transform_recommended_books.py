#!/usr/bin/env python3
"""
Transform unit_option_choices.recommended_books from
  [{"description": "line1\\nline2"}]  ->  ["line1", "line2"]
so the column is an array of strings (one per line). Handles literal \\n in text.

Run after setting SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or use the migration
20260204170000_transform_recommended_books_to_strings.sql instead).
"""

import os
import json
from pathlib import Path

try:
  from supabase import create_client
except ImportError:
  create_client = None


def transform_value(rb: list) -> list[str]:
  if not isinstance(rb, list) or len(rb) == 0:
    return []
  first = rb[0]
  if isinstance(first, str):
    return rb  # already array of strings
  if isinstance(first, dict) and "description" in first:
    desc = first["description"]
    if not isinstance(desc, str):
      return []
    desc = desc.replace("\\n", "\n")
    return [s.strip() for s in desc.split("\n") if s.strip()]
  return []


def main():
  url = os.environ.get("SUPABASE_URL")
  key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
  if not url or not key:
    print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) to run against the API.")
    print("Alternatively, apply the migration: supabase/migrations/20260204170000_transform_recommended_books_to_strings.sql")
    return 1
  if create_client is None:
    print("Install supabase: pip install supabase")
    return 1

  client = create_client(url, key)
  res = client.table("unit_option_choices").select("id, recommended_books").execute()
  rows = res.data or []
  updated = 0
  for row in rows:
    rid = row.get("id")
    rb = row.get("recommended_books")
    new_rb = transform_value(rb)
    if new_rb != rb:
      client.table("unit_option_choices").update({"recommended_books": new_rb}).eq("id", rid).execute()
      updated += 1
  print(f"Updated {updated} of {len(rows)} rows.")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
