/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Various metrics for system monitoring
 */

var fs = require('fs.extra');
var path = require('path');

var StatsD = require("node-statsd").StatsD;

var withConfig = require('../lib/config').withConfig;
var log, statsd;

withConfig(function(config) {
  var monolithPath = setupMonolithLog(config);

  log = require('../lib/logging')(config);

  statsd = new StatsD(config.statsd.host,
    config.statsd.port,
    process.env.PROCESS_TYPE + '-' + config.environment);

  exports.serverStarted = function(serverType) {
    statsd.increment('server-started');
    log.info(serverType + ' started');
  };

  var requests = 0;
  exports.generateApkRequest = function(manifestUrl) {
    statsd.increment('apk-generate-req');
    log.info('apk generate request for ' + manifestUrl);
    requests++;
  };

  var finished = 0;
  exports.generationApkFinished = function(manifestUrl, timeElapsed) {
    statsd.increment('apk-generate-finished');
    statsd.timing('apk-generate-dur', timeElapsed);
    log.info('apk generate finished for ' + manifestUrl + ' [' + timeElapsed + ']');
    finished++;
  };

  exports.generationApkFailed = function( /*manifestUrl*/ ) {
    statsd.increment('apk-generate-error');
  };

  exports.badManifestUrl = function(manifestUrl) {
    statsd.increment('bad-manifest-url');
    log.info('bad manifest url ' + manifestUrl);
  };
  exports.appUpdatesRequest = function() {
    statsd.increment('app-updates-req');
    log.info('/app_updates requested');
  };

  /**
   * updates - array of two element arrays [manifest, version]
   * Updates are written to a log which is ingested by Monolith
   */
  exports.apkUpdateCheck = function(updates) {
    var logLines = "";
    updates.forEach(function(update) {
      logLines += 'apk-update,"' + update[0] + '",' + update[1] + '\n';
    });
    log.info(logLines);
    fs.appendFile(monolithPath, logLines, {
      encoding: 'utf8'
    }, function(err) {
      if (err) log.error(err);
    });
  };

  exports.appUpdatesFinished = function(timeElapsed) {
    statsd.increment('app-updates-finished');
    statsd.timing('app-updates-dur', timeElapsed);
    log.info('app updates finished [' + timeElapsed + ']');
  };

  exports.appUpdatesFailed = function() {
    statsd.increment('app-updates-error');
  };

  // TODO think through holistically how to report these steps
  exports.buildingApkFailed = function(manifestUrl) {
    statsd.increment('apk-build-error');
    log.info('apk build failed for ' + manifestUrl);
  };

  exports.buildingApkFinished = function(manifestUrl, timeElapsed) {
    statsd.increment('apk-build-finished');
    statsd.timing('apk-build-dur', timeElapsed);
    log.info('build apk finished for ' + manifestUrl + ' [' + timeElapsed + ']');
  };

  exports.apkSigningRequest = function(manifestUrl) {
    statsd.increment('apk-signing-req');
    log.info('singing apk requested for ' + manifestUrl);
  };

  exports.apkSigningFinished = function(manifestUrl, timeElapsed) {
    statsd.increment('apk-signing-finished');
    statsd.timing('apk-signing-dur', timeElapsed);
    log.info('singing apk finished for ' + manifestUrl + ' [' + timeElapsed + ']');
  };

  exports.apkSigningFailed = function( /*manifestUrl*/ ) {
    statsd.increment('apk-signing-error');
  };

  exports.apkCachingFailed = function( /*manifestUrl*/ ) {
    statsd.increment('apk-caching-error');
  };

  exports.apkCachingHit = function(manifestUrl) {
    statsd.increment('apk-cache-hit');
    log.info('apk cache hit for ' + manifestUrl);
  };

  exports.apkCachingMiss = function(manifestUrl) {
    statsd.increment('apk-cache-miss');
    log.info('apk cache miss for ' + manifestUrl);
  };

  var previousRequests = 0;
  var previousCompleted = 0;
  // This is mostly useful during load testing, but this was before
  // we had statsd setup.
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

function setupMonolithLog(config) {
  var logPath = path.join(config.varPath, 'log');
  var logFile = path.join(logPath, 'monolith.log');
  fs.mkdirRecursiveSync(logPath);
  return logFile;
}
