# Verification

## Setup

One time you need to do the following to setup the verification tool.

    $ mysql -u root
    > CREATE DATABASE apk_factory_regression;
    > quit
    $ mysql -u root < int-test/db/schema_up_000.sql
    $ node int-test/scripts/get_marketplace_urls.js

Note how many files this created on the file system and edit  int-test/scripts/populate-regression-db.js

    // number of highest .json file
    var MAX_FILES = 146;

TODO: automate that...

    $ node int-test/scripts/populate-regression-db.js

You're now ready to use the verification tool.

## Usage


After deployment, you can run a verification tool.

    node int-test/regression-test.js -c config/developer.js -e  https://apk-controller.stage.mozaws.net

It is useful to also run this in a second terminal:

    watch "mysql -uroot -ppass apk_factory_regression -e 'select id, status_code, finish_dt - start_dt, error from results ORDER BY id DESC'"

The regression tool takes a list of manifest urls and runs them against an environment, looking for regressions.

We want to frequently test the following things

* Across all known APKs

* start time
* finish time
* status code
* valid jar
* Save the APK for later reference

and also run the following regression checks
* Icons (TODO)
* Debug / Non-Debug (TODO)
* Caching