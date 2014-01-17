APK Factory Service
===================

Web service which takes Open Web App manifests and produces Synthetic APKs.

This service depends on [APK Factory Library](https://github.com/mozilla/apk-factory-library).

[![Build Status](https://travis-ci.org/mozilla/apk-factory-service.png)](https://travis-ci.org/mozilla/apk-factory-service)

Dependencies
------------

* GraphicsMagick
* MySQL
* Java 7
* Ant (from the Android SDK)

APT-based Linux:

    sudo apt-get install graphicsmagick mysql-server
    # Android SDK also requires:
    sudo apt-get install openjdk-7-jdk ant ia32-libs

Mac OS X with brew:

    brew install graphicsmagick mariadb

Installation
------------

    # See an alternative to this line in the Work In Progress section below.
    cd node_modules && git clone https://github.com/mozilla/apk-factory-library.git

    mysql -u foo -ppassword < docs/db/schema_up_000.sql

Deployment
----------

A development server is available at http://dapk.net.

Some notes on how its process is started up:

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

Otherwise you can just use the `git clone` step from the Installation section above.
