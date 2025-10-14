# Setup Guide for Remember Pertinent Info

This guide will help you set up the course catalog feature with PostgreSQL database and Node.js backend.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Step 1: Install PostgreSQL

### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### On macOS (using Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

### On Windows:
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

## Step 2: Create Database

1. Log into PostgreSQL:
```bash
sudo -u postgres psql
```

2. Create the database:
```sql
CREATE DATABASE remember_pertinent_info;
```

3. Create a user (optional, but recommended):
```sql
CREATE USER rpi_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE remember_pertinent_info TO rpi_user;
```

4. Exit PostgreSQL:
```sql
\q
```

## Step 3: Initialize Database Schema

Run the SQL commands from `commands.sql` to create the tables:

```bash
psql -U postgres -d remember_pertinent_info -f commands.sql
```

Or if you created a custom user:
```bash
psql -U rpi_user -d remember_pertinent_info -f commands.sql
```

## Step 4: Configure Backend

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=remember_pertinent_info
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3001
```

## Step 5: Seed Database with Sample Data

Run the seed script to populate the database with sample courses:

```bash
node src/seed-data.js
```

You should see output indicating that subjects, courses, and sections have been inserted.

## Step 6: Start the Backend Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server should start on port 3001. You should see:
```
Server is running on port 3001
Connected to the PostgreSQL database
```

## Step 7: Open the Frontend

1. Open a new terminal and navigate to the client directory:
```bash
cd client/public
```

2. Start a simple HTTP server:

Using Python 3:
```bash
python3 -m http.server 8000
```

Or using Node.js http-server (install if needed):
```bash
npx http-server -p 8000
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

## Verification

You should see:
- The welcome card at the top
- Course data organized by department (Computer Science, Mathematics, Physics, ECSE)
- Each course showing sections with times, instructors, and locations

## Troubleshooting

### Cannot connect to database
- Ensure PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or `brew services list` (macOS)
- Check your `.env` file has the correct credentials
- Verify the database exists: `psql -U postgres -l`

### CORS errors in browser
- Make sure the backend server is running on port 3001
- Check that the frontend is making requests to `http://localhost:3001/api`

### No data showing
- Verify the database is seeded: `psql -U postgres -d remember_pertinent_info -c "SELECT COUNT(*) FROM courses;"`
- Check the browser console for errors
- Check the backend server logs for errors

## API Endpoints

Once the server is running, you can access these endpoints:

- `GET /api/health` - Health check
- `GET /api/subjects` - Get all subjects
- `GET /api/courses` - Get all courses with subject info
- `GET /api/courses/grouped` - Get courses grouped by department (used by frontend)
- `GET /api/courses/:courseId` - Get a specific course with all details

## Adding Real Course Data

To add actual course data from QUACS or other sources:

1. Parse your course data source
2. Insert data using SQL or create a custom seed script
3. Follow the database schema defined in `commands.sql`

The database schema supports:
- Multiple subjects/departments
- Multiple courses per subject
- Multiple sections per course
- Multiple timeslots per section (for labs, lectures, etc.)
