#!/bin/bash
rm -rf dist-dev
npm run getwasm
npm run build
npm run tsdoc

mv dist dist-dev

cp public/.gitattributes dist-dev/
cp public/.nojekyll dist-dev/
mkdir -p dist-dev/docs
cp -r docs/tsdoc dist-dev/docs/

cd dist-dev
echo "dev.plannable.org" > CNAME
echo "# Development deployment of plannable

This repository is intended for testing. It is not for general use. " > README.md
git init
git config user.name updatebot
git config user.email ""
git add .
git commit -m "Deploy to dev"
git remote add origin https://github.com/awesome-schedule/dev.git
git push -u -f origin master

cd ..
rm -rf dist-dev