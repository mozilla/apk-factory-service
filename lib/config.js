/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Module determines application configuraiton based on
 * the `CONFIG_FILES` environment variable.
 * Module exports one function which takes a callback.
 * Callback will have one argument, the config values.
 * If there is an error loading configuration, an
 * exception will be thrown.
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

optimist = require("optimist");

var context = vm.createContext();
var initialized = false;

function env (key) {
  var i=0, max=arguments.length, value;
  for ( ; i < max; i++) {
    value = process.env[arguments[i]];
    if (value) {
      return value;
    }
  }
}

var argv = optimist
    .usage('Usage: $0 {OPTIONS}')
    .wrap(80)
    .option('buildDir', {
        alias: "d",
        desc: "Use this directory as the temporary project directory"
    })
    .option('cacheDir', {
        alias: "c",
        desc: "Use this directory as the directory to cache keys and apks"
    })
    .option('config-files', {
        desc: "Use this list of config files for configuration",
        default: process.env['CONFIG_FILES'] ||
                 path.join(__dirname, '../config/default.js')
    })
    .option('force', {
        alias: "f",
        desc: "Force the projects to be built every time, i.e. don't rely on cached copies"
    })
    .option('port', {
        alias: "p",
        desc: "Use the specific port to serve. This will override process.env.PORT."
    })
    .option('help', {
        alias: "?",
        desc: "Display this message",
        boolean: true
    })
    .check(function (argv) {
        if (argv.help) {
            throw "";
        }

        if (!! argv.buildDir) {
          argv.buildDir = path.resolve(process.cwd(), argv.buildDir);
	}
        if (!! argv.cacheDir) {
          argv.cacheDir = path.resolve(process.cwd(), argv.cacheDir);
	}
    })
    .argv;

module.exports = function(cb) {
  if (initialized) return cb(context);
  var configPaths = argv['config-files'].split(',');
  configPaths.forEach(function(configPath) {
    var configFile;
    if (fs.existsSync(configPath)) {
      configFile = configPath;
    } else {
      configFile = path.join(process.cwd(), configPath);
    }
    vm.runInContext(fs.readFileSync(configFile), context, configFile);
  });

  // Cascade config overwrites
  context.buildDir = argv.buildDir ||
    env("FILESYSTEM_BUILD") ||
    context.buildDir;

  if (!context.buildDir) {
    throw new Error("Must specify a build directory");
  }


  context.cacheDir = argv.cacheDir || 
    env("FILESYSTEM_CACHE") ||
    context.cacheDir;

  context.force = argv.force || context.force;

  context.bind_address =
    env('BIND_ADDRESS') ||
    context.bind_address;

  context.server_port = argv.port || 
    env("SERVER_PORT") ||
    context.server_port;

  initialized = true;
  cb(context);
};