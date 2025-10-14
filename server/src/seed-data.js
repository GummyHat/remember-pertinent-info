const pool = require('./db');

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('Starting database seeding...');

    await client.query('BEGIN');

    // Sample subjects
    console.log('Inserting subjects...');
    const subjectsResult = await client.query(`
      INSERT INTO subjects (code, name) VALUES
      ('CSCI', 'Computer Science'),
      ('MATH', 'Mathematics'),
      ('PHYS', 'Physics'),
      ('ECSE', 'Electrical, Computer, and Systems Engineering')
      ON CONFLICT (code) DO NOTHING
      RETURNING id, code;
    `);

    console.log('Subjects inserted.');

    // Get subject IDs
    const csciId = (await client.query('SELECT id FROM subjects WHERE code = $1', ['CSCI'])).rows[0].id;
    const mathId = (await client.query('SELECT id FROM subjects WHERE code = $1', ['MATH'])).rows[0].id;
    const physId = (await client.query('SELECT id FROM subjects WHERE code = $1', ['PHYS'])).rows[0].id;
    const ecseId = (await client.query('SELECT id FROM subjects WHERE code = $1', ['ECSE'])).rows[0].id;

    // Sample courses
    console.log('Inserting courses...');
    const courses = [
      { subject_id: csciId, crse: 1100, course_id: 'CSCI-1100', subj: 'CSCI', title: 'Computer Science I' },
      { subject_id: csciId, crse: 1200, course_id: 'CSCI-1200', subj: 'CSCI', title: 'Data Structures' },
      { subject_id: csciId, crse: 2300, course_id: 'CSCI-2300', subj: 'CSCI', title: 'Introduction to Algorithms' },
      { subject_id: csciId, crse: 4440, course_id: 'CSCI-4440', subj: 'CSCI', title: 'Database Systems' },
      { subject_id: mathId, crse: 1010, course_id: 'MATH-1010', subj: 'MATH', title: 'Calculus I' },
      { subject_id: mathId, crse: 1020, course_id: 'MATH-1020', subj: 'MATH', title: 'Calculus II' },
      { subject_id: mathId, crse: 2400, course_id: 'MATH-2400', subj: 'MATH', title: 'Introduction to Differential Equations' },
      { subject_id: physId, crse: 1100, course_id: 'PHYS-1100', subj: 'PHYS', title: 'Physics I' },
      { subject_id: physId, crse: 1200, course_id: 'PHYS-1200', subj: 'PHYS', title: 'Physics II' },
      { subject_id: ecseId, crse: 2660, course_id: 'ECSE-2660', subj: 'ECSE', title: 'Computer Architecture' }
    ];

    for (const course of courses) {
      await client.query(`
        INSERT INTO courses (subject_id, crse, course_id, subj, title)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (course_id) DO NOTHING
      `, [course.subject_id, course.crse, course.course_id, course.subj, course.title]);
    }

    console.log('Courses inserted.');

    // Sample sections
    console.log('Inserting sections...');

    // CSCI-1100 sections
    const csci1100 = (await client.query('SELECT id FROM courses WHERE course_id = $1', ['CSCI-1100'])).rows[0];
    if (csci1100) {
      const section1 = await client.query(`
        INSERT INTO sections (course_id, crn, sec, act, cap, cred_max, cred_min, rem, title)
        VALUES ($1, 12345, '01', 1, 100, 4, 4, 15, 'Computer Science I')
        ON CONFLICT (crn) DO NOTHING
        RETURNING id
      `, [csci1100.id]);

      if (section1.rows.length > 0) {
        await client.query(`
          INSERT INTO timeslots (section_id, date_start, date_end, days, instructor, location, time_start, time_end)
          VALUES ($1, '2025-01-13', '2025-05-02', $2, 'Dr. Smith', 'Amos Eaton 215', 1000, 1150)
        `, [section1.rows[0].id, ['M', 'W']]);
      }

      const section2 = await client.query(`
        INSERT INTO sections (course_id, crn, sec, act, cap, cred_max, cred_min, rem, title)
        VALUES ($1, 12346, '02', 1, 100, 4, 4, 25, 'Computer Science I')
        ON CONFLICT (crn) DO NOTHING
        RETURNING id
      `, [csci1100.id]);

      if (section2.rows.length > 0) {
        await client.query(`
          INSERT INTO timeslots (section_id, date_start, date_end, days, instructor, location, time_start, time_end)
          VALUES ($1, '2025-01-13', '2025-05-02', $2, 'Dr. Johnson', 'Lally 104', 1400, 1550)
        `, [section2.rows[0].id, ['T', 'F']]);
      }
    }

    // CSCI-1200 sections
    const csci1200 = (await client.query('SELECT id FROM courses WHERE course_id = $1', ['CSCI-1200'])).rows[0];
    if (csci1200) {
      const section1 = await client.query(`
        INSERT INTO sections (course_id, crn, sec, act, cap, cred_max, cred_min, rem, title)
        VALUES ($1, 12347, '01', 1, 120, 4, 4, 30, 'Data Structures')
        ON CONFLICT (crn) DO NOTHING
        RETURNING id
      `, [csci1200.id]);

      if (section1.rows.length > 0) {
        await client.query(`
          INSERT INTO timeslots (section_id, date_start, date_end, days, instructor, location, time_start, time_end)
          VALUES ($1, '2025-01-13', '2025-05-02', $2, 'Dr. Williams', 'Darrin 308', 1200, 1350)
        `, [section1.rows[0].id, ['M', 'W', 'F']]);
      }
    }

    // MATH-1010 sections
    const math1010 = (await client.query('SELECT id FROM courses WHERE course_id = $1', ['MATH-1010'])).rows[0];
    if (math1010) {
      const section1 = await client.query(`
        INSERT INTO sections (course_id, crn, sec, act, cap, cred_max, cred_min, rem, title)
        VALUES ($1, 13001, '01', 1, 80, 4, 4, 12, 'Calculus I')
        ON CONFLICT (crn) DO NOTHING
        RETURNING id
      `, [math1010.id]);

      if (section1.rows.length > 0) {
        await client.query(`
          INSERT INTO timeslots (section_id, date_start, date_end, days, instructor, location, time_start, time_end)
          VALUES ($1, '2025-01-13', '2025-05-02', $2, 'Dr. Brown', 'Sage 2510', 800, 950)
        `, [section1.rows[0].id, ['M', 'W', 'F']]);
      }

      const section2 = await client.query(`
        INSERT INTO sections (course_id, crn, sec, act, cap, cred_max, cred_min, rem, title)
        VALUES ($1, 13002, '02', 1, 80, 4, 4, 20, 'Calculus I')
        ON CONFLICT (crn) DO NOTHING
        RETURNING id
      `, [math1010.id]);

      if (section2.rows.length > 0) {
        await client.query(`
          INSERT INTO timeslots (section_id, date_start, date_end, days, instructor, location, time_start, time_end)
          VALUES ($1, '2025-01-13', '2025-05-02', $2, 'Dr. Davis', 'Sage 2510', 1400, 1550)
        `, [section2.rows[0].id, ['T', 'F']]);
      }
    }

    // PHYS-1100 section
    const phys1100 = (await client.query('SELECT id FROM courses WHERE course_id = $1', ['PHYS-1100'])).rows[0];
    if (phys1100) {
      const section1 = await client.query(`
        INSERT INTO sections (course_id, crn, sec, act, cap, cred_max, cred_min, rem, title)
        VALUES ($1, 14001, '01', 1, 60, 4, 4, 8, 'Physics I')
        ON CONFLICT (crn) DO NOTHING
        RETURNING id
      `, [phys1100.id]);

      if (section1.rows.length > 0) {
        await client.query(`
          INSERT INTO timeslots (section_id, date_start, date_end, days, instructor, location, time_start, time_end)
          VALUES ($1, '2025-01-13', '2025-05-02', $2, 'Dr. Wilson', 'Science Center 1C14', 1000, 1150)
        `, [section1.rows[0].id, ['M', 'W']]);

        await client.query(`
          INSERT INTO timeslots (section_id, date_start, date_end, days, instructor, location, time_start, time_end)
          VALUES ($1, '2025-01-13', '2025-05-02', $2, 'Dr. Wilson', 'Science Center Lab A', 1400, 1650)
        `, [section1.rows[0].id, ['F']]);
      }
    }

    await client.query('COMMIT');
    console.log('Database seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding complete. Exiting.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
