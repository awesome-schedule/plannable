# Contribution Log

Contribution log by Hanzhi Zhou

## Project Idea

This project is a continuation of our hackathon project of the same name. Initial team members include

-   **Zichao Hu** - [OAHC2022](https://github.com/OAHC2022)
-   **Hanzhi Zhou** - [hanzhi713](https://github.com/hanzhi713)
-   **Kaiying Shan** - [kaiyingshan](https://github.com/kaiyingshan)
-   **Minjun Long** - [Elena6918](https://github.com/Elena6918)

For the following parts, those with the most contributions are listed first.

## Front-end

### Design

Kaiying Shan, Hanzhi Zhou, Zichao Hu and Elena Long

### Main Component: [App.vue](/templates/src/App.vue)

| Part Name                | Contributor               |
| ------------------------ | ------------------------- |
| Schedule Rendering       | Kaiying Shan              |
| Tab Switching            | Kaiying Shan              |
| Semester Switching       | Hanzhi Zhou               |
| Course Manipulation      | Hanzhi Zhou               |
| Storage                  | Hanzhi Zhou, Kaiying Shan |
| Communication \w Backend | Hanzhi Zhou               |
| Filters                  | Kaiying Shan              |
| Display Options          | Kaiying Shan              |
| Nav Bar                  | Kaiying Shan, Elena Long  |
| Algorithm Integration    | Kaiying Shan              |

### Child Components

Child components are located at [components](/templates/src/components)

| Name           | Description                                                             | Contributor               |
| -------------- | ----------------------------------------------------------------------- | ------------------------- |
| ClassList      | Displaying the list of classes that are selected/match the query string | Hanzhi Zhou               |
| ClassListModal | Displaying information of a CourseRecord object                         | Kaiying Shan              |
| CourseBlock    | A block component for placing a course on GridSchedule                  | Kaiying Shan              |
| GridSchedule   | A component for rendering a schedule                                    | Kaiying Shan              |
| Modal          | For displaying information of a specific course                         | Kaiying Shan              |
| Pagination     | For showing a list of pages and switching between generated schedules   | Hanzhi Zhou, Kaiying Shan |

### Tool chain

Configuration of linting, formatting, building and testing tools

Hanzhi Zhou

### Continuous Integration

Hanzhi Zhou

### Models and Data Structure

These are mainly JavaScript files in [models](/templates/src/models)

| Name          | Description                                             | Contributor |
| ------------- | ------------------------------------------------------- | ----------- |
| AllRecords    | A wrapper for raw course records, course query provider | Hanzhi Zhou |
| CourseRecords | A collection of course sections                         | Hanzhi Zhou |
| Course        | A specific section of a course                          | Hanzhi Zhou |
| Schedule      | Schedule data structure, helpers for schedule rendering | Hanzhi Zhou |
| Notification  | A wrapper for displaying notifications to user          | Hanzhi Zhou |

### Data Fetching

| Name           | Description                                             | Contributor  |
| -------------- | ------------------------------------------------------- | ------------ |
| DataLoader     | Script for fetching the list of semesters               | Kaiying Shan |
| SemesterLoader | Script for fetching course records of a single semester | Hanzhi Zhou  |

### Algorithm

These are mainly JavaScript files in [algorithm](/templates/src/algorithm)

| Part             | Description                                       | Contributor |
| ---------------- | ------------------------------------------------- | ----------- |
| Main Algorithm   | -                                                 | Zichao Hu   |
| Type Annotations | JSDoc Annotations to make the script type-checked | Hanzhi Zhou |

## Back-End

Back-end mainly consists of python scripts.

| Name              | Description                          | Contributor            |
| ----------------- | ------------------------------------ | ---------------------- |
| Data preparation  | Load and parse raw data              | Zichao Hu, Hanzhi Zhou |
| Algorithm         | -                                    | Zichao Hu              |
| Translation Layer | Translate in between data structures | Hanzhi Zhou            |
| Request Handling  | -                                    | Hanzhi Zhou            |