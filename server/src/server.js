const express = require('express');
const cors = require('cors');
const pool = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs'); // For createReadStream
require('dotenv').config();

// Constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_QUERY_LENGTH = 100;
const MIN_QUERY_LENGTH = 2;
const MAX_SEARCH_RESULTS = 50;
const MAX_PREREQ_DEPTH = 10;
const DEFAULT_PREREQ_DEPTH = 5;
const ALLOWED_RESOURCE_TYPES = ['slides', 'assignment', 'syllabus', 'reading', 'other'];

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Configure CORS - restrict origins in production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit request body size

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const courseId = req.params.courseId;
    const courseDir = path.join(uploadsDir, courseId);

    try {
      await fs.mkdir(courseDir, { recursive: true });
      cb(null, courseDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now - can restrict later if needed
    // TODO: Add whitelist of allowed MIME types before production
    cb(null, true);
  }
});

// Helper Functions

/**
 * Sanitize filename for Content-Disposition header
 * Prevents header injection attacks
 */
function sanitizeFilename(filename) {
  // Remove or replace dangerous characters
  return filename
    .replace(/[^\w\s\-\.]/g, '_') // Replace special chars with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .substring(0, 255); // Limit length
}

/**
 * Validate resource type against allowed list
 */
function isValidResourceType(type) {
  return ALLOWED_RESOURCE_TYPES.includes(type);
}

// API Routes

// Get all subjects
app.get('/api/subjects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subjects ORDER BY code');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all courses with subject information
app.get('/api/courses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.course_id,
        c.crse,
        c.subj,
        c.title,
        s.name as subject_name,
        s.code as subject_code
      FROM courses c
      JOIN subjects s ON c.subject_id = s.id
      ORDER BY c.subj, c.crse
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get courses grouped by subject (for the format the frontend expects)
app.get('/api/courses/grouped', async (req, res) => {
  try {
    // Fetch all data in a single query using JOINs - much more efficient!
    const result = await pool.query(`
      SELECT
        sub.id as subject_id,
        sub.code as subject_code,
        sub.name as subject_name,
        c.id as course_db_id,
        c.course_id,
        c.crse,
        c.subj,
        c.title as course_title,
        s.id as section_id,
        s.crn,
        s.sec,
        s.act,
        s.attribute,
        s.cap,
        s.cred_max,
        s.cred_min,
        s.rem,
        s.title as section_title,
        t.id as timeslot_id,
        t.date_start,
        t.date_end,
        t.days,
        t.instructor,
        t.location,
        t.time_start,
        t.time_end
      FROM subjects sub
      LEFT JOIN courses c ON c.subject_id = sub.id
      LEFT JOIN sections s ON s.course_id = c.id
      LEFT JOIN timeslots t ON t.section_id = s.id
      ORDER BY sub.code, c.crse, s.sec
    `);

    // Group the flat result into the nested structure
    const groupedData = [];
    const subjectMap = new Map();
    const courseMap = new Map();
    const sectionMap = new Map();

    for (const row of result.rows) {
      // Skip rows with no course data
      if (!row.course_id) continue;

      // Get or create subject
      let subject = subjectMap.get(row.subject_id);
      if (!subject) {
        subject = {
          code: row.subject_code,
          name: row.subject_name,
          courses: []
        };
        subjectMap.set(row.subject_id, subject);
        groupedData.push(subject);
      }

      // Get or create course
      let course = courseMap.get(row.course_db_id);
      if (!course) {
        course = {
          id: row.course_id,
          title: row.course_title,
          subj: row.subj,
          crse: row.crse,
          sections: []
        };
        courseMap.set(row.course_db_id, course);
        subject.courses.push(course);
      }

      // Get or create section
      if (row.section_id) {
        let section = sectionMap.get(row.section_id);
        if (!section) {
          section = {
            id: row.section_id,
            crn: row.crn,
            sec: row.sec,
            act: row.act,
            attribute: row.attribute,
            cap: row.cap,
            cred_max: row.cred_max,
            cred_min: row.cred_min,
            rem: row.rem,
            title: row.section_title,
            timeslots: []
          };
          sectionMap.set(row.section_id, section);
          course.sections.push(section);
        }

        // Add timeslot if exists
        if (row.timeslot_id) {
          section.timeslots.push({
            dateStart: row.date_start,
            dateEnd: row.date_end,
            days: row.days || [],
            instructor: row.instructor,
            location: row.location,
            timeStart: row.time_start,
            timeEnd: row.time_end
          });
        }
      }
    }

    res.json(groupedData);
  } catch (err) {
    console.error('Error fetching grouped courses:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single course by ID with all details
app.get('/api/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Fetch course, sections, and timeslots in a single query
    const result = await pool.query(`
      SELECT
        c.id,
        c.course_id,
        c.crse,
        c.subj,
        c.title,
        sub.name as subject_name,
        s.id as section_id,
        s.crn,
        s.sec,
        s.act,
        s.attribute,
        s.cap,
        s.cred_max,
        s.cred_min,
        s.rem,
        s.title as section_title,
        t.id as timeslot_id,
        t.date_start,
        t.date_end,
        t.days,
        t.instructor,
        t.location,
        t.time_start,
        t.time_end
      FROM courses c
      JOIN subjects sub ON c.subject_id = sub.id
      LEFT JOIN sections s ON s.course_id = c.id
      LEFT JOIN timeslots t ON t.section_id = s.id
      WHERE c.course_id = $1
      ORDER BY s.sec
    `, [courseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Build the response structure
    const firstRow = result.rows[0];
    const course = {
      id: firstRow.id,
      course_id: firstRow.course_id,
      crse: firstRow.crse,
      subj: firstRow.subj,
      title: firstRow.title,
      subject_name: firstRow.subject_name,
      sections: []
    };

    // Group sections and timeslots
    const sectionMap = new Map();
    for (const row of result.rows) {
      if (row.section_id) {
        let section = sectionMap.get(row.section_id);
        if (!section) {
          section = {
            id: row.section_id,
            crn: row.crn,
            sec: row.sec,
            act: row.act,
            attribute: row.attribute,
            cap: row.cap,
            cred_max: row.cred_max,
            cred_min: row.cred_min,
            rem: row.rem,
            title: row.section_title,
            timeslots: []
          };
          sectionMap.set(row.section_id, section);
          course.sections.push(section);
        }

        // Add timeslot if exists
        if (row.timeslot_id) {
          section.timeslots.push({
            id: row.timeslot_id,
            date_start: row.date_start,
            date_end: row.date_end,
            days: row.days,
            instructor: row.instructor,
            location: row.location,
            time_start: row.time_start,
            time_end: row.time_end
          });
        }
      }
    }

    res.json(course);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get prerequisite tree for a specific course
app.get('/api/courses/:courseId/prerequisites', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get all sections for this course with their prerequisites
    const result = await pool.query(`
      SELECT
        c.course_id,
        c.title,
        c.description,
        s.crn,
        p.prereq_data
      FROM courses c
      JOIN sections s ON c.id = s.course_id
      LEFT JOIN prerequisites p ON s.crn = p.section_crn
      WHERE c.course_id = $1
      LIMIT 1
    `, [courseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = result.rows[0];
    res.json({
      courseId: course.course_id,
      title: course.title,
      description: course.description,
      prerequisites: course.prereq_data || null
    });
  } catch (err) {
    console.error('Error fetching prerequisites:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Build prerequisite tree recursively
app.get('/api/prerequisite-tree/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate and sanitize maxDepth parameter
    let maxDepth = parseInt(req.query.maxDepth) || DEFAULT_PREREQ_DEPTH;
    if (isNaN(maxDepth) || maxDepth < 1) {
      maxDepth = DEFAULT_PREREQ_DEPTH;
    }
    // Cap maximum depth to prevent excessive recursion
    maxDepth = Math.min(maxDepth, MAX_PREREQ_DEPTH);

    async function buildTree(course_id, depth = 0, visited = new Set()) {
      if (depth > maxDepth || visited.has(course_id)) {
        return null;
      }

      visited.add(course_id);

      // Get course info and prerequisites
      const result = await pool.query(`
        SELECT
          c.course_id,
          c.title,
          c.description,
          c.subj,
          c.crse,
          s.crn,
          p.prereq_data
        FROM courses c
        LEFT JOIN sections s ON c.id = s.course_id
        LEFT JOIN prerequisites p ON s.crn = p.section_crn
        WHERE c.course_id = $1
        LIMIT 1
      `, [course_id]);

      if (result.rows.length === 0) {
        return null;
      }

      const course = result.rows[0];
      const node = {
        id: course.course_id,
        title: course.title,
        description: course.description,
        subj: course.subj,
        crse: course.crse,
        depth: depth,
        prerequisites: []
      };

      // Parse and build prerequisite subtrees
      if (course.prereq_data) {
        const prereqs = await parsePrerequisites(course.prereq_data, depth + 1, visited);
        node.prerequisites = prereqs;
      }

      return node;
    }

    async function parsePrerequisites(prereqData, depth, visited) {
      if (!prereqData || typeof prereqData !== 'object') {
        return [];
      }

      const prereqs = [];

      // Handle direct course prerequisite
      if (prereqData.type === 'course' && prereqData.course) {
        const courseParts = prereqData.course.split(' ');
        if (courseParts.length >= 2) {
          const prereqId = `${courseParts[0]}-${courseParts[1]}`;
          // Pass the same visited set to avoid memory issues
          const subtree = await buildTree(prereqId, depth, visited);
          if (subtree) {
            subtree.relationship = 'required';
            subtree.minGrade = prereqData.min_grade || 'D';
            prereqs.push(subtree);
          }
        }
      }

      // Handle nested prerequisites (AND/OR)
      if (prereqData.nested && Array.isArray(prereqData.nested)) {
        for (const item of prereqData.nested) {
          const subPrereqs = await parsePrerequisites(item, depth, visited);
          prereqs.push(...subPrereqs.map(p => ({
            ...p,
            relationship: prereqData.type || 'and'
          })));
        }
      }

      return prereqs;
    }

    const tree = await buildTree(courseId);

    if (!tree) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(tree);
  } catch (err) {
    console.error('Error building prerequisite tree:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all courses that have a specific course as a prerequisite (reverse lookup)
app.get('/api/courses/:courseId/dependents', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Search for courses that have this course in their prerequisites
    const result = await pool.query(`
      SELECT
        c.course_id,
        c.title,
        c.subj,
        c.crse,
        p.prereq_data
      FROM courses c
      JOIN sections s ON c.id = s.course_id
      JOIN prerequisites p ON s.crn = p.section_crn
      WHERE p.prereq_data::text LIKE $1
    `, [`%${courseId.replace('-', ' ')}%`]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching dependent courses:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search courses by name or code
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < MIN_QUERY_LENGTH) {
      return res.status(400).json({ error: `Query must be at least ${MIN_QUERY_LENGTH} characters` });
    }

    // Validate query length to prevent DoS
    if (q.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({ error: `Query too long (max ${MAX_QUERY_LENGTH} characters)` });
    }

    const result = await pool.query(`
      SELECT
        c.course_id,
        c.title,
        c.subj,
        c.crse,
        c.description,
        s.code as subject_code
      FROM courses c
      JOIN subjects s ON c.subject_id = s.id
      WHERE
        c.course_id ILIKE $1 OR
        c.title ILIKE $1 OR
        c.description ILIKE $1
      ORDER BY c.subj, c.crse
      LIMIT $2
    `, [`%${q}%`, MAX_SEARCH_RESULTS]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error searching courses:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== COURSE RESOURCES ENDPOINTS =====

// Upload a resource to a course
app.post('/api/courses/:courseId/resources', upload.single('file'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, resourceType, uploaderName } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Resource title is required' });
    }

    // Validate course ID format (e.g., "CSCI-1200")
    const courseIdPattern = /^[A-Z]{3,4}-\d{4}$/;
    if (!courseIdPattern.test(courseId)) {
      // Clean up uploaded file if course ID is invalid
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({ error: 'Invalid course ID format. Expected format: SUBJ-1234' });
    }

    // Note: We skip database validation since courses are loaded from QUACS GitHub
    // and not stored in the database. This will be updated when authentication is added.

    // Validate resource type
    const validatedResourceType = resourceType && isValidResourceType(resourceType) ? resourceType : 'other';

    // Insert resource metadata into database
    const result = await pool.query(`
      INSERT INTO course_resources
        (course_id, title, description, filename, file_path, file_type, file_size, resource_type, uploader_name)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      courseId,
      title,
      description || null,
      req.file.originalname,
      req.file.path,
      req.file.mimetype,
      req.file.size,
      validatedResourceType,
      uploaderName || 'Anonymous'
    ]);

    res.status(201).json({
      message: 'Resource uploaded successfully',
      resource: result.rows[0]
    });
  } catch (err) {
    console.error('Error uploading resource:', err);
    // Try to clean up the uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all resources for a course
app.get('/api/courses/:courseId/resources', async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query(`
      SELECT
        id,
        course_id,
        title,
        description,
        filename,
        file_type,
        file_size,
        resource_type,
        uploaded_at,
        uploader_name
      FROM course_resources
      WHERE course_id = $1 AND is_visible = true
      ORDER BY uploaded_at DESC
    `, [courseId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download a specific resource
app.get('/api/resources/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is numeric
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }

    const result = await pool.query(
      'SELECT * FROM course_resources WHERE id = $1 AND is_visible = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const resource = result.rows[0];

    // Check if file exists
    try {
      await fs.access(resource.file_path);
    } catch {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Sanitize filename to prevent header injection attacks
    const safeFilename = sanitizeFilename(resource.filename);

    // Set headers for file download using RFC 5987 encoding
    res.setHeader('Content-Type', resource.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

    // Stream the file to the response with error handling
    const fileStream = fsSync.createReadStream(resource.file_path);

    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });

    fileStream.pipe(res);
  } catch (err) {
    console.error('Error downloading resource:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete a resource
app.delete('/api/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is numeric
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }

    // TODO: Add authentication check before allowing deletes
    // For now, anyone can delete (for testing phase)

    const result = await pool.query(
      'SELECT * FROM course_resources WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const resource = result.rows[0];

    // Delete the file from filesystem
    try {
      await fs.unlink(resource.file_path);
    } catch (err) {
      console.warn('Could not delete file:', err);
      // Continue with database deletion even if file doesn't exist
    }

    // Delete from database
    await pool.query('DELETE FROM course_resources WHERE id = $1', [id]);

    res.json({ message: 'Resource deleted successfully' });
  } catch (err) {
    console.error('Error deleting resource:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
