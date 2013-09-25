#!/bin/bash
tools=/tmp/tools
archives=$(cd tools ; pwd)
mkdir -p $tools 2>/dev/null
cd $tools
tar zxvf $archives/android-sdk_r22.0.5-linux.tgz
unzip $archives/platform-tools_r18.0.1-linux.zip -d android-sdk-linux
unzip $archives/android-18_r01.zip -d android-sdk-linux/platforms
unzip $archives/build-tools_r18.0.1-linux.zip -d android-sdk-linux/build-tools