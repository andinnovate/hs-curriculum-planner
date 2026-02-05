-- Option groups (Pattern A): e.g. "Literature" for a unit, choose one of several subcategory options
CREATE TABLE unit_option_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit text NOT NULL,
  category text NOT NULL,
  label text NOT NULL,
  note text
);

CREATE INDEX idx_uog_unit ON unit_option_groups(unit);

-- Option choices: one row per (group, subcategory); hours and optional recommended_books
CREATE TABLE unit_option_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_group_id uuid NOT NULL REFERENCES unit_option_groups(id) ON DELETE CASCADE,
  subcategory text NOT NULL,
  hours numeric(6,2) CHECK (hours >= 0),
  recommended_books jsonb DEFAULT '[]'::jsonb
);

CREATE INDEX idx_uoc_option_group ON unit_option_choices(option_group_id);

-- Optional items (Pattern B): e.g. lab work; user can include/exclude; adds hours to subcategory when included
CREATE TABLE unit_optional_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit text NOT NULL,
  category text NOT NULL,
  subcategory text NOT NULL,
  hours numeric(6,2) NOT NULL CHECK (hours > 0),
  description text NOT NULL
);

CREATE INDEX idx_uoi_unit ON unit_optional_items(unit);

-- RLS
ALTER TABLE unit_option_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON unit_option_groups FOR SELECT USING (true);

ALTER TABLE unit_option_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON unit_option_choices FOR SELECT USING (true);

ALTER TABLE unit_optional_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON unit_optional_items FOR SELECT USING (true);
