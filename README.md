# **Remember Pertinent Information**

Version 2 \- Fall 2025

## Vision:

Our vision is to produce a web app that will help facilitate the learning of various topics. This will be done via modules and other systems that will allow educators to set their students up for success. The platform should be easy for professors to utilize, and will allow the professors to post content which will help students familiarize themselves with course materials, or brush up on course content and gauge their preparedness on prerequisites.

## Stack:

* HTML  
* CSS/Tailwind  
* React/TS  
* MongoDB?  
* PostgreSQL

## Semester Specific Goals:

Our first step is to  analyze and interface with the Course Scaffold website from a previous RCOS project. It is defunct, and if we can get it up and running we could potentially utilize it as a baseline user interface tool and database to build our project from.

If we are unable to get a working version of the Course Scaffold website, our next step will be to build our own course framework and user interface. 

The next step once we have created a functional course framework with a user interface is to allow for user posts, such as quizzes, videos, and text-based posts.

Finally, we will ensure that our database accurately and dynamically reflects RPI course offerings, and work on polishing the look of the project to be appealing to users. We will reach out to professors and encourage them to utilize the resource, additionally seeking end user feedback from their experiences to improve the project.

## Milestones:

### By the Beginning of October:

* Create a logo for our project  
* Give our project a name  
* Recover any code and data from the previous project  
* Repair any code found to create a basic starting point

### By Mid-November

* Gather data on skills, concepts, etc., from RPI’s existing databases  
* Produce a functional backend that can utilize scraped data and convert it for use within our own project.  
  * Using PostgreSQL for the database  
  * The course database from QUACS will be scraped to form a base tree structure that will be built upon using a few different ADTs.  
    * Courses: A course ADT will include resources for a particular course, and associated skills and concepts.  
    * Skills: ADTs of this type will include relevant resources and associated courses. For example, a Skill ADT for Matrix Multiplication might include lectures and quizzes on the topic, and additionally a list of courses for which knowledge of Matrix Multiplication is expected.  
    * Concepts: ADTs of this type will be groups of prerequisite skills. A course may recommend students familiarize themselves with certain concepts, for example a course that requires students to be familiar with Matrix Algebra would recommend the Matrix Algebra concept, which would internally contain skills including Matrix Multiplication.  
  * We will fill this database initially with data from QuACS:  
    * Major requirements  
    * Courses from the Course Catalog  
    * Course Prerequisites  
  * This data will also be organized by major and level, for easier traversal on the website.  
  * Some of the data will be created by professors when they assign class prerequisites through the website.   
    * Concepts  
    * Skills  
  * This data will be linked to the courses that the professors create it on initially, but once we have multiple concepts/skills, professors will be able to search it as a template library and use already-existing skills.  
* Create a search page to allow users to find and search through everything in the uploaded content categories:  
  * Skills  
  * Concepts  
  * Courses  
  * Tracks  
  * Majors  
  * Departments  
  * Later, Universities might be on this list

### By the End of Semester

* Enable sign-in method for teachers/students  
  * For testing in RPI’s ECSE department, set up with RPI SSO for RPI students and faculty to securely login  
  * Utilize DUO verification for a more standardized login process  
* Produce a means (a form of CMS) for professors to create and upload interactive content modules to the site, containing the following:  
  * Formatted concept/skill categories (lecture-note style)  
    * We plan to implement these in a modified markdown format, for ease of implementation and use.  
    * We will also add an ability to import lecture notes for further ease of use here.  
  * Quizzes for students to test their knowledge of these categories  
    * These will have the option to be integrated inline with the lecture notes, or separated completely.  
* Create a user database to store information about what students know and track it over time, linked to the SSO login.  
* Outreach, try to get users to create content for the site/students.

## Team Members:

Jacob Hudnut, [hudnuj@rpi.edu](mailto:hudnuj@rpi.edu), 4 credits  
Oliver Centner, [centno@rpi.edu](mailto:centno@rpi.edu), 4 credits  
Ronan Hevenor, [hevenr@rpi.edu](mailto:hevenr@rpi.edu), 2 credits  
Dan Liu, [liuy77@rpi.edu](mailto:liuy77@rpi.edu), 2 credits