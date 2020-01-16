-- should be earlier
CREATE SCHEMA IF NOT EXISTS equations;

CREATE OR REPLACE FUNCTION array_slice(arr anyarray, ix integer)
RETURNS anyelement
AS
$$
SELECT unnest(arr[ix:ix]);
$$
LANGUAGE sql;

CREATE TABLE IF NOT EXISTS equations.output (
        document_name text,
        id int, 
        text text,
        document_id int,
        equation_id int,
        equation_text text,
        equation_offset text, 
        sentence_id int,
        sentence_offset int,
        sentence_text text,
        score float,
        var_top	int,
        var_bottom int,
        var_left int,
        var_right int,
        var_page int,
        sent_xpath text,
        sent_words text[],
        sent_top text[],
        sent_table_id int,
        sent_section_id int,
        sent_row_start int,
        sent_row_end int,
        sent_right int[],
        sent_position int,
        sent_pos_tags text[],
        sent_paragraph_id int,
        sent_page int[],
        sent_ner_tags text[],
        sent_name text,
        sent_lemmas text[],
        sent_left int[],
        sent_html_tag text,
        sent_html_attrs text[],
        sent_document_id int,
        sent_dep_parents text[],
        sent_dep_labels text[],
        sent_col_start int,
        sent_col_end int,
        sent_char_offsets int[],
        sent_cell_id int,
        sent_bottom int[],
        sent_abs_char_offsets int[],
        equation_top int,
        equation_bottom	int,
        equation_left int,
        equation_right int,
        equation_page int,
        symbols text[],
        phrases text[],
        phrases_top text[],
        phrases_bottom text[],
        phrases_left text[],
        phrases_right text[],
        phrases_page text[],
        sentence_img text,
        equation_img text,
        UNIQUE (document_name, id)
        );

CREATE TABLE IF NOT EXISTS equations.figures (
        target_img_path text,
        target_unicode text,
        target_tesseract text,
        assoc_img_path text,
        assoc_unicode text,
        assoc_tesseract text,
        html_file text,
        UNIQUE (target_img_path)
        );

CREATE TABLE IF NOT EXISTS equations.tables (
        target_img_path text,
        target_unicode text,
        target_tesseract text,
        assoc_img_path text,
        assoc_unicode text,
        assoc_tesseract text,
        html_file text,
        UNIQUE (target_img_path)
        );

CREATE OR REPLACE VIEW equations.figures_and_tables AS
SELECT
  figures.target_img_path,
  figures.target_unicode,
  figures.target_tesseract,
  figures.assoc_img_path,
  figures.assoc_unicode,
  figures.assoc_tesseract,
  figures.html_file
FROM equations.figures
UNION
SELECT
  tables.target_img_path,
  tables.target_unicode,
  tables.target_tesseract,
  tables.assoc_img_path,
  tables.assoc_unicode,
  tables.assoc_tesseract,
  tables.html_file
FROM equations.tables
UNION
SELECT
  sentence_img target_img_path,
  string_agg(sentence_text, ' ') target_unicode,
  NULL target_tesseract,
  equation_img assoc_img_path,
  equation_text assoc_unicode,
  NULL assoc_tesseract,
  NULL html_file
FROM equations.output
GROUP BY sentence_img, equation_img, equation_text;

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
  array_agg(
      ARRAY[ST_MakeEnvelope(box[1],box[2],box[3],box[4])]
  ) geometry
FROM unnested_bboxes
GROUP BY row_number
)
SELECT -- Should NOT need this distinct clause
  c.row_number,
  array_slice(
    geometry, (
      row_number() OVER (PARTITION BY equation_id ORDER BY id)
    )::integer
  ) geometry,
  array_slice(
    phrases, (
      row_number() OVER (PARTITION BY equation_id ORDER BY id)
    )::integer
  ) AS text,
  LEFT(array_slice(
    phrases_page, (
      row_number() OVER (PARTITION BY equation_id ORDER BY id)
      )::integer
  ), 1) AS phrase_page,
  document_name,
  'phrase' AS tag_id,
  id,
  document_id,
  equation_id,
  equation_text,
  equation_offset,
  symbols,
  phrases_page,
  sentence_img,
  equation_img
  sentence_id,
  sentence_offset,
  sentence_text,
  image.image_id,
  image.doc_id,
  image.page_no
FROM collected_geometry c
JOIN input i
  ON i.row_number = c.row_number
JOIN image
  ON i.document_name like concat('%', image.doc_id, '%')
AND image.page_no = substring(i.sentence_img, '_(\d+)\/'::text)::integer AND image.page_no = substring(i.equation_img, '_(\d+)\/'::text)::integer;

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
  'sentence' AS tag_id,
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
	sent_page[1] sentence_page, -- assume that everything is on the same page
	sent_words,
	sent_table_id,
	sent_section_id,
	sent_position,
	sent_pos_tags,
	sent_paragraph_id,
	sent_ner_tags,
	sent_name,
	sent_lemmas,
  image.image_id,
  image.doc_id,
  image.page_no
FROM collected_geometry c
JOIN input i
  ON i.row_number = c.row_number
JOIN image
  ON i.document_name like concat('%', image.doc_id, '%')
 AND image.page_no = i.sent_page[1];

CREATE MATERIALIZED VIEW equations.equation AS
 SELECT DISTINCT
   equation_id,
   ST_MakeEnvelope(equation_left,equation_top,equation_right,equation_bottom) geometry,
   document_name,
   'equation' AS tag_id,
  equation_text,
   equation_text AS text,
   image.image_id,
   image.doc_id,
   image.page_no,
    substring(i.equation_img, '_(\d+)\/'::text)::integer
 FROM equations.output i
 JOIN image
  ON i.document_name like concat('%', image.doc_id, '%')
  AND image.page_no = substring(i.equation_img, '_(\d+)\/'::text)::integer ;

CREATE MATERIALIZED VIEW equations.variable AS
SELECT DISTINCT
  array_agg(equation_id) equation_id,
  min(id) id,
  ST_MakeEnvelope(var_left,var_top,var_right,var_bottom) geometry,
  document_name,
  'variable' AS tag_id,
  array_agg(equation_text) equation_text,
  text,
  image.image_id,
  image.doc_id,
  image.page_no
FROM equations.output i
JOIN image
  ON i.document_name like concat('%', image.doc_id, '%')
 AND image.page_no = i.sent_page[1]
GROUP BY geometry, document_name,
         text, image.image_id, image.doc_id, image.page_no;
