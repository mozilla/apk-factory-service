# Developer Docs

## Requirements

* NodeJS
* Java
* Ant
* Android SDK

Running the service

    npm start

## NodeJS Coding Style

Use NodeJS callback error style. All errors should be wrapped
in an Error at the point they are noted. Errors passed up the
stack should not be re-declared.

Examples:

    if(! option.hamsterDance) {
      cb(new Error('hamsterDance is a required option');
    }

    request(opts, function(err, res, body) {
      if (err) return cb(err);
      ...
    }

Using `Error` provides good exceptions which are logged to sentry.

Services should handle errors in a sane way and not be shy about
crashing, as they are restarted and managed at a higher level.

    js-beautify -s 2 -r -f some_file.js

## Useful Tools

* java -jar lib/ext/apktool.jar d some.apk some
* jarsigner -verify -verbose some.apk
* Test Manifests http://testmanifest.com/

## Release Management

Code freeze every Friday.

Commit feature branches to master. Tag Friday's release candidate.
Example for July 22nd, 2014

    release-2014-07-22v1

Tag both apk-factory-service as well as apk-factory-library (same tag).

See [APK Factory Mana page](https://mana.mozilla.org/wiki/pages/viewpage.action?pageId=38547561) for details,
but use deployer to push to stage Friday morning.

Dev is set to auto-deploy after each commit to master.

Create a deployment etherpad for Tuesday at 2pm. [Example](https://etherpad.mozilla.org/apk-2014-07-22).

Bugzilla bugs should have their **Target-Milestone** set to the Tuesday's date.
Keywords should be set for `qa-` or `qa-needed` to give Krupa and AaronMT a heads up.

Engineers should be available Tuesday afternoon to support the release and monitor Kibana, Sentry and Graphite.

Every release should have a rollback plan, which is generally to re-deploy the previous production SHA.
If your release includes database migrations or other steps, you must have a rollback plan.