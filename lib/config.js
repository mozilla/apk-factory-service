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

var context = vm.createContext();
var initialized = false;

module.exports = function(cb) {
  if (initialized) return cb(context);
  var configPaths = process.env['CONFIG_FILES'].split(',');
  configPaths.forEach(function(configPath) {
    var configFile;
    if (fs.existsSync(configPath)) {
      configFile = configPath;
    } else {
      configFile = path.join(process.cwd(), configPath);
    }
    vm.runInContext(fs.readFileSync(configFile), context, configFile);
  });
  initialized = true;
  cb(context);
};