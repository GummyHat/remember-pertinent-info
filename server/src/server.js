const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
    // Get all subjects
    const subjectsResult = await pool.query('SELECT * FROM subjects ORDER BY code');

    // For each subject, get courses with their sections and timeslots
    const groupedData = [];

    for (const subject of subjectsResult.rows) {
      const coursesResult = await pool.query(`
        SELECT
          c.id,
          c.course_id,
          c.crse,
          c.subj,
          c.title
        FROM courses c
        WHERE c.subject_id = $1
        ORDER BY c.crse
      `, [subject.id]);

      const courses = [];

      for (const course of coursesResult.rows) {
        // Get sections for this course
        const sectionsResult = await pool.query(`
          SELECT
            s.id,
            s.crn,
            s.sec,
            s.act,
            s.attribute,
            s.cap,
            s.cred_max,
            s.cred_min,
            s.rem,
            s.title
          FROM sections s
          WHERE s.course_id = $1
          ORDER BY s.sec
        `, [course.id]);

        const sections = [];

        for (const section of sectionsResult.rows) {
          // Get timeslots for this section
          const timeslotsResult = await pool.query(`
            SELECT
              t.id,
              t.date_start,
              t.date_end,
              t.days,
              t.instructor,
              t.location,
              t.time_start,
              t.time_end
            FROM timeslots t
            WHERE t.section_id = $1
          `, [section.id]);

          sections.push({
            ...section,
            timeslots: timeslotsResult.rows.map(t => ({
              dateStart: t.date_start,
              dateEnd: t.date_end,
              days: t.days || [],
              instructor: t.instructor,
              location: t.location,
              timeStart: t.time_start,
              timeEnd: t.time_end
            }))
          });
        }

        if (sections.length > 0) {
          courses.push({
            id: course.course_id,
            title: course.title,
            subj: course.subj,
            crse: course.crse,
            sections: sections
          });
        }
      }

      if (courses.length > 0) {
        groupedData.push({
          code: subject.code,
          name: subject.name,
          courses: courses
        });
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

    const courseResult = await pool.query(`
      SELECT
        c.id,
        c.course_id,
        c.crse,
        c.subj,
        c.title,
        s.name as subject_name
      FROM courses c
      JOIN subjects s ON c.subject_id = s.id
      WHERE c.course_id = $1
    `, [courseId]);

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];

    // Get sections with timeslots
    const sectionsResult = await pool.query(`
      SELECT
        s.id,
        s.crn,
        s.sec,
        s.act,
        s.attribute,
        s.cap,
        s.cred_max,
        s.cred_min,
        s.rem,
        s.title
      FROM sections s
      WHERE s.course_id = $1
      ORDER BY s.sec
    `, [course.id]);

    const sections = [];
    for (const section of sectionsResult.rows) {
      const timeslotsResult = await pool.query(`
        SELECT * FROM timeslots WHERE section_id = $1
      `, [section.id]);

      sections.push({
        ...section,
        timeslots: timeslotsResult.rows
      });
    }

    res.json({
      ...course,
      sections
    });
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
    const maxDepth = parseInt(req.query.maxDepth) || 5;

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
          const subtree = await buildTree(prereqId, depth, new Set(visited));
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

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
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
      LIMIT 50
    `, [`%${q}%`]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error searching courses:', err);
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
