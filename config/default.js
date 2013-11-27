/*
01234567890123456789012345678901234567890123456789012345678901234567890123456789
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

// Use the specific port to serve.
// CLI argument: -p or --port
// Env variable: SERVER_PORT
server_port = 8080;

// CLI argument:
// Env variable:

// CLI argument:
// Env variable: