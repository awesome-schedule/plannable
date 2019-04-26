# Contribution Log

Contribution log by Hanzhi Zhou

## Project Idea

This project is a continuation of our hackathon project of the same name. Initial team members include

-   **Zichao Hu** - [OAHC2022](https://github.com/OAHC2022)
-   **Hanzhi Zhou** - [hanzhi713](https://github.com/hanzhi713)
-   **Kaiying Shan** - [kaiyingshan](https://github.com/kaiyingshan)
-   **Minjun Long** - [Elena6918](https://github.com/Elena6918)

For the following parts, those with the most contributions are listed first.

## Software Architect

Hanzhi Zhou

## Front-end

### Design

Kaiying Shan, Hanzhi Zhou, Zichao Hu and Elena Long

### Main Component: [App.vue](/templates/src/App.vue)

| Part Name             | Contributor               |
| --------------------- | ------------------------- |
| Nav Bar               | Kaiying Shan              |
| Schedule Rendering    | Kaiying Shan              |
| Tab Switching         | Kaiying Shan              |
| Semester Switching    | Hanzhi Zhou               |
| Course Manipulation   | Hanzhi Zhou               |
| Storage and Cache     | Hanzhi Zhou, Kaiying Shan |
| Sorting Options       | Hanzhi Zhou               |
| Filters               | Kaiying Shan              |
| Display Options       | Kaiying Shan              |
| Algorithm Integration | Kaiying Shan              |
| Import/Export         | Kaiying Shan              |

### Child Components

Child components are located at [components](/templates/src/components)

| Name           | Description                                                             | Contributor               |
| -------------- | ----------------------------------------------------------------------- | ------------------------- |
| ClassList      | Displaying the list of classes that are selected/match the query string | Hanzhi Zhou, Kaiying Shan |
| ClassListModal | Displaying information of a CourseRecord object                         | Kaiying Shan, Hanzhi Zhou |
| CourseBlock    | A block component for placing a course on GridSchedule                  | Kaiying Shan, Hanzhi Zhou |
| GridSchedule   | A component for rendering a schedule                                    | Kaiying Shan, Hanzhi Zhou |
| Modal          | For displaying information of a specific course                         | Kaiying Shan              |
| Pagination     | For showing a list of pages and switching between generated schedules   | Kaiying Shan, Hanzhi Zhou |
| Palette        | For customizing colors of classes and events                            | Hanzhi Zhou               |
| EventView      | A component for adding and editing events                               | Kaiying Shan, Hanzhi Zhou |

### Tool chain

Configuration of linting, formatting, building and testing tools

Hanzhi Zhou

### Continuous Integration

Hanzhi Zhou

### Models and Data Structure

These are mainly TypeScript files in [models](/templates/src/models)

| Name          | Description                                                         | Contributor               |
| ------------- | ------------------------------------------------------------------- | ------------------------- |
| Meta          | Some metadata and type definitions                                  | Hanzhi Zhou               |
| Utils         | Commonly used utility functions                                     | Hanzhi Zhou, Kaiying Shan |
| Catalog       | A wrapper for raw course catalog, course query provider             | Hanzhi Zhou               |
| Course        | A collection of sections for a specific course                      | Hanzhi Zhou               |
| Event         | A structure that holds information of an event                      | Kaiying Shan              |
| Section       | A specific section of a course                                      | Hanzhi Zhou               |
| Meeting       | A specific meeting information of a section                         | Hanzhi Zhou               |
| Schedule      | Schedule data structure, helpers for schedule rendering             | Hanzhi Zhou, Kaiying Shan |
| Notification  | A wrapper for displaying notifications to user                      | Hanzhi Zhou               |
| ScheduleBlock | A wrapper with fields required for rendering using GridSchedule.vue | Hanzhi Zhou               |

### Data Fetching and Caching

| Name               | Description                                                      | Contributor               |
| ------------------ | ---------------------------------------------------------------- | ------------------------- |
| BuildingLoader     | For loading the list of buildings and the distance matrix        | Hanzhi Zhou               |
| CatalogLoader      | For loading the catalog of courses of a given semester           | Hanzhi Zhou, Kaiying Shan |
| SemesterListLoader | For loading loading the list of semesters                        | Hanzhi Zhou               |
| Loader             | For local data fetching, expiration checking and sending request | Hanzhi Zhou               |

### Algorithm

These are mainly JavaScript files in [algorithm](/templates/src/algorithm)

| Part               | Description                                    | Contributor               |
| ------------------ | ---------------------------------------------- | ------------------------- |
| Main Algorithm     | -                                              | Zichao Hu, Hanzhi Zhou    |
| Schedule Evaluator | Compute quality indicators and perform sorting | Hanzhi Zhou, Kaiying Shan |
| TypeScript Rewrite | Rewrite everything using TypeScript            | Hanzhi Zhou               |

## Back-End

> Note: The back-end is no longer active.

Back-end mainly consists of python scripts.

| Name              | Description                          | Contributor |
| ----------------- | ------------------------------------ | ----------- |
| Data preparation  | Load and parse raw data              | Hanzhi Zhou |
| Algorithm         | -                                    | Zichao Hu   |
| Translation Layer | Translate in between data structures | Hanzhi Zhou |
| Request Handling  | -                                    | Hanzhi Zhou |
