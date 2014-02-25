/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Various metrics for system monitoring
 */

var withConfig = require('../lib/config').withConfig;
var log;

withConfig(function(config) {
  log = require('../lib/logging')(config);

  exports.serverStarted = function(serverType) {
    log.info(serverType + ' started');
  };

  var requests = 0;
  exports.generateApkRequest = function(manifestUrl) {
    log.info('apk generate request for ' + manifestUrl);
    requests++;
  };

  exports.badManifestUrl = function(manifestUrl) {
    log.info('bad manifest url ' + manifestUrl);
  };

  var finished = 0;
  exports.generationApkFinished = function(manifestUrl, timeElapsed) {
    log.info('apk generate finished for ' + manifestUrl + ' [' + timeElapsed + ']');
    finished++;
  };

  exports.appUpdatesFinished = function(timeElapsed) {
    log.info('app updates finished [' + timeElapsed + ']');
  };

  exports.generationApkFailed = function(manifestUrl) {
    log.info('apk generate FAILED for ' + manifestUrl);
  };

  // TODO think through holistically how to report these steps
  exports.buildingApkFailed = function(manifestUrl) {
    log.info('apk build failed for ' + manifestUrl);
  };

  exports.buildingApkFinished = function(manifestUrl, timeElapsed) {
    log.info('build apk finished for ' + manifestUrl + ' [' + timeElapsed + ']');
  };

  exports.apkCachingFailed = function(manifestUrl) {
    log.info('apk caching failed for ' + manifestUrl);
  };

  exports.apkCachingHit = function(manifestUrl) {
    log.info('apk cache hit for ' + manifestUrl);
  };

  exports.apkCachingMiss = function(manifestUrl) {
    log.info('apk cache miss for ' + manifestUrl);
  };

  var previousRequests = 0;
  var previousCompleted = 0;
  if ('development' === config.environment) {
    setInterval(function() {
      var newRequests = requests - previousRequests;
      previousRequests = requests;
      var completed = finished - previousCompleted;
      previousCompleted = finished;
      log.info(newRequests + ' new requests, ' + completed + ' requests completed. TOT Req:' +
               requests + 'T OT Finished: ' + finished +
               ' TOT inflight: ' + (requests - finished));
    }, 1000);
  }
});
