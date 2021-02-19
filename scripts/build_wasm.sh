#!/bin/bash
mkdir -p public/js
cd src/algorithm
if [ $1 = "dev" ]
then
    mkdir -p temp
    make dev
    mv temp/* ../../public/js/
    rm -rf temp
elif [ $1 = "prod" ]
then
    mkdir -p temp
    make prod
    cp temp/* ../../public/js/
    cd temp
    git init .
    git config user.name "updatebot"
    git config user.email ""
    git add .
    git commit -m "update wasm build"
    git remote add origin https://github.com/awesome-schedule/wasm-build.git
    git push -u -f origin master
    cd ..
    rm -rf temp
elif [ $1 = "clean" ]
then
    make clean
else
    echo "Argument needs to be either `dev` or `prod`"
fi

