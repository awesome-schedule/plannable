# Scripts

The scripts in this directory are used to deploy our website to our primary address (https://plannable.org) and our development website (https://dev.plannable.org). Normally, there is no need for you to understand or modify these scripts, nor should you execute them directly. 

If you want to update the data folder in scripts, make sure that you're in the project root, and run `npm run updatedata`.

## File Descriptions

### ci_common.sh

This file gets executed by GitHub Action when we push new commit to the repository. It will run tests, compile our website, and build documentation. Moreover, if the new commit is on the dev branch, it will deploy the website to https://dev.plannable.org. If new commit is on the master branch, it will deploy the website to https://plannable.org.

### data_loader.ts

The data loader can update the catalog of the latest 5 semesters by simply downloading the `csv` files from Lou's list, and it executes [auto_update.sh](./auto_update.sh) once per hour to push data to https://github.com/awesome-schedule/data.

It will also download the index page of Lou's list for getting the list of semesters.
