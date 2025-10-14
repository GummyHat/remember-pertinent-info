const fs = require('fs');
const path = require('path');
const pool = require('./db');

// Load JSON data files
const TEMP_DIR = path.join(__dirname, '../../temp');
const catalog = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, 'catalog.json'), 'utf8'));
const courses = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, 'courses.json'), 'utf8'));
const prerequisites = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, 'prerequisites.json'), 'utf8'));
const schools = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, 'schools.json'), 'utf8'));

async function importData() {
  const client = await pool.connect();

  try {
    console.log('Starting data import...');
    await client.query('BEGIN');

    // Step 1: Import schools
    console.log('Importing schools...');
    const schoolMap = {};
    for (const school of schools) {
      const result = await client.query(
        'INSERT INTO schools (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id',
        [school.name]
      );
      schoolMap[school.name] = result.rows[0].id;

      // Import departments for this school
      for (const dept of school.depts) {
        await client.query(
          'INSERT INTO departments (school_id, code, name) VALUES ($1, $2, $3) ON CONFLICT (code) DO UPDATE SET name = $3',
          [schoolMap[school.name], dept.code, dept.name]
        );
      }
    }
    console.log(`Imported ${schools.length} schools and their departments.`);

    // Step 2: Import subjects from courses data
    console.log('Importing subjects...');
    const subjectMap = {};
    for (const dept of courses) {
      const deptResult = await client.query(
        'SELECT id FROM departments WHERE code = $1',
        [dept.code]
      );
      const deptId = deptResult.rows[0]?.id || null;

      const subjectResult = await client.query(
        'INSERT INTO subjects (code, name, department_id) VALUES ($1, $2, $3) ON CONFLICT (code) DO UPDATE SET name = $2, department_id = $3 RETURNING id',
        [dept.code, dept.code, deptId]
      );
      subjectMap[dept.code] = subjectResult.rows[0].id;
    }
    console.log(`Imported ${courses.length} subjects.`);

    // Step 3: Import courses with catalog descriptions
    console.log('Importing courses...');
    let courseCount = 0;
    const courseIdMap = {};

    for (const dept of courses) {
      const subjectId = subjectMap[dept.code];

      for (const course of dept.courses) {
        const courseId = course.id;
        const catalogInfo = catalog[courseId] || {};

        const result = await client.query(
          `INSERT INTO courses (subject_id, crse, course_id, subj, title, description, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (course_id) DO UPDATE
           SET title = $5, description = $6, source = $7
           RETURNING id`,
          [
            subjectId,
            course.crse,
            courseId,
            dept.code,
            catalogInfo.name || `Course ${courseId}`,
            catalogInfo.description || '',
            catalogInfo.source || 'SIS'
          ]
        );

        courseIdMap[courseId] = result.rows[0].id;
        courseCount++;
      }
    }
    console.log(`Imported ${courseCount} courses.`);

    // Step 4: Import sections and timeslots
    console.log('Importing sections and timeslots...');
    let sectionCount = 0;
    let timeslotCount = 0;
    const crnToSectionId = {};

    for (const dept of courses) {
      for (const course of dept.courses) {
        const dbCourseId = courseIdMap[course.id];

        if (!dbCourseId) {
          console.warn(`Course not found in DB: ${course.id}`);
          continue;
        }

        for (const section of course.sections) {
          try {
            const sectionResult = await client.query(
              `INSERT INTO sections (course_id, crn, sec, act, attribute, cap, cred_max, cred_min, rem, title)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               ON CONFLICT (crn) DO UPDATE
               SET sec = $3, cap = $6, rem = $9
               RETURNING id`,
              [
                dbCourseId,
                section.crn,
                section.sec,
                section.act || 0,
                section.attribute || '',
                section.cap,
                section.credMax || 0,
                section.credMin || 0,
                section.rem,
                section.title || ''
              ]
            );

            const sectionId = sectionResult.rows[0].id;
            crnToSectionId[section.crn] = sectionId;
            sectionCount++;

            // Import timeslots for this section
            for (const timeslot of section.timeslots) {
              await client.query(
                `INSERT INTO timeslots (section_id, date_start, date_end, days, instructor, location, time_start, time_end)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                  sectionId,
                  timeslot.dateStart || '',
                  timeslot.dateEnd || '',
                  timeslot.days || [],
                  timeslot.instructor || '',
                  timeslot.location || '',
                  timeslot.timeStart || -1,
                  timeslot.timeEnd || -1
                ]
              );
              timeslotCount++;
            }
          } catch (err) {
            console.error(`Error importing section ${section.crn}:`, err.message);
          }
        }
      }
    }
    console.log(`Imported ${sectionCount} sections and ${timeslotCount} timeslots.`);

    // Step 5: Import prerequisites
    console.log('Importing prerequisites...');
    let prereqCount = 0;
    for (const [crn, data] of Object.entries(prerequisites)) {
      if (data.prerequisites && Object.keys(data.prerequisites).length > 0) {
        try {
          await client.query(
            `INSERT INTO prerequisites (section_crn, prereq_data)
             VALUES ($1, $2)
             ON CONFLICT (section_crn) DO UPDATE
             SET prereq_data = $2`,
            [parseInt(crn), JSON.stringify(data.prerequisites)]
          );
          prereqCount++;
        } catch (err) {
          // CRN might not exist in sections table, skip it
          if (err.code !== '23503') { // Not a foreign key violation
            console.error(`Error importing prerequisite for CRN ${crn}:`, err.message);
          }
        }
      }
    }
    console.log(`Imported ${prereqCount} prerequisites.`);

    await client.query('COMMIT');
    console.log('\nData import completed successfully!');
    console.log('Summary:');
    console.log(`- Schools: ${schools.length}`);
    console.log(`- Subjects: ${courses.length}`);
    console.log(`- Courses: ${courseCount}`);
    console.log(`- Sections: ${sectionCount}`);
    console.log(`- Timeslots: ${timeslotCount}`);
    console.log(`- Prerequisites: ${prereqCount}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error importing data:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  importData()
    .then(() => {
      console.log('\nImport complete. Exiting.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Import failed:', err);
      process.exit(1);
    });
}

module.exports = importData;
