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
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN || 'http://localhost:8000')
    : '*', // Allow all origins in development only
  optionsSuccessStatus: 200,
  credentials: true // Allow cookies when auth is implemented
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit request body size

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../client/public')));

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
// NOTE: These endpoints are deprecated - courses are loaded from QUACS GitHub
// Keeping for backwards compatibility but will return empty results
app.get('/api/subjects', async (req, res) => {
  // Subjects are loaded from QUACS, not from database
  res.json([]);
});

// Get all courses with subject information
// NOTE: Deprecated - courses are loaded from QUACS GitHub
app.get('/api/courses', async (req, res) => {
  // Courses are loaded from QUACS, not from database
  res.json([]);
});

// Get courses grouped by subject (for the format the frontend expects)
// NOTE: Deprecated - courses are loaded from QUACS GitHub
app.get('/api/courses/grouped', async (req, res) => {
  // Courses are loaded from QUACS, not from database
  res.json([]);
});

// NOTE: All course data endpoints removed - courses are loaded from QUACS GitHub directly by frontend

// NOTE: Prerequisites are loaded from QUACS GitHub directly by frontend

// NOTE: All course-related database endpoints removed - courses, prerequisites, and search are handled by frontend using QUACS data

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

// Preview a resource (for PDFs and images)
app.get('/api/resources/:id/preview', async (req, res) => {
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

    // Only allow preview for certain file types
    const previewableTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json'];

    if (!previewableTypes.includes(resource.file_type)) {
      return res.status(400).json({ error: 'File type not previewable' });
    }

    // Sanitize filename to prevent header injection attacks
    const safeFilename = sanitizeFilename(resource.filename);

    // Set headers for inline viewing (not download)
    res.setHeader('Content-Type', resource.file_type);
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);

    // Add cache headers for better performance
    res.setHeader('Cache-Control', 'public, max-age=3600');

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
    console.error('Error previewing resource:', err);
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
