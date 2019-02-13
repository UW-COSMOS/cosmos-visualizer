/*
This bootstrap script only runs on cluster creation but we might want it to run
every time we start up the worker, just in case we make schema additions, etc.
 */

CREATE TABLE image (
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

CREATE TABLE person (
  person_id text PRIMARY KEY,
  name text,
  tagger boolean DEFAULT TRUE,
  validator boolean DEFAULT FALSE,
  created timestamp DEFAULT now()
);

/* Should refactor to be the same table as the "images" table with
   a flag instead of a separate table? */
CREATE TABLE image_prediction (
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

CREATE TABLE tag (
  tag_id integer PRIMARY KEY,
  name text,
  description text,
  color text,
  created timestamp DEFAULT now()
);

CREATE TABLE image_tag (
  image_tag_id text, -- unique image/tag/user hash
  image_id text REFERENCES image(image_id),
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
CREATE TABLE image_tag_prediction (
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

