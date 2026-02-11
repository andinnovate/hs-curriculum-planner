-- Generated from inline JSON (Optional PE Addition + Required PE Add-on)

INSERT INTO unit_option_groups (unit, category, label, note, curriculum_id)
VALUES (
  'Human Body',
  'Physical Education',
  'Required PE Add-on:',
  'Exercise 30 minutes per day\\n10 hours already added to Physical Education',
  'gatherround'
);

INSERT INTO unit_optional_items (unit, category, subcategory, hours, description, curriculum_id, type)
VALUES (
  'Sports + PE',
  'Physical Education',
  'Physical Education',
  65,
  'Add 65 hours to Physical Education if using the Family Fitness Plan',
  'gatherround',
  'Optional PE Addition'
);
