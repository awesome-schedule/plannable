#!/bin/bash
npm install -g codecov
npm ci
npm run getwasm
npm run test
npm run build