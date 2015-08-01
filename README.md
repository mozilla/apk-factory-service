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

    sudo apt-get install graphicsmagick  mysql-server g++
    # Android SDK also requires:
    sudo apt-get install openjdk-7-jdk ant ia32-libs unzip

Mac OS X with brew:

    brew install libtiff graphicsmagick mariadb

Installation
------------

    # Clone apk-factory-library
    cd lib/ext && git clone https://github.com/mozilla/apk-factory-library.git
    cd ../..
    npm rebuild

    # Create the database and an *apk* user with privileges on it.
    mysql.server start
    mysql -u root < docs/db/schema_up_000.sql
    mysql -u root < docs/db/schema_up_001.sql
    mysql -u root < docs/db/schema_up_002.sql
    mysql -u root -e "CREATE USER 'apk'@'localhost' IDENTIFIED BY 'password';"
    mysql -u root -e "GRANT ALL PRIVILEGES ON apk_factory.* TO 'apk'@'localhost';"

Install the [Android SDK](http://developer.android.com/sdk/index.html).
See [Notes on Android SDK](https://wiki.mozilla.org/Mobile/Fennec/Android#Install_Android_SDK)
for common setup instructions.
You'll need to expose the SDK path with something like this:

    export JAVA_HOME=/usr/lib/jvm/java-7-openjdk-amd64
    export ANDROID_HOME=~/Downloads/adt-bundle-mac/sdk/

You need to have API 19 (or maybe higher?). Check for
`adt-bundle-mac/sdk/platforms/android-19/`.

Please read [config/default.js](config/default.js) which documents the various
configuration paramters and allowable values.

Use `config/developer.js` to override any settings.

    cp config/developer.js-dist config/developer.js

Local development
-----------------

One time install of development only modules

    npm install node-inspector tape

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

You can attach a debugger via two tabs in Chrome, if you do this instead of `npm start`

    node scripts/development-server.js debug

And then load in Chrome:

* [Controller Node Inspector](http://localhost:8888/debug?port=5858)
* [Generator Node Inspector](http://localhost:8889/debug?port=5859)

Logs will appear in var/log

Logs will appear in `var/log/apk-generator.log` and `var/log/apk-controller.log`


Testing
-------

Unit tests

    $ npm test

Integration tests

     $ INT_TESTING=true npm start
     $ ./node_modules/.bin/tap --timeout=999999 int-test/integration-test.js

or to target a different environment

     $ APK_ENDPOINT='http://dapk.net' tap int-test/integration-test.js

To check if things are working, you can request an APK build from your local
server like this:

    curl -v -o application.apk 'http://localhost:8080/application.apk?manifestUrl=https://yacht.paas.allizom.org/yacht/manifest.webapp'

Where the `manifestUrl` is a valid link to an open web app manifest.

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

Monitoring
----------

Check out the [monitoring documentation](./docs/MONITORING.md).
