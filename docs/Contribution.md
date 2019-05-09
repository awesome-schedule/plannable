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

Data structure and flow design

Hanzhi Zhou

## Front-end

### UI Design

Kaiying Shan, Hanzhi Zhou, Zichao Hu and Elena Long

### Main Component: [App.vue](/src/App.vue)

| Part Name             | Contributors              |
| --------------------- | ------------------------- |
| Schedule Rendering    | Kaiying Shan              |
| Tab Switching         | Kaiying Shan, Hanzhi Zhou |
| Semester Switching    | Hanzhi Zhou               |
| Course Manipulation   | Hanzhi Zhou               |
| Storage and Cache     | Hanzhi Zhou, Kaiying Shan |
| Sorting Options       | Hanzhi Zhou               |
| Filters               | Kaiying Shan, Hanzhi Zhou |
| Display Options       | Kaiying Shan              |
| Algorithm Integration | Hanzhi Zhou, Kaiying Shan |
| Import/Export         | Kaiying Shan, Hanzhi Zhou |

### Child Components

Child components are in the [components](/src/components) folder.

| Name         | Contributors              |
| ------------ | ------------------------- |
| ClassList    | Hanzhi Zhou               |
| CourseBlock  | Kaiying Shan, Hanzhi Zhou |
| CourseModal  | Kaiying Shan, Hanzhi Zhou |
| EventView    | Kaiying Shan, Hanzhi Zhou |
| GridSchedule | Kaiying Shan              |
| Pagination   | Kaiying Shan, Hanzhi Zhou |
| Palette      | Hanzhi Zhou               |
| SectionModal | Kaiying Shan              |

### Tool chain

Configuration of linting, formatting, building and testing tools

Hanzhi Zhou

### Continuous Integration

Maintenance of CI, code quality tools and coverage reports

Hanzhi Zhou

### Models and Data Structure

The underlying models and data structures are the core of our website. These are mainly TypeScript files in [models](/src/models)

| Name          | Contributors              |
| ------------- | ------------------------- |
| Catalog       | Hanzhi Zhou               |
| Course        | Hanzhi Zhou               |
| Event         | Kaiying Shan              |
| Meeting       | Hanzhi Zhou               |
| Meta          | Hanzhi Zhou               |
| Schedule      | Hanzhi Zhou, Kaiying Shan |
| ScheduleBlock | Hanzhi Zhou               |
| Section       | Hanzhi Zhou               |

### Utilities

Commonly used utility functions, found in [src/utils](/src/utils)

| Name         | Contributors              |
| ------------ | ------------------------- |
| ICal         | Kaiying Shan              |
| Notification | Hanzhi Zhou               |
| time         | Hanzhi Zhou, Kaiying Shan |
| other        | Hanzhi Zhou, Kaiying Shan |

### Data Fetching and Caching

| Name               | Contributors              |
| ------------------ | ------------------------- |
| BuildingLoader     | Hanzhi Zhou               |
| CatalogLoader      | Hanzhi Zhou, Kaiying Shan |
| Loader             | Hanzhi Zhou               |
| SemesterListLoader | Hanzhi Zhou               |

### Algorithm

We use a number of algorithms to generate, sort and render schedules. They can be found in [src/algorithm](/src/algorithm)

| Name               | Contributors           |
| ------------------ | ---------------------- |
| Schedule Generator | ZiChao Hu, Hanzhi Zhou |
| Coloring           | Hanzhi Zhou            |
| Graph              | Hanzhi Zhou            |
| Schedule Evaluator | Hanzhi Zhou            |

### Testing

For unit tests, see [tests/unit](/tests/unit)

Hanzhi Zhou

### Documentation

Inline doc writing and doc building

Hanzhi Zhou

## Back-End

> Note: The back-end is no longer active.

Back-end mainly consists of python scripts.

| Name              | Description                          | Contributor |
| ----------------- | ------------------------------------ | ----------- |
| Data preparation  | Load and parse raw data              | Hanzhi Zhou |
| Algorithm         | -                                    | Zichao Hu   |
| Translation Layer | Translate in between data structures | Hanzhi Zhou |
| Request Handling  | -                                    | Hanzhi Zhou |
