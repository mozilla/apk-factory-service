# Production Configuration

This documents how to configure this software for production deployment using
config files.

Note: For dev and test, one can also use environment variables or command line arguments
to override these file based configs.

## Config Files
Config files are loaded from the `CONFIG_FILES` environment variable.
It is a comma delimited string.

    export CONFIG_FILES=/etc/apk-factory/default.js,/etc/apk-factory/generator.js

## Common Config Parameters

These should be set for both the controller and generator daemons

### environment
environment - Either development, review or release

    environment = "release";

This is the main way to control if you are deploying the reviewer or release instance.
This should match `signerUrl`.

### bind_address
Use the specific ip address to listen for traffic for daemon (such as generator or controller)

    bind_address = "127.0.0.1";

### awsAccessKeyId

    awsAccessKeyId = 'SETME';

### awsSecretAccessKey

    awsSecretAccessKey = 'SETME';

### awsS3PublicBucket

Note: Public bucket will be hooked up to Cloudflare for CDN

Public buckets are used as a file system between the generator
and apk-signer and finally read by the controller.

We might be able to remove this config from the controller eventually.

    awsS3PublicBucket = 'apk-release';

### awsS3PrivateBucket

Private buckets are used as a file system between the generator
and apk-signer and finally read by the controller.

    awsS3PrivateBucket = 'apk-temp';

### varPath

Controls where log files are written

    varPath = './var';

### logLevel

Controls how verbose logging is. Must be one of `debug`, `info`, `warn`, or
`error`. Logs that level and anything more important.

    logLevel = 'info';

### hawk
Hawk authentication nested config of `key`, `algorithm`, and `id`.
**values must match** between controller, generator, and **APK Signer**

    hawk = {
      key: 'foobar',
      algorithm: 'sha256',
      id: 'apk-factory'
    }

### statsd

Important metrics or events are sent to statsd.
Stats will be written to apk-controller-release
or apk-generator-review, so it is safe to use
the same statsd instance for reviewer and release
for a given environment like production.

    statsd = {
      host: 'localhost',
      port: 8125
    }

### sentryDSN

Sentry logging endpoint. App update states are written to Sentry.

sentryDSN = 'udp://shomesha:othersha@somewhere.com:someport/somenumber'

## Controller Only Config

### controller_server_port
Use the specific port for the front controller HTTP server

    controller_server_port = 8080;

### generator_endpoint
Controller uses this endpoint to contact the generator.

    generator_endpoint = 'https://apk-generator-release.mozilla.org'

### manifestCacheTTL

Manfiests are cached for this number of seconds

    manifestCacheTTL=60

### mysql

Nested config of `host`, `user`, `password`, and `database`.
Used by the controller to manage apk caching and updates.

    mysql = {
      host: 'localhost',
      user: 'apk',
      password: 'password',
      database: 'apk_factory'
    }

### adminHawk
Hawk authentication nested config of `key`, `algorithm`, and `id`.
**values must match** between the admin CLI and the controller

    hawk = {
      key: 'fizzbuzz',
      algorithm: 'sha256',
      id: 'apk-factory-admin'
    }

Make the apk-factory-admin key different than the apk-factory key.
This config will be shared with admins like Dev / QA / Ops desktop
machines.

### hawkPublicControllerServerPort

Hawk's server authentication between the admin CLI and controller
needs to know what port number is publically exposed, even
if the daemon binds to a different one internally.

Example: 443 in production.

    hawkPublicControllerServerPort = 8080;

## Generator Only Config

### generator_server_port
Use the specific port for the generator HTTP server

    generator_server_port = 8081;

### signerUrl

URL to the APK Signer server without any paths and without a trailing
slash. See https://github.com/mozilla/apk-signer

    signerUrl = 'https://apk-signer.allizom.org';

### hawkPublicServerPort

Hawk's server authentication between the controller and generator
needs to know what port number is publically exposed, even
if the daemon binds to a different one internally.

Example: 443 in production.

    hawkPublicServerPort = 8081;

### maximumNumberOfConcurrentBuilds

Limit total number of active builds with maximumNumberOfConcurrentBuilds. Defaults to `10`.

## Development Only Config

**IGNORE FOR STAGE / PRODUCTION**

These configs can be ignored for stage and production deployments

* buildDir
* cacheDir
* force
