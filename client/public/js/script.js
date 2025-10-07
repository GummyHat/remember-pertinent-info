document.addEventListener('DOMContentLoaded', () => {
    const courseContainer = document.getElementById('course-container');

    // Fetch course catalog and course section data
    Promise.all([
        fetch('catalog.json').then(response => response.json()),
        fetch('courses.json').then(response => response.json())
    ]).then(([catalog, courses]) => {
        // Create a lookup for course descriptions
        const courseDetails = {};
        for (const courseId in catalog) {
            courseDetails[courseId] = catalog[courseId];
        }

        // Iterate through departments and their courses
        courses.forEach(department => {
            department.courses.forEach(course => {
                const courseId = course.id;
                const details = courseDetails[courseId];

                // Create a div for each course
                const courseDiv = document.createElement('div');
                courseDiv.classList.add('course');

                let courseHTML = `<h2>${details.name}</h2>`;
                if (details.description) {
                    courseHTML += `<p>${details.description}</p>`;
                }

                // Add sections to the course div
                course.sections.forEach(section => {
                    courseHTML += '<div class="section">';
                    courseHTML += `<p><strong>Section:</strong> ${section.sec} | <strong>CRN:</strong> ${section.crn}</p>`;
                    section.timeslots.forEach(slot => {
                        courseHTML += `<p><strong>Instructor:</strong> ${slot.instructor}</p>`;
                        if (slot.timeStart !== -1) {
                            courseHTML += `<p><strong>Time:</strong> ${slot.days.join('')} ${formatTime(slot.timeStart)} - ${formatTime(slot.timeEnd)}</p>`;
                        }
                    });
                    courseHTML += '</div>';
                });

                courseDiv.innerHTML = courseHTML;
                courseContainer.appendChild(courseDiv);
            });
        });
    }).catch(error => {
        console.error('Error loading course data:', error);
        courseContainer.innerHTML = '<p>Could not load course data.</p>';
    });

    // Helper function to format time
    function formatTime(time) {
        const hour = Math.floor(time / 100);
        const minute = time % 100;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
});
