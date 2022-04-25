#!/bin/bash

function clear_and_commit {
    rm -rf .git
    git init 
    git config user.name updatebot
    git config user.email ""
    git add .
    git commit -m "update"
}

# force-update data
cd data
clear_and_commit
git remote add origin https://github.com/awesome-schedule/data
git push -f -u origin master
cd ..
