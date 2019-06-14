# Scripts

Although the files contained in this directory are not directly related to our website itself, it is essential for the normal operation of our mirror (https://plannable.gitee.io) in China. To operate such a mirror, we basically have to create a mirror for the resources that are located in the U.S., among which the two important ones are the website itself and the course catalog.

The execution of these scripts require push access to https://github.com/awesome-schedule/data and https://gitee.com/plannable/plannable. Normally, there is no need for you to understand or modify these scripts, nor should you execute them directly. If you want to update the data in scripts, just cd into it and call `git pull`.

## Initialization

First cd into this directory, then

```bash
git clone https://github.com/awesome-schedule/awesome-schedule.github.io
git clone https://github.com/awesome-schedule/data
```

## File Descriptions

### data_loader.ts

The data loader can update the catalog of the latest 5 semesters by simply downloading the `csv` files from Lou's list, and it executes [auto_update.sh](./auto_update.sh) once per hour.

It will also download the index page of Lou's list for getting the list of semesters.

### auto_update.sh

This is a bash script that does the following

1. pull the latest website built from the [awesome-schedule.github.io](https://github.com/awesome-schedule/awesome-schedule.github.io) repository.
2. Remove the existing `.git` directory in `data` and initialize a git repo
3. stage, commit all files and force-push to https://github.com/awesome-schedule/data
4. create an empty directory called `deploy`
5. copy `data` and `awesome-schedule.github.io` into deploy
6. initialize a git repo in deploy
7. stage, commit all files and force-push to https://gitee.com/plannable/plannable, which is the repository for the website in China

The reason for force-push is that the data files are large and it may be inappropriate to keep the file history, as it will grow fairly quickly. However, this may change in the future.
