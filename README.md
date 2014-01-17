APK Factory Service
===================

Web service which takes Open Web App manifests and produces Synthetic APKs.

This service depends on [APK Factory Library](https://github.com/mozilla/apk-factory-library).

Dependencies
------------

* GraphicsMagick
* MySQL
* Java 7
* Ant

    sudo apt-get install graphicsmagick mysql-server

Android SDK requires

    sudo apt-get install openjdk-7-jdk ant ia32-libs

[![Build Status](https://travis-ci.org/mozilla/apk-factory-service.png)](https://travis-ci.org/mozilla/apk-factory-service)

Installation
------------

    cd node_modules && git clone https://github.com/mozilla/apk-factory-library.git
    mysql -u foo -ppassword < docs/db/schema_up_000.sql

Deployment
----------

A development server is available at http://dapk.net.

Some notes on how it's process is started up:

    ANDROID_HOME=/data/android-sdk-linux \
    CONFIG_FILES='/home/ubuntu/apk-factory-service/config/default.js,/home/ubuntu/apk-factory-service/config/aws.js' \
    forever start bin/controller

Work In Progress
----------------

In order to hack on this service and the library, you must do the following:

    cd apk-factory-libary
    sudo npm link
    cd ../apk-factory-service
    sudo npm link ../apk-factory-library

Otherwise you can just use the git clone step from the Install docs above.