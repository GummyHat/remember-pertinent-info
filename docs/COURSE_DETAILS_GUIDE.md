# Course Details Feature - Complete Data Display

## What's New

The standalone version now displays **ALL course data** when you click on any course node in the tree!

## How to Use

1. Run `./start.sh`
2. Search for any course (e.g., "CSCI-1200")
3. **Click on any course node** in the tree
4. View complete course information in the modal

## Data Displayed

### Course Information
- **Course Code** - Full course ID (e.g., CSCI-1200)
- **Subject** - Department code (e.g., CSCI)
- **Course Number** - Course number (e.g., 1200)
- **Department** - Full department name
- **Description** - Complete course description from catalog
- **Source** - Data source (usually "SIS")

### Section Information (for each section)
Each section shows:
- **CRN** - Course Registration Number (unique identifier)
- **Section Number** - Section code (e.g., "01", "02")
- **Activity Code (act)** - Activity type
- **Credits** - Min and max credits (credMin, credMax)
- **Capacity (cap)** - Total seats in section
- **Remaining Seats (rem)** - Available seats
  - Green badge: plenty of seats
  - Orange badge: <20% remaining
  - Red badge: full
- **Attribute** - Special attributes (e.g., "Communication Intensive")
- **Title** - Section-specific title

### Timeslot Information (for each meeting time)
Each timeslot shows:
- **Instructor** - Professor name(s)
- **Days** - Meeting days (M, T, W, R, F)
- **Time** - Start and end time (formatted as HH:MM AM/PM)
- **Location** - Building and room
- **Duration** - Start date (dateStart) and end date (dateEnd)

## Example Output

When you click on **CSCI-1200**:

```
Course Code: CSCI-1200
Subject: CSCI
Course Number: 1200
Department: CSCI

Description:
Programming concepts and their implementation...

Available Sections:

Section 01                [25/100 Seats Available]
├─ CRN: 12345
├─ Section: 01
├─ Activity Code: 1
├─ Credits: 4
├─ Capacity: 100
├─ Remaining Seats: 25
└─ Timeslots:
   ├─ Instructor: Dr. Smith
   ├─ Days: M, W, F
   ├─ Time: 10:00 AM - 11:50 AM
   ├─ Location: Amos Eaton 215
   └─ Duration: 01/12 to 05/08

Section 02                [0/100 Seats Available]
├─ CRN: 12346
... (and so on)
```

## Visual Features

### Color-Coded Seat Availability
- 🟢 **Green** - Good availability
- 🟠 **Orange** - Low availability (<20%)
- 🔴 **Red** - Full (0 seats)

### Organized Layout
- **Grid layout** for course info (responsive)
- **Card layout** for each section
- **Highlighted timeslots** with green left border
- **Sticky header** stays visible while scrolling

### Interactive Elements
- Click any course node to open modal
- Scroll through all sections
- Close with X button or click outside

## All Data from courses.json

The modal displays every field from the QUACS data:

**From courses.json:**
- `id` - Course ID
- `crse` - Course number
- `subj` - Subject code
- `sections[]` - Array of sections
  - `crn` - CRN
  - `sec` - Section number
  - `act` - Activity code
  - `cap` - Capacity
  - `rem` - Remaining seats
  - `credMin` - Minimum credits
  - `credMax` - Maximum credits
  - `attribute` - Special attributes
  - `title` - Section title
  - `timeslots[]` - Array of meeting times
    - `instructor` - Instructor name
    - `days[]` - Meeting days
    - `timeStart` - Start time (converted to readable format)
    - `timeEnd` - End time (converted to readable format)
    - `location` - Building/room
    - `dateStart` - Semester start
    - `dateEnd` - Semester end

**From catalog.json:**
- `name` - Course name
- `description` - Full description
- `source` - Data source

## Technical Details

### Time Formatting
Times are converted from military format (e.g., 1000) to readable format (10:00 AM):
```javascript
1000 → 10:00 AM
1350 → 1:50 PM
-1 → TBA (to be announced)
```

### Seat Calculation
Seat availability is calculated and color-coded:
```javascript
percentRemaining = (rem / cap) * 100

if (rem === 0) → RED (full)
else if (percentRemaining < 20) → ORANGE (low)
else → GREEN (available)
```

### Modal Features
- **Responsive** - Works on mobile and desktop
- **Scrollable** - Long content scrolls within modal
- **Sticky header** - Course title stays visible
- **Click outside to close** - Intuitive UX
- **Animated entrance** - Smooth slide-in effect

## Future Enhancements

You can add:
1. **Prerequisites display** - Show required courses in modal
2. **Co-requisites** - Courses that must be taken together
3. **Topics & study materials** - Links to course resources
4. **Professor ratings** - Integration with rate-my-professor
5. **Historical data** - Past enrollment trends
6. **Waitlist info** - Waitlist size if available
7. **Export/print** - Save course details as PDF

## Testing

Try these courses to see different data patterns:

1. **CSCI-1200** - Popular course, multiple sections
2. **MATH-1010** - Basic course with many students
3. **PHIL-2140** - Small seminar course
4. **MGMT-4000** - Advanced course with prerequisites
5. **ADMN-1030** - Administrative course with special attributes

Each shows different combinations of data!

## Customization

To modify what's displayed, edit the `showCourseDetail()` function in `standalone.html`:

- Add new fields by accessing `course.fieldName` or `catalog.fieldName`
- Change styling by modifying CSS classes
- Reorder sections by rearranging the HTML template
- Add calculations (e.g., enrolled count = cap - rem)

Enjoy exploring all the course data! 🎓
