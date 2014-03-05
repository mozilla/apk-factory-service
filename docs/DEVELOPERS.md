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