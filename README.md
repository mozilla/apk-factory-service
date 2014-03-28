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

    brew install libtiff graphicsmagick mariadb

Installation
------------

    # Clone apk-factory-library
    cd lib/ext && git clone https://github.com/mozilla/apk-factory-library.git

    # Create the database and an *apk* user with privileges on it.
    mysql.server start
    mysql -u root < docs/db/schema_up_000.sql
    mysql -u root -e "CREATE USER 'apk'@'localhost' IDENTIFIED BY 'password';"
    mysql -u root -e "GRANT ALL PRIVILEGES ON apk_factory.* TO 'apk'@'localhost';"

Install the [Android SDK](http://developer.android.com/sdk/index.html).
See [Notes on Android SDK](https://wiki.mozilla.org/Mobile/Fennec/Android#Install_Android_SDK)
for common setup instructions.
You'll need to expose the SDK path with something like this:

    export ANDROID_HOME=~/Downloads/adt-bundle-mac/sdk/
    export ANDROID_SDK_HOME=$ANDROID_HOME

You need to have API 19 (or maybe higher?). Check for
`adt-bundle-mac/sdk/platforms/android-19/`.

Please read [config/default.js](config/default.js) which documents the various
configuration paramters and allowable values.

Local development
-----------------

You'll probably want to point your local generator to a local
[APK Signer](https://github.com/mozilla/apk-signer).
See `config/default.js` for where to set its URL.

After setting `ANDROID_HOME`, fire up your local controller and generator
servers like:

    npm start

If everything is configured you should be able to post a manifest to your controller
and get a binary APK response. Try this:

    curl -v 'http://127.0.0.1:8080/application.apk?manifestUrl=http://deltron3030.testmanifest.com/manifest.webapp'

    curl -v -H "Content-Type: application/json" -X POST -d '{ "installed":{"http://deltron3030.testmanifest.com/manifest.webapp":1394909578}}' https://localhost:8080/app_updates

You can generate manifests at [testmanifest.com](http://testmanifest.com/).

CLI
---

There is a command line interface to create APKs locally.

    node  --endpoint=http://localhost:8080 bin/cli.js http://people.mozilla.org/~fdesre/openwebapps/package.manifest application.apk

Testing
-------

Unit tests

    $ npm test

Integration tests

     $ INT_TESTING=true npm start
     $ ./node_modules/.bin/tap --timeout=999999 int-test/integration-test.js

or to target a different environment

     $ APK_ENDPOINT='http://dapk.net' tap int-test/integration-test.js

Deployment
----------

### Production

* Release https://controller.apk.firefox.com
* Review https://controller-review.apk.firefox.com

### Stage

* Release https://apk-controller.stage.mozaws.net
* Review https://apk-controller-review.stage.mozaws.net

### Dev

Dev server is automatically deployed from master after a commit

https://apk-controller.dev.mozaws.net

### OLD Dev Server
A **former** development server is available at http://dapk.net.

Some notes on how its process is started up:

    ANDROID_HOME=/data/android-sdk-linux \
    CONFIG_FILES='/home/ubuntu/apk-factory-service/config/default.js,/home/ubuntu/apk-factory-service/config/aws.js' \
    forever start bin/controller

Command Line Interface
----------------------

    node bin/cli.js

