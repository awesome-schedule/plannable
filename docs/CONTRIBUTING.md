# Contributing :satisfied:

First of all, thank you for considering to contribute! :tada:

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change. If you are unsure about the functionality or the implementation details of a file, you can contact the authors of that file. Most of the files in our repository have @authors annotated on top.

Also, please note we have a [code of conduct](./CODE_OF_CONDUCT.md), please follow it in all your interactions with the project.

## Current List of Things You Can Do

-   Better mobile support
-   Better and more efficient fuzzy search (should be implemented in [SearchWorker.ts](/src/workers/SearchWorker.ts))
-   Better unit tests and unit tests for components (if possible)
    -   Current unit tests are not robust. Unit tests for Vue components are completely missing
-   More filters and sort options (should be implemented in [ScheduleEvaluator.ts](/src/algorithm/ScheduleEvaluator.ts) and/or [ScheduleGenerator.ts](/src/algorithm/ScheduleGenerator.ts))
-   Interface for schedule comparison and difference
-   Support other colleges!
-   Any other amazing things you want to add!

## Pull Request Process :yum:

1. Make sure that your changes are made on the dev branch or a new branch.
2. Test extensively on your local host to make sure that you didn't screw up anything.
3. When writing a pull request message, please
    1. Be clear that what type of changes you have made, e.g., fixed a bug, improved performance, changed/added functionality, updated documentation, etc.
    2. Summarize what does this pull request do and why this is worth doing.
    3. (Optional) Include any of your design decisions and alternatives that you considered.
    4. (Optional) Point out the part that you may want a more thorough review.
    5. (Optional) Add any questions, comments, or concerns that you have, including those about your changes and those about the rest of this project.
4. New pull request!

---
