#!/bin/bash
mkdir -p public/js
cd public/js
git clone https://github.com/awesome-schedule/wasm-build
mv wasm-build/graph.* .
rm -rf wasm-build