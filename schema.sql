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
