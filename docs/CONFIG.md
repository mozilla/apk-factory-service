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

These should be set for both the controller and generator deamons

### environment
environment - Either development, review or release

    environment = "release";

This is the main way to control if you are deploying the reviewer or release instance.
This should match `signerUrl`.

### bind_address
Use the specific ip address to listen for traffic for deamon (such as generator or controller)

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

### hawk
Hawk authentication nested config of `key`, `algorithm`, and `id`.
**values must match** between controller, generator, and **APK Signer**

    hawk = {
      key: 'foobar',
      algorithm: 'sha256',
      id: 'apk-factory'
    }

## Controller Only Config

### controller_server_port
Use the specific port for the front controller HTTP server

    controller_server_port = 8080;

### generator_endpoint
Controller uses this endpoint to contact the generator.

    generator_endpoint = 'https://apk-generator-release.mozilla.org'

### mysql

Nested config of `host`, `user`, `password`, and `database`.
Used by the controller to manage apk caching and updates.

    mysql = {
      host: 'localhost',
      user: 'apk',
      password: 'password',
      database: 'apk_factory'
    }

## Generator Only Config

### generator_server_port
Use the specific port for the generator HTTP server

    generator_server_port = 8081;

### signerUrl

URL to the APK Signer server without any paths and without a trailing
slash. See https://github.com/mozilla/apk-signer

    signerUrl = 'https://apk-signer.allizom.org';

## Development Only Config

**IGNORE FOR STAGE / PRODUCTION**

These configs can be ignored for stage and production deployments

* buildDir
* cacheDir
* force
