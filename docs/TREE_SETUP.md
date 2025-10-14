# Course Prerequisite Tree Setup Guide

This guide explains how to set up and use the course prerequisite tree visualization feature.

## Overview

The prerequisite tree feature allows users to:
- Search for any course by code or name
- View a visual tree of all prerequisites
- Navigate through prerequisite chains
- Click on courses to see details and study materials (coming soon)
- Understand course requirements at a glance

## Data Structure

The system uses real course data from the `temp/` folder:
- `courses.json` - Course sections and scheduling info (5,808 courses)
- `catalog.json` - Course descriptions and metadata
- `prerequisites.json` - Prerequisite relationships by CRN
- `schools.json` - School and department hierarchy

## Setup Instructions

### 1. Apply Database Schema Updates

First, apply the schema updates to support prerequisites:

```bash
psql -U postgres -d remember_pertinent_info -f update_schema.sql
```

This adds:
- `prerequisites` table for storing prerequisite data
- `schools` and `departments` tables for hierarchy
- `description` field to courses
- Indexes for better performance

### 2. Import Real Course Data

Run the import script to load all the data from the temp folder:

```bash
cd server
node src/import-data.js
```

This will import:
- 43 departments across multiple schools
- 5,808 courses with descriptions
- All course sections and timeslots
- Prerequisites for courses that have them

The import takes a few minutes. You'll see progress output like:
```
Starting data import...
Importing schools...
Imported 5 schools and their departments.
Importing subjects...
Imported 43 subjects.
Importing courses...
Imported 5808 courses.
...
```

### 3. Start the Backend Server

The server now has additional endpoints for prerequisites:

```bash
npm start
```

New endpoints available:
- `GET /api/prerequisite-tree/:courseId` - Get full prerequisite tree
- `GET /api/courses/:courseId/prerequisites` - Get direct prerequisites
- `GET /api/courses/:courseId/dependents` - Get courses that require this one
- `GET /api/search?q=query` - Search courses by code, name, or description

### 4. Access the Tree View

Open your browser to:
```
http://localhost:8000/tree.html
```

## Using the Prerequisite Tree

### Searching for Courses

1. Type in the search box (minimum 2 characters)
2. Results appear in real-time
3. Click on a course to load its prerequisite tree

Examples to try:
- `CSCI-1200` - Data Structures
- `MATH-2400` - Differential Equations
- `PHYS-1200` - Physics II
- `Database` - Search by course name

### Understanding the Tree

The tree displays:
- **Root node** (top) - The course you searched for (highlighted in blue)
- **Child nodes** - Direct prerequisites
- **Grandchildren** - Prerequisites of prerequisites (recursive)

Each node shows:
- Course code (e.g., CSCI-1100)
- Course title
- Minimum required grade (if applicable)
- Relationship type (AND/OR for complex prerequisites)

### Relationship Types

- **AND** (green badge) - All courses in this group are required
- **OR** (orange badge) - Any one course from this group satisfies the requirement
- **Required** - This specific course is required

### Course Details Modal

Click any course node to see:
- Full course description
- Available sections and instructors
- Placeholder for topics and study materials (coming soon)
- Button to view that course's prerequisite tree

## Understanding Prerequisites Structure

Prerequisites can be simple or complex:

### Simple Prerequisites
```
CSCI-1200 requires CSCI-1100 (min grade D)
```

### Complex Prerequisites (AND)
```
ECSE-2660 requires:
  - CSCI-1200 (min grade D) AND
  - MATH-1020 (min grade D)
```

### Complex Prerequisites (OR)
```
Some courses require:
  - PHYS-1100 OR PHYS-1110 OR PHYS-1150
```

### Nested Prerequisites (AND of ORs)
```
A course might require:
  - (PHYS-1100 OR PHYS-1110) AND
  - MATH-1020
```

The tree visualization handles all these cases automatically.

## Data Statistics

After import, your database will contain:
- **5 schools** (Engineering, Science, HASS, Management, Architecture)
- **43 departments** (CSCI, MATH, PHYS, ECSE, etc.)
- **5,808 unique courses** with full descriptions
- **Thousands of sections** with schedules and instructors
- **Prerequisites** for hundreds of courses

## API Examples

### Get prerequisite tree for a course
```bash
curl http://localhost:3001/api/prerequisite-tree/CSCI-1200
```

Response includes nested structure:
```json
{
  "id": "CSCI-1200",
  "title": "Data Structures",
  "description": "...",
  "depth": 0,
  "prerequisites": [
    {
      "id": "CSCI-1100",
      "title": "Computer Science I",
      "relationship": "required",
      "minGrade": "D",
      "prerequisites": []
    }
  ]
}
```

### Search for courses
```bash
curl "http://localhost:3001/api/search?q=calculus"
```

### Get courses that depend on MATH-1010
```bash
curl http://localhost:3001/api/courses/MATH-1010/dependents
```

## Next Steps

### Adding Course Topics and Study Materials

To add topics and study materials for each course:

1. Create a `topics` table:
```sql
CREATE TABLE topics (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE study_materials (
  id SERIAL PRIMARY KEY,
  topic_id INT REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT, -- 'video', 'reading', 'quiz', 'practice'
  content TEXT,
  url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. Create API endpoints in `server.js`:
```javascript
app.get('/api/courses/:courseId/topics', async (req, res) => {
  // Return topics for a course
});

app.get('/api/topics/:topicId/materials', async (req, res) => {
  // Return study materials for a topic
});
```

3. Update the course detail modal to display topics

4. Allow professors to add/edit topics and materials through a CMS

## Troubleshooting

### Tree not loading
- Check that the backend is running on port 3001
- Verify the course exists in the database
- Check browser console for errors

### Import fails
- Ensure PostgreSQL is running
- Check that temp folder contains all JSON files
- Verify database schema is up to date

### Slow performance
- The tree endpoint uses recursive queries, which can be slow for deep trees
- Use the `maxDepth` parameter to limit recursion: `?maxDepth=3`
- Consider adding caching for frequently accessed courses

### Prerequisites not showing
- Not all courses have prerequisites defined
- Check if prerequisites exist: `SELECT * FROM prerequisites WHERE section_crn IN (SELECT crn FROM sections WHERE course_id = ...)`

## Future Enhancements

1. **Interactive filtering** - Filter by school, department, difficulty
2. **Visual improvements** - Better tree layout algorithms (D3.js)
3. **Reverse tree** - Show what courses this unlocks
4. **Path planning** - Find shortest path to a target course
5. **User progress tracking** - Mark courses as completed
6. **Degree requirements** - Map courses to degree requirements
7. **Course recommendations** - Suggest courses based on completed prerequisites

## Files Added/Modified

New files:
- `update_schema.sql` - Database schema updates
- `server/src/import-data.js` - Data import script
- `client/public/tree.html` - Tree visualization page
- `client/public/css/tree.css` - Tree-specific styles
- `client/public/js/tree.js` - Tree functionality

Modified files:
- `server/src/server.js` - Added prerequisite API endpoints
- `client/public/index.html` - Added navigation link

## Resources

- Original QUACS data: The data comes from RPI's course database
- Prerequisites are stored as JSONB for flexibility
- Tree rendering uses plain JavaScript (no external libraries)
- Can be enhanced with D3.js for more complex visualizations
