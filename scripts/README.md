# Scripts

The scripts in this directory are used to deploy our website on both our primary address (https://plannable.org) and our mirror (https://plannable.gitee.io) in China. To operate such a mirror, we basically have to mirror the resources that are located in the U.S., among which the two important ones are the website itself and the course catalog. Normally, there is no need for you to understand or modify these scripts, nor should you execute them directly. 

If you want to update the data in scripts, make sure that you're in the project root, and run `npm run updatedata`.

## File Descriptions

### deploy.sh

This file gets executed by the Travis CI when we push new commit to the repository. It will run tests, compile our website, and build documentation. Moreover, if the new commit is on the master branch, it will push the website and documentation built to [awesome-schedule.github.io](https://github.com/awesome-schedule/awesome-schedule.github.io) repository.

### data_loader.ts

The data loader can update the catalog of the latest 5 semesters by simply downloading the `csv` files from Lou's list, and it executes [auto_update.sh](./auto_update.sh) once per hour.

It will also download the index page of Lou's list for getting the list of semesters.

### auto_update.sh

The execution of this file requires push access to https://github.com/awesome-schedule/data and https://gitee.com/plannable/plannable.

This is a bash script that does the following

1. pull the latest website built from the [awesome-schedule.github.io](https://github.com/awesome-schedule/awesome-schedule.github.io) repository.
2. Remove the existing `.git` directory in `data` and initialize a git repo
3. stage, commit all files and force-push to https://github.com/awesome-schedule/data
4. create an empty directory called `deploy`
5. copy `data` and `awesome-schedule.github.io` into deploy
6. initialize a git repo in deploy
7. stage, commit all files and force-push to https://gitee.com/plannable/plannable, which is the repository for the website in China

The reason for force-push is that the data files are large and it may be inappropriate to keep the file history, as it will grow fairly quickly. However, this may change in the future.
