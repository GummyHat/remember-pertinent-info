-- DEPRECATED, CURRENTLY UTILIZING LIVE GITHUB DATA INSTEAD OF SEPARATE SERVER

CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, --"ADMN"
  name TEXT NOT NULL --"Administrative Courses"
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE, 
  crse INT, -- 1030
  course_id TEXT UNIQUE, -- "ADMN-1030"
  subj TEXT, --"ADMN"
  title TEXT --"Arch Exp & Plan Architecture"
);

CREATE TABLE sections (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  crn INT UNIQUE, --Course registration number
  sec TEXT, -- "01", not sure why this is a string but hey this is what we get for working with quacs data
  act INT, -- Don't know what this is but it is a field within sections
  attribute TEXT, -- "Communication Intensive"
  cap INT, --max seats
  cred_max NUMERIC,
  cred_min NUMERIC,
  rem INT, --remaining seats
  title TEXT
);

CREATE TABLE timeslots (
  id SERIAL PRIMARY KEY,
  section_id INT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  date_start TEXT, -- course start date
  date_end TEXT, -- course end date
  days TEXT[], -- array of day codes, like ["M","T","W","R","F"]
  instructor TEXT,
  location TEXT,
  time_start INT,
  time_end INT,
  raw JSONB -- store original object for testing
);

CREATE INDEX ON courses(catalog_id);
CREATE INDEX ON sections(course_id);
CREATE INDEX ON timeslots(section_id);
