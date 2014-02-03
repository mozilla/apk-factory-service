/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* a tiny wrapper around winston that let's us route all logging in the
 * application through winston, and at a later point
 * do more complex things with logging configuration per environment if
 * needed */

var fs = require('fs.extra');
var path = require('path');

// simply export winston
var winston = require('winston');

var needsInit = true;
module.exports = function(config) {
  var logPath = path.join(config.varPath, 'log');
  var logFile = path.join(logPath, process.env.PROCESS_TYPE + '.log');
  fs.mkdirRecursiveSync(logPath);
  if (needsInit) {
    needsInit = false;
    winston.add(winston.transports.File, {
      timestap: function() { return new Date().toISOString(); },
      filename: logFile
    });
    if (! process.env.LOG_TO_CONSOLE) {
      winston.remove(winston.transports.Console);
    }
  }
  return winston;
};