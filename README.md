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
* unzip (UnZip, by Info-ZIP will work)

APT-based Linux:

    sudo apt-get install graphicsmagick mysql-server
    # Android SDK also requires:
    sudo apt-get install openjdk-7-jdk ant ia32-libs unzip

Mac OS X with brew:

    brew install graphicsmagick mariadb

Installation
------------

    # Clone apk-factory-library
    cd lib/ext && git clone https://github.com/mozilla/apk-factory-library.git

    # Create the database and an *apk* user with privileges on it.
    mysql.server start
    mysql -u root < docs/db/schema_up_000.sql
    mysql -u root -e "CREATE USER 'apk'@'localhost' IDENTIFIED BY 'password';"
    mysql -u root -e "GRANT ALL PRIVILEGES ON apk_factory.* TO 'apk'@'localhost';"

[Notes on Android SDK](https://wiki.mozilla.org/Mobile/Fennec/Android#Install_Android_SDK)

Please read [config/default.js](config/default.js) which documents the various
configuration paramters and allowable values.

CLI
---

There is a command line interface to create APKs locally.

    node  --endpoint=http://localhost:8080 bin/cli.js http://people.mozilla.org/~fdesre/openwebapps/package.manifest application.apk

Testing
-------

Unit tests

    $ npm test

Integration tests

     $ ./node_modules/.bin/tap --timeout=120 int-test/integration-test.js

or to target a different environment

     $ APK_ENDPOINT='http://dapk.net' tap int-test/integration-test.js

Deployment
----------

A development server is available at http://dapk.net.

Some notes on how its process is started up:

    ANDROID_HOME=/data/android-sdk-linux \
    CONFIG_FILES='/home/ubuntu/apk-factory-service/config/default.js,/home/ubuntu/apk-factory-service/config/aws.js' \
    forever start bin/controller

Command Line Interface
----------------------

    node bin/cli.js

