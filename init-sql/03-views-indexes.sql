CREATE SCHEMA IF NOT EXISTS model_results;

DROP MATERIALIZED VIEW model_results.entity;
CREATE MATERIALIZED VIEW model_results.entity AS
WITH a AS (
SELECT
  trim(regexp_replace(target_unicode, '\\s+', ' ', 'g')) target_unicode,
  target_img_path,
  target_tesseract,
  assoc_img_path,
  trim(regexp_replace(assoc_unicode, '\\s+', ' ', 'g')) assoc_unicode,
  assoc_tesseract,
  html_file,
  concat(target_img_path, assoc_img_path) path_data
FROM equations.figures_and_tables
)
SELECT
  target_unicode,
  target_img_path,
  target_tesseract,
  assoc_img_path,
  assoc_unicode,
  assoc_tesseract,
  html_file,
  path_data
FROM a;
