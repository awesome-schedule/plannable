#!/bin/bash

# this file can only be run on root directory due to jest configuration and module bundler

# default export vue emvironment to current shell
export VUE_CLI_BABEL_TARGET_NODE=true
export VUE_CLI_BABEL_TRANSPILE_MODULES=true
echo 'vue env set' 
dirName="$(dirname "$0")"


if [ $# -eq 0 ]
then
    exit
else
    for param in $*
    do
        if [ $param = -all ]
        then
        # -all runs test on all the files
        $dirName/node_modules/jest/bin/jest.js --clearCache
        node --inspect-brk $dirName/node_modules/jest/bin/jest.js -i 
            echo $param
        else 
        # specifies a cetain file and if it matches the certain file will be run on
            path=$(echo $param | grep '/*.spec.ts')
            file=${path##*/}
            if [[ $path != "" ]]
            then
                $dirName/node_modules/jest/bin/jest.js --clearCache
                node --inspect-brk $dirName/node_modules/jest/bin/jest.js -i $dirName/tests/unit/$file
            else
                echo "Please provide either -all option or ***.spec.ts file to test on"
            fi
        fi
    done
fi

