-- Transform recommended_books from [{ "description": "line1\nline2" }] to ["line1", "line2"]
-- so the column is a plain array of strings (one per line).
UPDATE unit_option_choices
SET recommended_books = (
  SELECT coalesce(
    (
      SELECT jsonb_agg(trimmed)
      FROM (
        SELECT trim(unnest(string_to_array(
          replace(recommended_books->0->>'description', E'\\n', E'\n'),
          E'\n'
        ))) AS trimmed
      ) t
      WHERE trimmed <> ''
    ),
    '[]'::jsonb
  )
)
WHERE jsonb_typeof(recommended_books) = 'array'
  AND jsonb_array_length(recommended_books) > 0
  AND recommended_books->0 ? 'description';
