# Contributing

First of all, thank you for considering to contribute! ╭(● ｀ ∀´●)╯╰(●’◡’●)╮

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change, and read the Get Started section of this contributing guideline to figure out where you want to make a change to this repository.

Also, please note we have a code of conduct, please follow it in all your interactions with the project.

## Get Started

This repository is intended to be modular, and it has a number of directories and files that play separate roles.

If you want to contribute to the Front End:

-   [App.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/App.vue) : the "view" of this project; the root Vue component that contains almost all of the child components and DOM elements of the main webpage.

-   [components](https://github.com/awesome-schedule/UVaAutoScheduler/tree/master/templates/src/components) : all the child Vue components.
    -   [GridSchedule.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/components/GridSchedule.vue) : the class schedule
    -   [CourseBlock.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/components/CourseBlock.vue) : each course of the schedule
    -   [Pagination.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/components/Pagination.vue) : pagination at top of the schedule for page switching
    -   [ClassList.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/components/ClassList.vue)
    -   [Modal.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/components/Modal.vue)
    -   [ClassListModal.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/components/ClassListModal.vue)
-   [models](https://github.com/awesome-schedule/UVaAutoScheduler/tree/master/templates/src/models) : the data structures that holds course information for App.vue and its child components to render.
    -   [AllRecords.js](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/models/AllRecords.js)
    -   [Schedule.js](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/models/Schedule.js)
    -   [CourseRecord.js](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/models/CourseRecord.js)
    -   [Course.js](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/models/Course.js)

## Pull Request Process

1. TBD

---
