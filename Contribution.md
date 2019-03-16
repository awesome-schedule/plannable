# Contribution Log

Those with the most contributions are listed first.

## Project Idea

This project is a continuation of our hackathon project of the same name. Initial team members include

-   **Zichao Hu** - [OAHC2022](https://github.com/OAHC2022)
-   **Hanzhi Zhou** - [hanzhi713](https://github.com/hanzhi713)
-   **Kaiying Shan** - [kaiyingshan](https://github.com/kaiyingshan)
-   **Minjun Long** - [Elena6918](https://github.com/Elena6918)

## Front-end

### Design

Kaiying Shan, Hanzhi Zhou, Zichao Hu Elena Long

### Main Component: [App.vue](/templates/src/App.vue)

| Part Name                | Contributor               |
| ------------------------ | ------------------------- |
| Schedule Rendering       | Kaiying Shan              |
| Tab Switching            | Kaiying Shan              |
| Course Manipulation      | Hanzhi Zhou               |
| Storage                  | Hanzhi Zhou, Kaiying Shan |
| Communication /w Backend | Hanzhi Zhou               |
| Options                  | Kaiying Shan              |
| Nav Bar                  | Elena Long                |

### Child Components

Child components are located at [components](/templates/src/components)

| Name           | Description                                                             | Contributor  |
| -------------- | ----------------------------------------------------------------------- | ------------ |
| ClassList      | Displaying the list of classes that are selected/match the query string | Hanzhi Zhou  |
| ClassListModal | Displaying information of a CourseRecord object                         | Kaiying Shan |
| CourseBlock    | A block component for placing a course on GridSchedule                  | Kaiying Shan |
| GridSchedule   | A component for rendering a schedule                                    | Kaiying Shan |
| Modal          | For displaying information of a specific course                         | Kaiying Shan |
| Pagination     | For showing a list of pages and switching between generated schedules   | Hanzhi Zhou  |

### Tool chain

Configuration of linting, formatting and testing tools

Hanzhi Zhou

### Models and Data Structure

These are mainly JavaScript files in [models](/templates/src/models)

| Name          | Description                                             | Contributor |
| ------------- | ------------------------------------------------------- | ----------- |
| AllRecords    | A wrapper for raw course records, course query provider | Hanzhi Zhou |
| CourseRecords | A collection of course sections                         | Hanzhi Zhou |
| Course        | A specific section of a course                          | Hanzhi Zhou |
| Schedule      | Schedule data structure, helpers for schedule rendering | Hanzhi Zhou |

### Algorithm

These are mainly JavaScript files in [algorithm](/templates/src/algorithm)

Zichao Hu, Hanzhi Zhou

## Back-End

Back-end mainly consists of python scripts.

| Name              | Description                          | Contributor            |
| ----------------- | ------------------------------------ | ---------------------- |
| Data preparation  | Load and parse raw data              | Zichao Hu, Hanzhi Zhou |
| Algorithm         | -                                    | Zichao Hu              |
| Translation Layer | Translate in between data structures | Hanzhi Zhou            |
| Request Handling  | -                                    | Hanzhi Zhou            |