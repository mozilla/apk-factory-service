/*
APK Factory Service configuration.

This file documents all of the possible configuration parameters for this
service.

Config can be provided in config files, via environment variables or sometimes
via command line arguments.

Which config files are used is determined by the CONFIG_FILES environment
variable. This can be a comma delimited list of files.

Example configs:

    CONFIG_FILES=/var/apk-factory/config/default.js,/var/apk-factory/config/production.js
    CONFIG_FILES=/var/apk-factory/config/default.js

Config files are loaded left to write and later files overwrite the values from
earlier files. So it is safe to do default.js,production.js,apk-factory44.js
Where apk-factory44.js would only contain variabels that are different for host 44.

CLI arguments overwrite environment variables.
Environment variables overwrite config file variables.

*/

// One of development, review or release
environment = "development";

// Use this directory as the temporary project directory
// CLI argument: -d or --buildDir
// Env variable: FILESYSTEM_BUILD
buildDir = "/tmp/android-projects";

// Use this directory as the directory to cache keys and apks",
// CLI argument: -c or --cacheDir
// Env variable: FILESYSTEM_CACHE
cacheDir = "/tmp/apk-cache";

// Force the projects to be built every time, i.e. don't rely on cached copies
// CLI argument: -f or --force
// TODO rename this to forceRebuild or something
force = false;

// Use the specific ip address to listen for traffic on.
// Env variable: BIND_ADDRESS
bind_address = "127.0.0.1";

// Use the specific port for the front controller HTTP server
// CLI argument: -p or --controller-port
// Env variable: CONTROLLER_SERVER_PORT
controller_server_port = 8080;

// Use the specific port for the generator HTTP server
// CLI argument: --generator-port
// Env variable: GENERATOR_SERVER_PORT
generator_server_port = 8081;

// Controller uses this endpoint to contact the generator
// CLI argument: -g or --generator-endpoint
// Env variable: GENERATOR_ENDPOINT
generator_endpoint = 'http://127.0.0.1:' + generator_server_port;

// Number of seconds manifests can be cached for
manifestCacheTTL = 60

// CLI argument: --aws-access-key-id
// Env variable: AWS_ACCESS_KEY_ID
awsAccessKeyId = 'SETME';

// CLI argument: --aws-secret-access-key
// Env variable: AWS_SECRET_ACCESS_KEY
awsSecretAccessKey = 'SETME';

awsS3PublicBucket = 'apk-release';
awsS3PrivateBucket = 'apk-temp';

// Logging defaults to creating a var dir in the top level of this project
varPath = './var';

// Log Level - debug, info, warn, or error
logLevel = 'info';

statsd = {
  host: 'localhost',
  port: 8125
}

// Sentry Config
sentryDSN = 'udp://shomesha:othersha@somewhere.com:someport/somenumber'


// URL to the APK Signer server without any paths and without a trailing
// slash. See https://github.com/mozilla/apk-signer
signerUrl = 'https://apk-signer.allizom.org';


// MySQL
mysql = {
  host: 'localhost',
  user: 'apk',
  password: 'password',
  database: 'apk_factory'
}

// Hawk authentication
hawk = {
  key: 'foobar',
  algorithm: 'sha256',
  id: 'apk-factory'
}

// Hawk authentication for Admin CLI
adminHawk = {
  key: 'foobar',
  algorithm: 'sha256',
  id: 'apk-factory-admin'
}

// Public port # for generator urls
hawkPublicControllerServerPort = 8080;

// Public port # for generator urls
hawkPublicServerPort = 8081;

// Controller only
buildQueuePollFrequencyInMilliseconds = 10 * 1000;

// Controller only
buildQueueStalePeriod = 20 * 60 * 1000; // 20 minutes ago

// Generator only
maximumNumberOfConcurrentBuilds = 10;
