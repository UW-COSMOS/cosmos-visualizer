CREATE OR REPLACE FUNCTION transpose_2d(anyarray)
RETURNS anyarray AS $$
SELECT array_agg(v ORDER BY j) matrix  FROM (
    SELECT j, array_agg(v ORDER BY i) AS v FROM (
        SELECT i, j, $1[i][j] AS v FROM (
            SELECT generate_subscripts($1, 2) j, q.* FROM (
                SELECT generate_subscripts($1, 1) AS i, $1
            ) q
        ) r
    ) s
     GROUP BY j
) t
$$ LANGUAGE sql IMMUTABLE;

SELECT text, unnest(phrases), transpose_2d(ARRAY[
	string_to_array(trim(unnest(phrases_left)),' ')::integer[],
	string_to_array(trim(unnest(phrases_top)),' ')::integer[],
	string_to_array(trim(unnest(phrases_right)),' ')::integer[],
	string_to_array(trim(unnest(phrases_bottom)),' ')::integer[]]
) boxes
FROM output
