-- CreateTable
CREATE TABLE unit_subcategory_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit text NOT NULL,
  category text NOT NULL,
  subcategory text NOT NULL,
  hours numeric(6,2) NOT NULL CHECK (hours > 0),
  UNIQUE (unit, category, subcategory)
);

-- Indexes
CREATE INDEX idx_ush_category ON unit_subcategory_hours(category);

-- RLS
ALTER TABLE unit_subcategory_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON unit_subcategory_hours FOR SELECT USING (true);
