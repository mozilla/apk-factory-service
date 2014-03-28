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

/* Algorithm

0) insert fn into QUEUE
1) Check WIP in memory data for manifest url
 1a) manifest is present, DONE
 1b) no record CONTINUE
2) Update WIP in memory data structure, try to INSERT a build start entry in the database
id (sha1 of mainfest_url), last_modified, server id
 2a) insert fails, DONE
 2b) insert successed CONTINUE
3) run fn with touch and finish callbacks, DONE

Update Callback
Should be called after critical steps and will cause an UPDATE to the db row

Finish Callback
Update WIP in memory data structure

Heartbeat
1) Request all WIP BUILD DB data
2) Compare to known WIP, fire updates
3) Run next build across each manifest as available
4) ???

*/

// Saftey valve to serialize building per manfiest url.
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
        console.log('ERROR, unable to aquire lock', manifestUrl);
        //wip[manifestUrl] = true;
        return waitForLock(manifestUrl, log);
      } else {
        log.info('No waiting on app, building now ' + manifestUrl);
        runNextItem(manifestUrl, config, log);
      }
    });
  }

  // else see runNextItem timeout... we'll eventually
  // get our turn to run
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
      console.log('db.releaseBuildLock', manifestUrl);
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
        console.log('QUEUE: ', queue);
        console.log('WIP: ', wip);
        Object.keys(queue).forEach(function(manifestUrl) {
          var hash = sha1(manifestUrl);
          var lock = getFromList(hash, rows);
          var staleDate = new Date();
          staleDate.setTime(staleDate.getTime() - config.buildQueueStalePeriod);
          if (!! lock) console.log('Comparing ', lock.last_modified, '<', staleDate, 'which is ', lock.last_modified < staleDate);
          if (null === lock) {
            runNextItem(manifestUrl, config, log);
          } else if (lock.last_modified < staleDate) {
            log.info('Stale build queue lock!', manifestUrl, hash);
            runNextItem(manifestUrl, config, log);
          } else {
            log.debug('Skipping ', manifestUrl, hash);
          }
        });
        console.log('LOCKS: ', rows);
        if (rows.length > 0) console.log(typeof rows[0].last_modified, rows[0].last_modified.getTime());
        // Any queued manifests not in rows, run them
        // Any queued manifests older than N milliseconds... run them
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

  if (true) return true;

  console.log('QUEUE: ', queue);
  console.log('WIP: ', wip);

  var activeWIP = [];
  Object.keys(wip).forEach(function(key) {
    if (true === wip[key]) {
      activeWIP.push(key);
    }
  });
  console.log('we will ignore', activeWIP);
  for (var i=0; i < Object.keys(queue).length; i++) {
    var queueKey = Object.keys(queue)[i];
    console.log('Testing ', queueKey, 'which is', activeWIP.indexOf(queueKey));
    if (-1 === activeWIP.indexOf(queueKey)) {
      console.log(queueKey, ' is NOTABLE');
      return true;
    }
  }
  console.log('meh');
  return false;
}

function getFromList(hash, list) {
  console.log('Looking for ', hash, 'in', list);
  for (var i=0; i < list.length; i++) {
    if (hash === list[i].manifest_hash) {
      console.log('GOt it');
      return list[i];
    }
  }
  console.log('404');
  return null;
}