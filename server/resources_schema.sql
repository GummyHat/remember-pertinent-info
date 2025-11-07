-- Course Resources Table
-- Stores metadata for files uploaded to courses
CREATE TABLE IF NOT EXISTS course_resources (
  id SERIAL PRIMARY KEY,
  course_id TEXT NOT NULL, -- Course ID (e.g., "CSCI-1200") - not enforced as FK since courses come from QUACS
  title TEXT NOT NULL, -- Display name of the resource
  description TEXT, -- Optional description of the resource
  filename TEXT NOT NULL, -- Original filename
  file_path TEXT NOT NULL, -- Server path to the stored file
  file_type TEXT, -- MIME type (e.g., "application/pdf", "image/png")
  file_size BIGINT, -- File size in bytes
  resource_type TEXT, -- Category: 'slides', 'assignment', 'syllabus', 'reading', 'other'
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploader_name TEXT, -- Optional: name of person who uploaded (for now)
  uploader_id INT, -- Foreign key to users table (NULL for now, add later with authentication)
  is_visible BOOLEAN DEFAULT true -- Allow hiding resources without deleting
  -- NOTE: No foreign key constraint on course_id since courses are loaded from QUACS GitHub, not stored in DB
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_resources_course_id ON course_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_resources_resource_type ON course_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_at ON course_resources(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_visible ON course_resources(is_visible);

-- View to get resources (simplified - no join to courses since they're from QUACS)
CREATE OR REPLACE VIEW course_resources_view AS
SELECT
  cr.id,
  cr.course_id,
  cr.title as resource_title,
  cr.description,
  cr.filename,
  cr.file_type,
  cr.file_size,
  cr.resource_type,
  cr.uploaded_at,
  cr.uploader_name,
  cr.is_visible
FROM course_resources cr
WHERE cr.is_visible = true;

-- Add comment for documentation
COMMENT ON TABLE course_resources IS 'Stores metadata for course resource files (PDFs, slides, etc.). Files are stored in the filesystem, with paths stored here.';
COMMENT ON COLUMN course_resources.uploader_id IS 'Will be used after authentication is implemented. Currently NULL for all records.';
