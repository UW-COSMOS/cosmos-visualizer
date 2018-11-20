CREATE TABLE images (
  image_id text primary key,
  doc_id text,
  page_no integer,
  stack text,
  height integer,
  width integer,
  file_path text,
  tag_start datetime, -- the time tagging began
  created datetime default current_timestamp
);

CREATE TABLE tags (
  tag_id integer primary key,
  name text,
  description text,
  color text,
  created datetime default current_timestamp
);

INSERT INTO tags (tag_id, name, description) VALUES (1, 'Figure', 'A chart, graph, or other graphical display');
INSERT INTO tags (tag_id, name, description) VALUES (2, 'Caption', 'A text description associated with a figure or table');
INSERT INTO tags (tag_id, name, description) VALUES (3, 'Table', 'A tabular graphic of data');
INSERT INTO tags (tag_id, name, description) VALUES (4, 'Bibliography', '');
INSERT INTO tags (tag_id, name, description) VALUES (5, 'Reference', 'A citation');
INSERT INTO tags (tag_id, name, description) VALUES (6, 'Equation', 'An equation');


CREATE TABLE image_tags (
  image_id text,
  tag_id text,
  x_min integer,
  y_min integer,
  x_max integer,
  y_max integer,
  tagger text, -- the person who created the tag
  validator text, -- the person who validated the tag
  created datetime default current_timestamp, -- time of tag creation
  validated datetime, -- time of tag validation
  is_valid boolean
);
