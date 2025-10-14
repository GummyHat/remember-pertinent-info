# Quick Start Guide - Testing on Your Machine

## Current Status
- ✅ Node.js v18.19.1 installed
- ✅ npm 9.2.0 installed
- ❌ PostgreSQL not installed

## Option 1: Quick Test (No Database - Static Data)

If you want to test the frontend immediately without setting up PostgreSQL, you can serve static JSON files:

### Step 1: Create a simple data endpoint (optional)
```bash
cd client/public
```

### Step 2: Start a local web server
```bash
# Using Python 3 (usually pre-installed on Linux)
python3 -m http.server 8000

# OR using Node.js http-server
npx http-server -p 8000
```

### Step 3: Open in browser
```
http://localhost:8000
```

**Note:** The course tree won't work without the backend, but you can see the frontend design.

---

## Option 2: Full Setup with Database (Recommended)

### Step 1: Install PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### Step 2: Start PostgreSQL
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Start on boot
```

### Step 3: Create Database
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE remember_pertinent_info;
\q
```

### Step 4: Initialize Database Schema
```bash
# From project root
sudo -u postgres psql -d remember_pertinent_info -f commands.sql
sudo -u postgres psql -d remember_pertinent_info -f update_schema.sql
```

### Step 5: Configure Backend
```bash
cd server

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=remember_pertinent_info
DB_USER=postgres
DB_PASSWORD=
PORT=3001
EOF
```

### Step 6: Import Course Data
```bash
# Still in server directory
node src/import-data.js
```

This will take a few minutes and import all 5,808 courses.

### Step 7: Start Backend Server
```bash
npm start
```

You should see:
```
Server is running on port 3001
Connected to the PostgreSQL database
```

### Step 8: Start Frontend (New Terminal)
```bash
# Open new terminal
cd client/public
python3 -m http.server 8000
```

### Step 9: Test the Website

Open your browser to:
- **Main page:** http://localhost:8000/index.html
- **Course tree:** http://localhost:8000/tree.html

Try searching for:
- `CSCI-1200`
- `MATH-1010`
- `Data Structures`

---

## Option 3: Quick Backend Test (Without Full Import)

If you want to test the backend without importing all 5,808 courses:

### Steps 1-5: Same as Option 2

### Step 6: Use Sample Data Instead
```bash
cd server
node src/seed-data.js
```

This creates just 10 sample courses for quick testing.

### Steps 7-9: Same as Option 2

**Note:** The tree feature will have limited data, but you can test the functionality.

---

## Troubleshooting

### PostgreSQL connection issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Restart if needed
sudo systemctl restart postgresql
```

### Port already in use
```bash
# Check what's using port 3001
sudo lsof -i :3001

# Check what's using port 8000
sudo lsof -i :8000

# Use different ports if needed
PORT=3002 npm start  # Backend
python3 -m http.server 8001  # Frontend
```

### CORS errors in browser
Make sure:
1. Backend is running on port 3001
2. Frontend is accessing from localhost (not file://)

### Database permission errors
```bash
# Create a password for postgres user
sudo -u postgres psql
ALTER USER postgres PASSWORD 'yourpassword';
\q

# Update .env file with the password
```

---

## What to Expect

### Main Page (index.html)
- Welcome card
- Course catalog grouped by department
- Shows sections, instructors, times

### Course Tree Page (tree.html)
- Search bar for finding courses
- Visual prerequisite tree
- Click nodes to see course details
- Nested prerequisites displayed hierarchically

---

## Next Steps After Testing

1. Test the search functionality
2. Try different courses to see various prerequisite structures
3. Check the course detail modal
4. Verify data imports correctly
5. Test on different browsers (Chrome, Firefox)

---

## Quick Commands Reference

```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Start backend
cd server && npm start

# Start frontend (in new terminal)
cd client/public && python3 -m http.server 8000

# View logs
# Backend logs appear in terminal where npm start ran
# Frontend: Check browser console (F12)

# Stop servers
# Ctrl+C in each terminal
```

---

## Testing Checklist

- [ ] PostgreSQL installed and running
- [ ] Database created
- [ ] Schema initialized
- [ ] Course data imported
- [ ] Backend server starts without errors
- [ ] Frontend served on localhost:8000
- [ ] Main page loads and displays courses
- [ ] Tree page loads
- [ ] Search functionality works
- [ ] Course nodes are clickable
- [ ] Course details modal opens
- [ ] No CORS errors in browser console

---

## Development vs Production

This setup is for local development/testing. For production:
- Use proper PostgreSQL authentication
- Set up environment variables properly
- Use a production web server (nginx, Apache)
- Build React app (if migrating to React)
- Set up HTTPS
- Configure CORS properly
