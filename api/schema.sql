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
  created timestamp DEFAULT now()
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
  FOREIGN KEY (linked_to, tagger, validator)
  REFERENCES image_tag(image_tag_id, tagger, validator)
);

/* Additional partial UNIQUE index to constrain uniqueness
   when validator is not yet set */
CREATE UNIQUE INDEX image_tag_unvalidated_unique
ON image_tag (image_tag_id, tagger)
WHERE validator IS NULL;

INSERT INTO person (person_id, name) VALUES
('dummy','Dummy')
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

