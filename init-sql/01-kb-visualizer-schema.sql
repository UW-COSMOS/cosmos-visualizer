-- should be earlier
CREATE SCHEMA IF NOT EXISTS equations;

/*
Unnest 2d array into 1d array
*/
CREATE OR REPLACE FUNCTION unnest_2d_1d(ANYARRAY, OUT a ANYARRAY)
  RETURNS SETOF ANYARRAY AS
$$
BEGIN
   FOREACH a SLICE 1 IN ARRAY $1 LOOP
      RETURN NEXT;
   END LOOP;
END
$$  LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION transpose_2d(anyarray)
/*
Transpose an array as a matrix
*/
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

DROP MATERIALIZED VIEW equations.phrase;
CREATE MATERIALIZED VIEW equations.phrase AS
WITH input AS (
SELECT
  /*
  Stored query that holds input data
  */
  row_number() OVER (ORDER BY equation_id),
  *
FROM equations.output
),
bboxes AS (
SELECT
  row_number,
  transpose_2d(ARRAY[
    string_to_array(trim(unnest(phrases_left)),' ')::integer[],
    string_to_array(trim(unnest(phrases_top)),' ')::integer[],
    string_to_array(trim(unnest(phrases_right)),' ')::integer[],
    string_to_array(trim(unnest(phrases_bottom)),' ')::integer[]]
  ) boxes
FROM input
),
unnested_bboxes AS (
SELECT
	row_number,
	unnest_2d_1d(boxes) box
FROM bboxes
),
collected_geometry AS (
SELECT
  row_number,
  ST_Union(ST_Collect(
      ARRAY[ST_MakeEnvelope(box[1],box[2],box[3],box[4])]
  )) geometry
FROM unnested_bboxes
GROUP BY row_number
)
SELECT
	c.row_number,
	geometry,
	document_name,
	id,
	text,
	document_id,
	equation_text,
	equation_offset,
	symbols,
	phrases,
	phrases_page,
	sentence_img,
	equation_img
	sentence_id,
	sentence_offset,
	sentence_text
FROM collected_geometry c
JOIN input i
  ON i.row_number = c.row_number;

DROP MATERIALIZED VIEW equations.sentence;
CREATE MATERIALIZED VIEW equations.sentence AS
WITH input AS (
SELECT DISTINCT ON (sentence_text)
  /*
  Stored query that holds input data
  */
  row_number() OVER (ORDER BY equation_id),
  *
FROM equations.output
),
bboxes AS (
SELECT
  row_number,
  transpose_2d(ARRAY[
    sent_left::integer[],
    sent_top::integer[],
    sent_right::integer[],
    sent_bottom::integer[]
  ]) boxes
FROM input
),
unnested_bboxes AS (
SELECT
	row_number,
	unnest_2d_1d(boxes) box
FROM bboxes
),
collected_geometry AS (
SELECT
  row_number,
  ST_Union(ST_Collect(
      ARRAY[ST_MakeEnvelope(box[1],box[2],box[3],box[4])]
  )) geometry
FROM unnested_bboxes
GROUP BY row_number
)
SELECT
	c.row_number,
	geometry,
	document_name,
	id,
	document_id,
	equation_id,
	equation_text,
	equation_offset,
	symbols,
	sentence_img,
	equation_img
	sentence_id,
	sentence_offset,
	sentence_text,
	sent_page[0] sentence_page, -- assume that everything is on the same page
	sent_words,
	sent_table_id,
	sent_section_id,
	sent_position,
	sent_pos_tags,
	sent_paragraph_id,
	sent_ner_tags,
	sent_name,
	sent_lemmas
FROM collected_geometry c
JOIN input i
  ON i.row_number = c.row_number;
