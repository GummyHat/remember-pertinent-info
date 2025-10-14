# Remember Pertinent Info - RPI Course Prerequisite Tree

A web application that helps RPI students visualize course prerequisites and explore course information.

## 🚀 Quick Start (Simple - No Setup Required!)

```bash
./start.sh
```

That's it! The website opens automatically with live data from QUACS.

## ✨ Features

- **Interactive Prerequisite Tree** - Visual display of course prerequisites
- **Live QUACS Data** - Automatically fetches current course data from GitHub
- **Complete Course Information** - View all details: CRN, sections, instructors, times, seats
- **Smart Search** - Find courses by code or name
- **Multiple Semesters** - Switch between Spring 2025, Fall 2024, etc.
- **No Database Required** - Works entirely in your browser

## 📖 How to Use

1. **Run the app:**
   ```bash
   ./start.sh
   ```

2. **Search for a course:**
   - Type in the search box: "CSCI-1200" or "Data Structures"
   - Click on a course from the results

3. **Explore the prerequisite tree:**
   - See what courses you need first
   - Prerequisites are shown recursively
   - Click any course node for full details

4. **View complete course data:**
   - Click any course in the tree
   - See all sections, times, instructors, seats
   - Check seat availability with color-coded badges

## 🎯 Example Searches

Try these courses to see different prerequisite patterns:
- `CSCI-1200` - Data Structures (has CSCI-1100 prerequisite)
- `MATH-2400` - Differential Equations (has calculus prerequisites)
- `ECSE-2660` - Computer Architecture (multiple prerequisites)
- `PHYS-1200` - Physics II (OR prerequisites)

## 📂 Project Structure

```
remember-pertinent-info/
├── start.sh                    # One-command launcher
├── client/public/
│   ├── standalone.html         # Main app (complete, self-contained)
│   ├── css/                    # Stylesheets (optional backend version)
│   ├── js/                     # Scripts (optional backend version)
│   └── images/                 # Logo and icons
├── server/                     # Optional: PostgreSQL backend (advanced)
└── README.md                   # This file

**For basic use, you only need:**
- `start.sh`
- `client/public/standalone.html`
```

## 🔧 Technical Details

### Data Source
- **Repository:** github.com/quacs/quacs-data
- **Updates:** Live from GitHub (always current)
- **Coverage:** 5,800+ RPI courses

### How It Works
1. Fetches JSON data from QUACS GitHub repository
2. Processes course, catalog, and prerequisite data
3. Builds prerequisite tree recursively
4. Displays everything in an interactive interface

### Technologies
- Pure HTML/CSS/JavaScript (no frameworks)
- Fetches data client-side (no backend needed)
- Responsive design (works on mobile)

## 📊 Data Displayed

When you click on a course, you see:

**Course Info:**
- Course code, subject, number
- Full description
- Department

**For Each Section:**
- CRN (Course Registration Number)
- Section number
- Credits
- Capacity and remaining seats
- Special attributes

**For Each Timeslot:**
- Instructor name
- Meeting days (M, T, W, R, F)
- Times (formatted: 10:00 AM - 11:50 AM)
- Location (building and room)
- Semester duration

## 🎨 Visual Features

- **Color-coded seats:**
  - 🟢 Green = plenty available
  - 🟠 Orange = <20% remaining
  - 🔴 Red = full
- **Prerequisite relationships** - AND/OR indicators
- **Minimum grades** - Shows required grade for prerequisites
- **Responsive layout** - Works on any screen size

## 🛠️ Advanced Setup (Optional)

If you want to add features like user accounts, custom study materials, or offline access:

See `docs/ADVANCED_SETUP.md` for:
- PostgreSQL database setup
- Backend server configuration
- Custom data import
- User authentication

**Note:** This is only needed for advanced features. The standalone version works great for most use cases!

## 🔮 Future Enhancements

Possible additions:
1. User accounts and progress tracking
2. Course topics and study materials
3. Quizzes and practice problems
4. Professor ratings integration
5. Degree requirement mapping
6. Course recommendation engine
7. Historical enrollment data

## 📝 Project Vision

Our vision is to produce a web app that helps facilitate learning of various topics through:
- Easy course discovery and prerequisite visualization
- Study materials organized by course topics
- Progress tracking for students
- Resource sharing for professors

See original project goals in `docs/PROJECT_VISION.md`

## 👥 Team

**Fall 2025 RCOS Project**

- Jacob Hudnut - hudnuj@rpi.edu (4 credits)
- Oliver Centner - centno@rpi.edu (4 credits)
- Ronan Hevenor - hevenr@rpi.edu (2 credits)
- Dan Liu - liuy77@rpi.edu (2 credits)

## 📄 License

MIT License - See LICENSE file

## 🙏 Acknowledgments

- **QUACS Team** - For providing comprehensive RPI course data
- **RPI** - For course catalog information
- **RCOS** - For project support

## 🐛 Issues or Questions?

For issues, feature requests, or questions, open an issue on GitHub.

## 🚦 Getting Started Checklist

- [ ] Run `./start.sh`
- [ ] Search for a course
- [ ] View the prerequisite tree
- [ ] Click on a course node
- [ ] Explore different courses
- [ ] Try switching semesters

**That's it! You're ready to explore RPI's course prerequisites!** 🎓
