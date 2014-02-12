/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Various metrics for system monitoring
 */

var withConfig = require('../lib/config').withConfig;

exports.serverStarted = function(serverType) {
  console.log(serverType, 'started');
};

var requests = 0;
exports.generateApkRequest = function(/*manifestUrl*/) {
  requests++;
};

exports.badManifestUrl = function() {

};

var finished = 0;
exports.generationApkFinished = function(/*timeEllapsed*/) {
  finished++;
};

exports.generationApkFailed = function() {

};

var previousRequests = 0;
var previousCompleted = 0;

withConfig(function(config) {
  var log = require('../lib/logging')(config);
  if ('development' === config.environment) {
    setInterval(function() {
      var newRequests = requests - previousRequests;
      previousRequests = requests;
      var completed = finished - previousCompleted;
      previousCompleted = finished;

      log.info(newRequests, 'new requests,', completed, 'requests completed. TOT Req:', requests, 'TOT Finished:', finished, 'TOT inflight:', requests - finished);
    }, 1000);
  }
});
          