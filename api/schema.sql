/*
This bootstrap script only runs on cluster creation but we might want it to run
every time we start up the worker, just in case we make schema additions, etc.
 */

CREATE TABLE IF NOT EXISTS stack_type (
  id text PRIMARY KEY
);

INSERT INTO stack_type (id) VALUES (
  ('prediction','annotation')
) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS stack (
  stack_id text PRIMARY KEY,
  stack_type text REFERENCES stack_type(id) NOT NULL
);

CREATE TABLE IF NOT EXISTS image_stack (
  image_stack_id serial PRIMARY KEY,
  image_id text REFERENCES image(image_id) NOT NULL,
  stack_id text REFERENCES stack(stack_id) NOT NULL,
  UNIQUE (image_id, stack_id)
)

CREATE TABLE IF NOT EXISTS image (
  image_id text PRIMARY KEY,
  doc_id text,
  page_no integer,
  height integer,
  width integer,
  file_path text,
  tag_start timestamp, -- the time tagging began
  created timestamp DEFAULT now(),
  UNIQUE (doc_id, page_no)
);

CREATE TABLE IF NOT EXISTS person (
  person_id text PRIMARY KEY,
  name text,
  tagger boolean DEFAULT TRUE,
  validator boolean DEFAULT FALSE,
  created timestamp DEFAULT now()
);

/* Should refactor to be the same table as the "images" table with
   a flag instead of a separate table? */
CREATE TABLE IF NOT EXISTS image_prediction (
  image_id text PRIMARY KEY,
  doc_id text,
  page_no integer,
  stack text,
  height integer,
  width integer,
  file_path text,
  tag_start timestamp, -- the time tagging began
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
  image_tag_id text, -- unique image/tag/user hash
  image_stack_id integer REFERENCES image_stack(image_stack_id),
  tag_id integer REFERENCES tag(tag_id),
  tagger text REFERENCES person(person_id), -- the person who created the tag
  validator text, -- the person who validated the tag
  x integer,
  y integer,
  width integer,
  height integer,
  created timestamp DEFAULT now() -- time of tag creation
);

/* Again, should refactor? */
CREATE TABLE IF NOT EXISTS image_tag_prediction (
  image_tag_id text, -- unique image/tag/user hash
  image_id text REFERENCES image_prediction(image_id),
  tag_id integer REFERENCES tag(tag_id),
  tagger text REFERENCES person(person_id), -- the person who created the tag
  validator text REFERENCES person(person_id), -- the person who validated the tag
  x integer,
  y integer,
  width integer,
  height integer,
  created timestamp DEFAULT now() -- time of tag creation
);

INSERT INTO person (person_id, name) VALUES
('dummy','Dummy')
ON CONFLICT DO NOTHING;
