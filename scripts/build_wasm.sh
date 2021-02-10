#!/bin/bash
source ~/emsdk/emsdk_env.sh
mkdir -p public/js
cd src/algorithm
mkdir -p temp
if [ $1 = "dev" ]
then
    make dev
    mv temp/* ../../public/js/
    rm -rf temp
elif [ $1 = "prod" ]
then
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
else
    echo "Argument needs to be either `dev` or `prod`"
fi

