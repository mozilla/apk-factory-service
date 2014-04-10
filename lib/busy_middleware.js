/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var toobusy = require('toobusy');

// TODO wrap in config
const throttlingEnabled = true;

if (throttlingEnabled) {
  // set maximum event loop lag from configuration, which controls
  // just how busy we need to be before sending pre-emptive 503s.
  toobusy.maxLag(300);
} else {
  // when disabled, shutdown toobusy, which casues it to stop polling
  // the event loop to determine server load.
  toobusy.shutdown();
}

module.exports = function(req, res, next) {
  if (throttlingEnabled && toobusy()) {
    res.send('{"status": "error", "message": "server is too busy"}',
            {'Content-Type': 'application/json'}, 503);
  } else {
    next();
  }
};

module.exports.shutdown = toobusy.shutdown;
