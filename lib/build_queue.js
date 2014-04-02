/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Saftey valve to serialize building per manfiest url.

var db = require('./db');
var sha1 = require('./sha1');

/**
 * Map where keys are manifestUrls and values are lists of functions.
 * Functions are the callback that will one at a time to build or
 * retrieve a cached build
 */
var queue = {};

// Known work in progresse.
// Note: other servers may have caused WIP that we don't know about yet
// and which we'll find out about via the heart beat.
var wip = {};

// Saftey valve to serialize building per manfiest url
// across servers
module.exports = function(manifestUrl, config, log, fn) {
  initPolling(config, log);

  if ('undefined' === typeof queue[manifestUrl]) {
    queue[manifestUrl] = [];
  }

  log.info('Enqueing build func for' + manifestUrl);
  queue[manifestUrl].push(fn);

  if ('undefined' === typeof wip[manifestUrl]) {
    wip[manifestUrl] = false;
  }

  if (true === wip[manifestUrl]) {
    return waitForLock(manifestUrl, log);
  } else {
    db.aquireBuildLock(sha1(manifestUrl), manifestUrl, config, function(err) {
      if (err) {
        log.warn('Unable to aquire lock', manifestUrl);
        //wip[manifestUrl] = true;
        return waitForLock(manifestUrl, log);
      } else {
        log.info('No waiting on app, building now ' + manifestUrl);
        runNextItem(manifestUrl, config, log);
      }
    });
  }
};

function waitForLock(manifestUrl, log) {
  log.info('Waiting for app build lock, ' + manifestUrl);
}

function runNextItem(manifestUrl, config, log) {
  if (1 <= queue[manifestUrl].length &&
      false === wip[manifestUrl]) {
    // WIP Semaphore prevents re-running a piece of work
    wip[manifestUrl] = true;
    log.info('dequeing build func for ' + manifestUrl);
    queue[manifestUrl].shift()(function() {
      log.info('build func finished called for ' + manifestUrl);
      db.releaseBuildLock(sha1(manifestUrl), config);
      setTimeout(function() {
        wip[manifestUrl] = false;
        runNextItem(manifestUrl, config, log);
      }, 0);
    });
  } else {
    log.debug('builds complete, build queue empty for' + manifestUrl);
  }
}

var initializedPolling = false;
function initPolling(config, log) {
  if (true === initializedPolling) return;
  initializedPolling = true;

  setInterval(function() {
    if (waiting(queue, wip)) {
      db.activeBuildLocks(config, function(err, rows) {
        Object.keys(queue).forEach(function(manifestUrl) {
          var hash = sha1(manifestUrl);
          var lock = getFromList(hash, rows);
          var staleDate = new Date();
          staleDate.setTime(staleDate.getTime() - config.buildQueueStalePeriod);
          if (null === lock) {
            runNextItem(manifestUrl, config, log);

          // Detect dead/stale locks from other servers
          } else if (lock.last_modified < staleDate) {
            log.info('Stale build queue lock!', manifestUrl, hash);
            runNextItem(manifestUrl, config, log);
          } else {
            log.debug('Skipping ', manifestUrl, hash);
          }
        });
      });
    } else {
      log.debug('No waiting, no polling');
    }
  }, config.buildQueuePollFrequencyInMilliseconds);
}

/**
 * Ignoring manifests we're building, are
 * we waiting for a build lock?
 */
function waiting(queue, wip) {

  // TODO: Optimize db polling
  // Too buggy to release currently
  if (true) return true;

  var activeWIP = [];
  Object.keys(wip).forEach(function(key) {
    if (true === wip[key]) {
      activeWIP.push(key);
    }
  });

  for (var i=0; i < Object.keys(queue).length; i++) {
    var queueKey = Object.keys(queue)[i];
    if (-1 === activeWIP.indexOf(queueKey)) {
      return true;
    }
  }
  return false;
}

function getFromList(hash, list) {
  for (var i=0; i < list.length; i++) {
    if (hash === list[i].manifest_hash) {
      return list[i];
    }
  }
  return null;
}