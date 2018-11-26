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
INSERT INTO tags (tag_id, name, description) VALUES (2, 'Figure Legend', 'A graphical and text explanation of symbology in a figure');
INSERT INTO tags (tag_id, name, description) VALUES (3, 'Figure Caption', 'A text description associated with an entire figure');
INSERT INTO tags (tag_id, name, description) VALUES (4, 'Table', 'A tabular representation of information');
INSERT INTO tags (tag_id, name, description) VALUES (5, 'Table Note', 'A footnote to explain subset of table content');
INSERT INTO tags (tag_id, name, description) VALUES (6, 'Table Caption', 'A text description associated with an entire table');
INSERT INTO tags (tag_id, name, description) VALUES (7, 'Page Header', 'Document-wide summary information, including page no., at top of page');
INSERT INTO tags (tag_id, name, description) VALUES (8, 'Page Footer', 'Document-wide summary information, including page no., at bottom of page');
INSERT INTO tags (tag_id, name, description) VALUES (9, 'Section Header', 'Text identifying section within text of document');
INSERT INTO tags (tag_id, name, description) VALUES (10, 'Equation', 'An equation');
INSERT INTO tags (tag_id, name, description) VALUES (11, 'Body Text', 'The primary text of an article');

CREATE TABLE image_tags (
  image_tag_id text, -- unique image/tag/user hash
  image_id text,
  tag_id integer,
  tagger text, -- the person who created the tag
  validator text, -- the person who validated the tag
  x integer,
  y integer,
  width integer,
  height integer,
  created datetime default current_timestamp -- time of tag creation
);

CREATE TABLE people (
  person_id text primary key,
  name text,
  tagger boolean default TRUE,
  validator boolean default FALSE,
  created datetime default current_timestamp
);

INSERT INTO people (person_id, name, tagger, validator) VALUES ('daven', 'Daven', TRUE, TRUE);
