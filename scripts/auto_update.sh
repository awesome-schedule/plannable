#!/bin/bash

function clear_and_commit {
    rm -rf .git
    git init 
    git config user.name updatebot
    git config user.email bot@bot.bot
    git add .
    git commit -m "update"
}

# force-update data
cd data
clear_and_commit
git remote add origin https://github.com/awesome-schedule/data
git push -f -u origin master
cd ..

# synchronize content for the mirror in China
cd awesome-schedule.github.io
git pull
cd ..

rm -rf deploy
mkdir -p deploy
cp -rf data deploy/
cp -rf awesome-schedule.github.io/. deploy/
cd deploy
clear_and_commit
git remote add origin https://gitee.com/plannable/plannable
git push -f -u origin master
cd ..