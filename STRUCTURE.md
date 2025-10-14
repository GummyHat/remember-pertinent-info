# Project Structure

Simple, clean organization for easy navigation.

## 📁 Root Directory

```
remember-pertinent-info/
│
├── 🚀 start.sh                 # ONE-COMMAND LAUNCHER - Run this!
├── 📖 README.md                # Main documentation (start here)
├── 📄 LICENSE                  # MIT License
├── 📋 STRUCTURE.md             # This file
│
├── 📁 client/public/           # Frontend (what users see)
│   ├── standalone.html         # ⭐ MAIN APP - Complete, self-contained
│   ├── favicon.ico             # Browser icon
│   └── images/                 # Logo and graphics
│
├── 📁 server/                  # ⚙️ OPTIONAL - Backend (advanced users only)
│   ├── README.md               # Backend documentation
│   ├── commands.sql            # Database schema
│   ├── update_schema.sql       # Prerequisites schema
│   ├── package.json            # Node.js dependencies
│   └── src/                    # Server code (API, database)
│
└── 📁 docs/                    # 📚 Additional documentation
    ├── ADVANCED_SETUP.md       # PostgreSQL backend setup
    ├── SETUP.md                # Database schema details
    ├── TREE_SETUP.md           # Tree feature implementation
    ├── QUICKSTART.md           # Quick testing guide
    └── COURSE_DETAILS_GUIDE.md # Course data display docs
```

## 🎯 What You Actually Need

### For Basic Use (Most People)
```
✅ start.sh                     # Run this
✅ client/public/standalone.html # The app
✅ README.md                    # Instructions
```

That's it! Everything else is optional.

### For Advanced Features
```
✅ server/                      # If you want database backend
✅ docs/ADVANCED_SETUP.md       # Setup instructions
```

## 📂 Directory Details

### `client/public/`
**Purpose:** Frontend files (what runs in your browser)

- `standalone.html` - Complete self-contained app
  - Fetches data from QUACS GitHub
  - No backend needed
  - ~1000 lines of well-commented code
  - Includes HTML, CSS, and JavaScript

### `server/`
**Purpose:** Optional PostgreSQL backend

**Skip this unless** you want:
- User accounts
- Custom study materials
- Offline database
- Progress tracking

### `docs/`
**Purpose:** Extra documentation

- Most users don't need these
- For advanced features and development
- Explains database schema, API endpoints, etc.

## 🔍 File Purposes

| File | Purpose | Needed? |
|------|---------|---------|
| `start.sh` | Starts the app | ✅ Yes |
| `standalone.html` | The complete app | ✅ Yes |
| `README.md` | Main instructions | ✅ Yes |
| `server/` | Database backend | ⚙️ Optional |
| `docs/` | Extra documentation | 📚 Reference |

## 🚦 Getting Started Path

```
1. Read README.md (main instructions)
   ↓
2. Run ./start.sh (launches app)
   ↓
3. Use the app (search courses, view trees)
   ↓
4. (Optional) Read docs/ for advanced features
   ↓
5. (Advanced) Set up server/ for database backend
```

## 💡 Key Takeaways

- **Simple by default** - Just one command to run
- **One main file** - `standalone.html` is the entire app
- **Backend optional** - Advanced users can add features
- **Well documented** - Comments explain everything
- **Clean organization** - Easy to navigate

## 🎓 For Developers

### To modify the app:
1. Edit `client/public/standalone.html`
2. All code is in one file with clear sections
3. Well-commented for readability

### To add features:
1. See `docs/ADVANCED_SETUP.md`
2. Set up PostgreSQL backend
3. Modify `server/src/server.js`

### To contribute:
1. Fork the repository
2. Make changes
3. Test with `./start.sh`
4. Submit pull request

---

**Questions?** See README.md or open an issue on GitHub.
