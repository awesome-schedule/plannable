# Contributing

First of all, thank you for considering to contribute! :tada:

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change, and read the [Get Started](#get-started-satisfied) section of this contributing guideline to figure out where you want to make a change to this repository.

Also, please note we have a [code of conduct](./CODE_OF_CONDUCT.md), please follow it in all your interactions with the project.

## Get Started :satisfied:

> Note: the current documentation is far from complete. However, a lot of information is in the comments of the source code, so please check it out.

This repository is intended to be modular, and it has a number of directories and files that play separate roles.

If you want to contribute to the Front End:

- [App.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/App.vue) : the "view" of this project; the root Vue component that contains almost all of the child components and DOM elements of the main webpage. Here is a brief introduction of the main components of the view layer:

- [components](https://github.com/awesome-schedule/UVaAutoScheduler/tree/master/templates/src/components) : all the child Vue components.

  - [GridSchedule.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/components/GridSchedule.vue) : the class schedule
  - [CourseBlock.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/components/CourseBlock.vue) : each course of the schedule
  - [Pagination.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/components/Pagination.vue) : pagination at top of the schedule for page switching
  - [ClassList.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/components/ClassList.vue) : list of courses on the first left side bar that are selected/searched.
  - [Modal.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/components/Modal.vue) : modal popped up when clicking course block.
  - [ClassListModal.vue](https://github.com/awesome-schedule/UVaAutoScheduler/blob/master/templates/src/components/ClassListModal.vue) : modal popped up when clicking the "i" button on class-list.

<img src="components.png"
     alt="components.png"
     style="margin-left: 10%; width:80%;" />

- [models](https://github.com/awesome-schedule/UVaAutoScheduler/tree/master/templates/src/models) : the data structures that holds course information for App.vue and its child components to render.

## Pull Request Process :yum:

1. Make sure that your changes are made on the dev branch or a new branch.
2. Test extensively on your local host to make sure that you didn't screw up anything.
3. In writing a pull request message,
   1. Point out which part of the code you have changed, e.g. view, model, or algorithm.
   2. Make clear that what type of changes that you have made, e.g., fixed a bug, improved performance, changed/added functionality, updated documentation, etc.
   3. Summarize what does this pull request do and why this is worth doing. Include any of your design decisions and alternatives that you considered.
   4. (Optional) Explicitly point out the part that you may want a more thoughtful review.
   5. (Optional) Add any questions, comments, or concerns that you have, including those about your changes and those about the rest of this project.
4. New pull request!

---
