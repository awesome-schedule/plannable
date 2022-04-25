#!/bin/bash
npm install -g codecov
npm ci
npm run updatedata
npm run getwasm

# http server neededfor testing
cd scripts
npx http-server -p 8000 --cors --silent &
cd ..

npm run test
npm run build
npm run tsdoc