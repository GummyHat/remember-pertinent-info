-- Add prerequisites table to store prerequisite relationships
CREATE TABLE IF NOT EXISTS prerequisites (
  id SERIAL PRIMARY KEY,
  section_crn INT UNIQUE, -- The CRN this prerequisite belongs to
  prereq_data JSONB NOT NULL, -- Store the full prerequisite structure as JSON
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add catalog_data to courses table for descriptions
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'SIS';

-- Add school/department hierarchy
CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  school_id INT REFERENCES schools(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(code)
);

-- Link subjects to departments
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS department_id INT REFERENCES departments(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prerequisites_crn ON prerequisites(section_crn);
CREATE INDEX IF NOT EXISTS idx_courses_course_id ON courses(course_id);
CREATE INDEX IF NOT EXISTS idx_sections_crn ON sections(crn);

-- Create a view for easier querying of course prerequisites
CREATE OR REPLACE VIEW course_prerequisites AS
SELECT
  c.course_id,
  c.title,
  c.subj,
  c.crse,
  s.crn,
  p.prereq_data
FROM courses c
JOIN sections s ON c.id = s.course_id
LEFT JOIN prerequisites p ON s.crn = p.section_crn;

-- Function to get all prerequisites for a course (recursive)
CREATE OR REPLACE FUNCTION get_course_tree(course_code TEXT)
RETURNS TABLE(
  level INT,
  course_id TEXT,
  title TEXT,
  prereq_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE prereq_tree AS (
    -- Base case: the course itself
    SELECT
      0 as level,
      c.course_id,
      c.title,
      'root'::TEXT as prereq_type
    FROM courses c
    WHERE c.course_id = course_code

    UNION ALL

    -- Recursive case: find prerequisites
    -- Note: This is simplified; actual implementation would need to parse JSONB
    SELECT
      pt.level + 1,
      c.course_id,
      c.title,
      'prerequisite'::TEXT
    FROM prereq_tree pt
    JOIN sections s ON s.course_id = (SELECT id FROM courses WHERE course_id = pt.course_id)
    JOIN prerequisites p ON p.section_crn = s.crn
    JOIN courses c ON c.course_id = jsonb_extract_path_text(p.prereq_data, 'prerequisites', 'course')
    WHERE pt.level < 10 -- Prevent infinite loops
  )
  SELECT * FROM prereq_tree;
END;
$$ LANGUAGE plpgsql;
