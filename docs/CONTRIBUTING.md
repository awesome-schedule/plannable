# Contributing

First of all, thank you for considering to contribute! :tada:

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change, and read the [Get Started](#get-started-satisfied) section of this contributing guideline to figure out where you want to make a change to this repository.

Also, please note we have a [code of conduct](./CODE_OF_CONDUCT.md), please follow it in all your interactions with the project.

## Get Started :satisfied:

> Note: the current documentation is far from complete. However, a lot of information is in the comments of the source code, so please check it out.

> Our TSDoc (documentation built from JSDoc-like docstrings) is available at https://awesome-schedule.github.io/docs/tsdoc/

Our website is a single-page application (SPA). Our source code is intended to be modular, and it has a number of directories and files that play separate roles.

-   [App.vue](/src/App.vue) : the root component
-   [components](/src/components) : all the child components
-   [algorithm](/src/algorithm) : algorithm for schedule building and rendering
-   [models](/src/models) : models and data structures used to store and manipulate data
-   [utils](/src/utils): utilities used across the whole project

<img src="components.png"
     alt="components.png"
     style="margin-left: 10%; width:80%;" />

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
