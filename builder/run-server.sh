#!/bin/sh
# 17:37:17 - bwalker: curl http://107.22.148.17:808080/
npm install

tools=/tmp/tools
cache=/tmp/apk-cache
builddir=/tmp/android-projects
android=$tools/android-sdk-linux/tools/android
$android update project -p template
$android update project -p ../library
killall node
(PATH=$tools/android-sdk-linux/tools:$tools/android-sdk-linux/platform-tools:$PATH ; /usr/bin/node lib/server.js -p 8080 -c $cache -d $builddir --force &)