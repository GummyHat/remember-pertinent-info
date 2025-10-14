# Backend Server (Optional - Advanced Users Only)

This folder contains the PostgreSQL backend for advanced features.

**Note:** You don't need this for basic use! The standalone version works without any backend.

## When to use this

Only if you want to add:
- User accounts
- Custom study materials
- Offline database
- Progress tracking

## Setup

See `../docs/ADVANCED_SETUP.md` for complete instructions.

## Files

- `commands.sql` - Initial database schema
- `update_schema.sql` - Prerequisites and advanced features
- `src/server.js` - Express API server
- `src/import-data.js` - Import QUACS data to database
- `src/seed-data.js` - Sample data for testing
- `src/db.js` - Database connection

## Quick Start (Backend)

```bash
# 1. Set up PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE remember_pertinent_info;"
psql -U postgres -d remember_pertinent_info -f commands.sql
psql -U postgres -d remember_pertinent_info -f update_schema.sql

# 2. Install & configure
npm install
cp .env.example .env
# Edit .env

# 3. Import data
node src/import-data.js

# 4. Start server
npm start
```

Most users can ignore this entire folder!
