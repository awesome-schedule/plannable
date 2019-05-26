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

Hanzhi Zhou, Kaiying Shan, Elena Long

### State Management

The state management module handles global states and storage. See [src/store](/src/store)

| Name         | Contributors |
| ------------ | ------------ |
| display      | Hanzhi Zhou  |
| filter       | Hanzhi Zhou  |
| index        | Hanzhi Zhou  |
| modal        | Hanzhi Zhou  |
| notification | Hanzhi Zhou  |
| palette      | Hanzhi Zhou  |
| schedule     | Hanzhi Zhou  |
| semester     | Hanzhi Zhou  |
| status       | Hanzhi Zhou  |

### Child Components

#### Tabs

Tabs are components holding the corresponding tab triggered when one clicks the icon on the side bar. [src/components](/src/components/tabs) folder.

| Name        | Contributors                                     |
| ----------- | ------------------------------------------------ |
| ClassView   | Hanzhi Zhou                                      |
| EventView   | Kaiying Shan                                     |
| DisplayView | Kaiying Shan, Hanzhi Zhou                        |
| FilterView  | Hanzhi Zhou, Kaiying Shan                        |
| PaletteView | Hanzhi Zhou                                      |
| ExportView  | Kaiying Shan, Hanzhi Zhou                        |
| Information | Kaiying Shan, Hanzhi Zhou, Zichao Hu, Elena Long |

#### Miscellaneous components

These components are used by tabs and the root component (App.vue).

They are located in [src/components](/src/components) folder.

| Name         | Contributors              |
| ------------ | ------------------------- |
| ClassList    | Hanzhi Zhou               |
| CourseBlock  | Kaiying Shan              |
| CourseModal  | Kaiying Shan, Hanzhi Zhou |
| GridSchedule | Kaiying Shan              |
| Pagination   | Kaiying Shan, Hanzhi Zhou |
| SectionModal | Kaiying Shan, Hanzhi Zhou |

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
