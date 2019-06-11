#!/bin/bash
cd awesome-schedule.github.io
git pull
cd ..
rm -rf deploy
mkdir -p deploy
cp -rf data deploy/
cp -rf awesome-schedule.github.io/. deploy/
cd deploy
rm -rf .git
rm -rf data/.git
git init 
git add .
git commit -m "update"
git remote add origin https://gitee.com/plannable/plannable
git push -f -u origin master