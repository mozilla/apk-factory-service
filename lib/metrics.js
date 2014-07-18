/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Various metrics for system monitoring
 */

var fs = require('fs.extra');
var path = require('path');

var uuid = require('node-uuid');

var StatsD = require("node-statsd").StatsD;
var logError = require('./log_error');
var withConfig = require('../lib/config').withConfig;
var log, statsd;

const ALWAYS = 1;
const SOMETIMES = 1; // Reduce to 0.1 or another sample as APK traffic grows

withConfig(function(config) {
  var monolithPath = setupMonolithLog(config);

  log = require('../lib/logging')(config);

  statsd = new StatsD(config.statsd.host,
    config.statsd.port,
    process.env.PROCESS_TYPE + '-' + config.environment + '.');

  exports.serverStarted = function(serverType) {
    statsd.increment('server.started', 1, SOMETIMES, statsdCb);
    log.info(serverType + ' started');
  };

  var requests = 0;
  exports.generateApkRequest = function(manifestUrl) {
    statsd.increment('apk-generate.req', 1, SOMETIMES, statsdCb);
    log.info('apk generate request for ' + manifestUrl);
    requests++;
  };

  var finished = 0;
  exports.generationApkFinished = function(manifestUrl, timeElapsed) {
    statsd.increment('apk-generate.finished', 1, SOMETIMES, statsdCb);
    statsd.timing('apk-generate.dur', timeElapsed, SOMETIMES, statsdCb);
    log.info('apk generate finished for ' + manifestUrl + ' [' + timeElapsed + ']');
    finished++;
  };

  exports.generationApkFailed = function( /*manifestUrl*/ ) {
    statsd.increment('apk-generate.error', 1, SOMETIMES, statsdCb);
  };

  exports.badManifestUrl = function(manifestUrl) {
    statsd.increment('bad-manifest-url', 1, SOMETIMES, statsdCb);
    log.info('bad manifest url ' + manifestUrl);
  };

  exports.appUpdatesRequest = function() {
    statsd.increment('app-updates.req', 1, SOMETIMES, statsdCb);
    log.info('/app_updates requested');
  };

  /**
   * updates - array of three element arrays [manifest, version, date]
   * Updates are written to a log which is ingested by Monolith
   */
  exports.apkUpdateCheck = function(updates) {
    // clientId groups log lines, but has no continuity to actual users
    var clientId = uuid.v4();
    var logLines = '';
    updates.forEach(function(update) {
      logLines += 'apk-update,' + clientId + ',"' + update[0] + '",' + update[1] +
        ',' + update[2] + '\n';
    });
    log.info(logLines);
    logLines += 'apk-update-apps-installed,' + updates.length + ',' +
      new Date().toISOString() + '\n';
    fs.appendFile(monolithPath, logLines, {
      encoding: 'utf8'
    }, function(err) {
      if (err) logError(log, 'Unable to append to monolith log ' + monolithPath, err);
    });
  };

  /**
   * Build Requests - manifestUrl and date request was made.
   * build requests are written to a log which is ingested by Monolith
   */
  exports.apkRequest = function(manifestUrl, date) {
    var logLines = 'apk-install,"' + manifestUrl + '",' + date + '\n';
    fs.appendFile(monolithPath, logLines, {
      encoding: 'utf8'
    }, function(err) {
      if (err) logError(log, 'Unable to append to monolith log ' + monolithPath, err);
    });
  };

  exports.appUpdatesFinished = function(timeElapsed) {
    statsd.increment('app-updates.finished', 1, SOMETIMES, statsdCb);
    statsd.timing('app-updates.dur', timeElapsed, SOMETIMES, statsdCb);
    log.info('app updates finished [' + timeElapsed + ']');
  };

  exports.appUpdatesFailed = function() {
    statsd.increment('app-updates.error', 1, SOMETIMES, statsdCb);
  };

  // TODO think through holistically how to report these steps
  exports.buildingApkFailed = function(manifestUrl) {
    statsd.increment('apk-build.error', 1, SOMETIMES, statsdCb);
    log.info('apk build failed for ' + manifestUrl);
  };

  exports.buildingApkFinished = function(manifestUrl, timeElapsed) {
    statsd.increment('apk-build.finished', 1, SOMETIMES, statsdCb);
    statsd.timing('apk-build.dur', timeElapsed, SOMETIMES, statsdCb);
    log.info('build apk finished for ' + manifestUrl + ' [' + timeElapsed + ']');
  };

  exports.apkSigningRequest = function(manifestUrl) {
    statsd.increment('apk-signing.req', 1, SOMETIMES, statsdCb);
    log.info('singing apk requested for ' + manifestUrl);
  };

  exports.apkSigningFinished = function(manifestUrl, timeElapsed) {
    statsd.increment('apk-signing.finished', 1, SOMETIMES, statsdCb);
    statsd.timing('apk-signing.dur', timeElapsed, SOMETIMES, statsdCb);
    log.info('singing apk finished for ' + manifestUrl + ' [' + timeElapsed + ']');
  };

  exports.apkSigningFailed = function( /*manifestUrl*/ ) {
    statsd.increment('apk-signing.error', 1, SOMETIMES, statsdCb);
  };

  exports.apkCachingFailed = function( /*manifestUrl*/ ) {
    statsd.increment('apk-caching.error', 1, SOMETIMES, statsdCb);
  };

  exports.apkCachingHit = function(manifestUrl) {
    statsd.increment('apk-cache.hit', 1, SOMETIMES, statsdCb);
    log.info('apk cache hit for ' + manifestUrl);
  };

  exports.apkCachingMiss = function(manifestUrl) {
    statsd.increment('apk-cache.miss', 1, SOMETIMES, statsdCb);
    log.info('apk cache miss for ' + manifestUrl);
  };

  exports.buildInc = function(count) {
    statsd.gauge('apk-build-active.count', count, ALWAYS, statsdCb);
  };

  exports.buildDec = function(count) {
    statsd.gauge('apk-build-active.count', count, ALWAYS, statsdCb);
  };

  exports.requests = function() {
    return function(req, res, next) {
      var start = new Date();
      req.on('end', function() {
        if (res.statusCode) {
          statsd.increment('response.' + res.statusCode, 1, SOMETIMES, statsdCb);
          statsd.timing('response.dur', new Date() - start, SOMETIMES, statsdCb);
        }
      });
      next();
    };
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

function statsdCb(err) {
  if (err && log) log.error('statsd failed' + err.toString()); 
}
