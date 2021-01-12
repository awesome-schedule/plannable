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

Website architecture, data structure and data flow design

Hanzhi Zhou

## Front-end

### UI Design

Kaiying Shan, Hanzhi Zhou, Zichao Hu and Elena Long

### Main Component: [src/App.vue](/src/App.vue) and [src/App.ts](/src/App.ts)

Hanzhi Zhou, Kaiying Shan, Zichao Hu, Elena Long

### State Management

The state management module handles global states and storage. See [src/store](/src/store)

| Name         | Contributors           |
| ------------ | ---------------------- |
| display      | Hanzhi Zhou, Zichao Hu |
| filter       | Hanzhi Zhou, Zichao Hu |
| index        | Hanzhi Zhou            |
| modal        | Hanzhi Zhou            |
| notification | Hanzhi Zhou            |
| palette      | Hanzhi Zhou            |
| profile      | Hanzhi Zhou            |
| schedule     | Hanzhi Zhou            |
| semester     | Hanzhi Zhou            |
| status       | Hanzhi Zhou, Zichao Hu |
| store        | Hanzhi Zhou, Zichao Hu |

### Child Components

#### Tabs

Tabs are components holding the corresponding tab triggered when one clicks the icon on the side bar. [src/components](/src/components/tabs) folder.

| Name        | Contributors                                     |
| ----------- | ------------------------------------------------ |
| ClassView   | Hanzhi Zhou                                      |
| CompareView | Kaiying Shan, Hanzhi Zhou                        |
| DisplayView | Kaiying Shan, Hanzhi Zhou                        |
| EventView   | Kaiying Shan, Hanzhi Zhou, Zichao Hu             |
| ExportView  | Hanzhi Zhou, Kaiying Shan, Zichao Hu             |
| FilterView  | Hanzhi Zhou, Kaiying Shan                        |
| FuzzyView   | Hanzhi Zhou                                      |
| Information | Kaiying Shan, Hanzhi Zhou, Zichao Hu, Elena Long |
| LogView     | Hanzhi Zhou                                      |
| PaletteView | Hanzhi Zhou                                      |

#### Miscellaneous components

These components are used by tabs and the root component (App.vue).

They are located in [src/components](/src/components) folder.

| Name         | Contributors              |
| ------------ | ------------------------- |
| ClassList    | Hanzhi Zhou               |
| CourseBlock  | Kaiying Shan              |
| CourseModal  | Kaiying Shan, Hanzhi Zhou |
| GridSchedule | Kaiying Shan              |
| MainContent  | Hanzhi Zhou               |
| Pagination   | Kaiying Shan, Hanzhi Zhou |
| SectionModal | Kaiying Shan, Hanzhi Zhou |
| URLModal     | Hanzhi Zhou               |

### Tool chain

Configuration of linting, formatting, building and testing tools

Hanzhi Zhou

### Continuous Integration

Maintenance of CI, code quality tools and coverage reports

Hanzhi Zhou

### Models and Data Structure

The underlying models and data structures are the core of our website. These are mainly TypeScript files in [src/models](/src/models)

| Name          | Contributors              |
| ------------- | ------------------------- |
| Catalog       | Hanzhi Zhou               |
| Course        | Hanzhi Zhou               |
| Event         | Kaiying Shan              |
| Meeting       | Hanzhi Zhou               |
| Schedule      | Hanzhi Zhou, Kaiying Shan |
| ScheduleBlock | Hanzhi Zhou               |
| Section       | Hanzhi Zhou               |

### Workers

Web workers are used to execute performance-expensive operations in dedicated process. See [src/workers](/src/workers)

| Name         | Contributors              |
| ------------ | ------------------------- |
| SearchWorker | Kaiying Shan, Hanzhi Zhou |

### Utilities

Commonly used utility functions, found in [src/utils](/src/utils)

| Name         | Contributors                         |
| ------------ | ------------------------------------ |
| ICal         | Kaiying Shan                         |
| Notification | Hanzhi Zhou                          |
| time         | Hanzhi Zhou, Kaiying Shan, Zichao Hu |
| other        | Hanzhi Zhou, Kaiying Shan            |

### Data Fetching and Caching

| Name               | Contributors              |
| ------------------ | ------------------------- |
| BuildingLoader     | Hanzhi Zhou               |
| CatalogLoader      | Hanzhi Zhou, Kaiying Shan |
| Loader             | Hanzhi Zhou               |
| SemesterListLoader | Hanzhi Zhou               |
| data/Distance      | Zichao Hu                 |

### Algorithm

We use a number of algorithms to generate, sort and render schedules. They can be found in [src/algorithm](/src/algorithm)

| Name              | Contributors                         |
| ----------------- | ------------------------------------ |
| ScheduleGenerator | Hanzhi Zhou, Zichao Hu, Kaiying Shan |
| Graph             | Hanzhi Zhou                          |
| ScheduleEvaluator | Hanzhi Zhou                          |
| FastSearcher      | Kaiying Shan, Hanzhi Zhou            |

### Testing

For unit tests, see [tests/unit](/tests/unit)

Hanzhi Zhou, Zichao Hu

### Documentation

Inline doc writing and doc building

Hanzhi Zhou

### Marketing

Kathy Ju, Zichao Hu

### Acknowledgement

Special thanks to

1. Prof. Lou Bloomfield for updating Lou's list to provide up-to-date data
2. Annie Cao for fetching major data from the registrar
