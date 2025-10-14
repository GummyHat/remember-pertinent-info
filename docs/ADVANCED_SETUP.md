# Advanced Setup - PostgreSQL Backend

This guide is for advanced users who want to add features like:
- User accounts and authentication
- Custom study materials
- Offline database access
- Progress tracking

## Prerequisites

- PostgreSQL 12+
- Node.js 14+
- npm

## Setup Steps

### 1. Install PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
sudo -u postgres psql -c "CREATE DATABASE remember_pertinent_info;"
psql -U postgres -d remember_pertinent_info -f commands.sql
psql -U postgres -d remember_pertinent_info -f update_schema.sql
```

### 3. Configure Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Import Data

```bash
node src/import-data.js
```

### 5. Start Services

```bash
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend  
cd client/public && python3 -m http.server 8000
```

## API Endpoints

See `docs/API.md` for full endpoint documentation.

## More Details

- **Database Schema:** See `SETUP.md`
- **Tree Implementation:** See `TREE_SETUP.md`  
- **Data Import:** See `QUICKSTART.md`

**Note:** Most users don't need this! The standalone version works great.
