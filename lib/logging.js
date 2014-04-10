/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* a tiny wrapper around winston that let's us route all logging in the
 * application through winston, and at a later point
 * do more complex things with logging configuration per environment if
 * needed */

var fs = require('fs.extra');
var path = require('path');
//var util = require('util');

//var raven = require('raven');
// simply export winston
var winston = require('winston');

//var sentry;
var needsInit = true;
module.exports = function(config) {
  var logPath = path.join(config.varPath, 'log');
  var logFile = path.join(logPath, process.env.PROCESS_TYPE + '.log');
  fs.mkdirRecursiveSync(logPath);

  //sentry = new raven.Client(config.sentryDSN);

  if (needsInit) {
    needsInit = false;
    winston.add(winston.transports.File, {
      timestamp: function() {
        return new Date().toISOString();
      },
      level: config.logLevel,
      filename: logFile
    });
    /*winston.add(Sentry, {
      timestamp: function() {
        return new Date().toISOString();
      },
      level: config.logLevel,
    });*/
    if (!process.env.LOG_TO_CONSOLE) {
      winston.remove(winston.transports.Console);
    }
  }
  return winston;
};

/*function Sentry(options) {
  this.name = 'sentryLogger';
  this.level = options.level || 'info';
}
util.inherits(Sentry, winston.Transport);

var winstonLevel = {
  warn: 'warning'
};

Sentry.prototype.log = function(level, msg, meta, cb) {
  var opts = {
    level: winstonLevel[level] || level
  };
  sentry.captureMessage(msg, opts);
  cb(null, true);
};
*/