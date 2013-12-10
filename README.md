APK Factory Service
===================

Web service which takes Open Web App manifests and produces Synthetic APKs.

This service depends on [APK Factory Library](https://github.com/mozilla/apk-factory-library).

dummy-fennec
------------
This is a simplistic host app that will be replaced by fennec.

The synthetic APKs should be able to communicate with `dummy-fennec`.

Dependencies
------------

* GraphicsMagick
* MySQL

    sudo apt-get install graphicsmagick

[![Build Status](https://travis-ci.org/mozilla/apk-factory-service.png)](https://travis-ci.org/mozilla/apk-factory-service)

Work In Progress
----------------

In order to use this services, you must do the following:

    cd apk-factory-libary
    sudo npm link
    cd ../apk-factory-service
    sudo npm link ../apk-factory-library

Until we publish apk-factory-library,
you can use `npm link` to put it into the `node_modules` of this project.