#!/bin/sh
# 17:37:17 - bwalker: curl http://107.22.148.17:8080/

tools=/tmp/tools
cache=/tmp/apk-cache
builddir=/tmp/android-projects

ANDROID_HOME=$tools/android-sdk-linux

android=$ANDROID_HOME/tools/android

# update npm.
npm install

# Tell the projects where the android-sdk is.

# Get the latest android-sdk installed,
target=$($android list target | grep -o android-[0-9]* | tail -n 1)
$android update project -s --path node_modules/apk-factory-library --target $target
$android update project --path node_modules/apk-factory-library/template


# Restart the server.
killall `which node` 2>/dev/null 1>&2
PATH=$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$PATH
/usr/bin/env node bin/server.js -p 8080 -c $cache -d $builddir --force &