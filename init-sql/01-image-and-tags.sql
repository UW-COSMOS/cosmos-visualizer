/*
This bootstrap script only runs on cluster creation but we might want it to run
every time we start up the worker, just in case we make schema additions, etc.
 */
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- We don't need this GIS stuff
TRUNCATE TABLE spatial_ref_sys;

CREATE TABLE IF NOT EXISTS stack_type (
  id text PRIMARY KEY
);

INSERT INTO stack_type (id) VALUES
('prediction'),
('annotation')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS stack (
  stack_id text PRIMARY KEY,
  stack_type text REFERENCES stack_type(id) NOT NULL
);

CREATE TABLE IF NOT EXISTS image (
  image_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  doc_id text,
  page_no integer,
  height integer,
  width integer,
  file_path text,
  tag_start timestamp, -- the time tagging began
  created timestamp DEFAULT now(),
  UNIQUE (doc_id, page_no)
);

CREATE TABLE IF NOT EXISTS image_stack (
  image_stack_id serial PRIMARY KEY,
  image_id uuid REFERENCES image(image_id) NOT NULL,
  stack_id text REFERENCES stack(stack_id) NOT NULL,
  UNIQUE (image_id, stack_id)
);

CREATE TABLE IF NOT EXISTS person (
  person_id text PRIMARY KEY,
  name text,
  tagger boolean DEFAULT TRUE,
  validator boolean DEFAULT FALSE,
  created timestamp DEFAULT now(),
  CHECK (person_id <> 'none')
);

CREATE TABLE IF NOT EXISTS tag (
  tag_id integer PRIMARY KEY,
  name text UNIQUE,
  description text,
  color text,
  created timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS image_tag (
  image_tag_id uuid DEFAULT uuid_generate_v4() NOT NULL, -- unique image/tag/user hash
  image_stack_id integer REFERENCES image_stack(image_stack_id) NOT NULL,
  tag_id integer REFERENCES tag(tag_id) NOT NULL,
  linked_to uuid,
  tagger text REFERENCES person(person_id) NOT NULL, -- the person who created the tag
  validator text, -- the person who validated the tag
  geometry geometry(MULTIPOLYGON) NOT NULL,
  created timestamp DEFAULT now() NOT NULL, -- time of tag creation
  UNIQUE (image_tag_id, tagger, validator),
  UNIQUE (image_stack_id, geometry, tag_id),
  FOREIGN KEY (linked_to, tagger, validator)
  REFERENCES image_tag(image_tag_id, tagger, validator)
);

/* Additional partial UNIQUE index to constrain uniqueness
   when validator is not yet set */
CREATE UNIQUE INDEX image_tag_unvalidated_unique
ON image_tag (image_tag_id, tagger, coalesce(validator, 'none'));

INSERT INTO person (person_id, name) VALUES
('COSMOS','COSMOS')
ON CONFLICT DO NOTHING;

/* Convert a geometry to an array of bounding boxes
   expressed as [xmin, ymin, xmax, ymax] */
CREATE OR REPLACE FUNCTION bbox_array(geometry)
RETURNS numeric[4][] AS $$
SELECT array_agg(
  ARRAY[
    ST_XMin(b),
    ST_YMin(b),
    ST_XMax(b),
    ST_YMax(b)
  ]::numeric[])
FROM (
  SELECT Box2D(
    (ST_Dump($1)).geom
  ) AS b
) AS c
$$ LANGUAGE sql;

INSERT INTO tag (tag_id, name, description, color) VALUES
(1, 'Body Text', 'The primary text of an article', '#aaaaaa'),
(2, 'Figure', 'A chart, graph, or other graphical display', '#a15231'),
(3, 'Figure Note', 'A footnote explanation of specific content in a figure', '#801515'),
(4, 'Figure Caption', 'A text description associated with an entire figure', '#c45778'),
(5, 'Table', 'A tabular representation of information', '#432F75'),
(6, 'Table Note', 'A footnote to explain a subset of table content', '#162c57'),
(7, 'Table Caption', 'A text description associated with an entire table', '#73548f'),
(8, 'Page Header', 'Document-wide summary information, including page no., at top of page', '#2a7534'),
(9, 'Page Footer', 'Document-wide summary information, including page no., at bottom of page', '#345455'),
(10, 'Section Header', 'Text identifying section within text of document', '#1aa778'),
(11, 'Equation', 'An equation', '#2C4770'),
(12, 'Equation label', 'An identifier for an equation', '#4D658D'),
(13, 'Abstract', 'Abstract of paper', '#D4A26A'),
(14, 'Reference text', 'References to other works', '#804D15'),
(15, 'Other', 'Textual metadata and image content that is not semantically meaningful', '#96990c'),
(16, 'Equation definition', 'An equation definition', '#23477e'),
(17, 'Symbol', 'A symbol', '#4c2c70'),
(18, 'Symbol definition', 'A symbol definition', '#ff0000')
ON CONFLICT DO NOTHING;
