#!/bin/bash
# copy some config files for github pages
cp public/.gitattributes dist/
cp public/.nojekyll dist/
cp public/CNAME dist/

mkdir dist/docs
cp -rf docs/tsdoc dist/docs/