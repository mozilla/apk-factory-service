/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Saftey valve to serialize building per manfiest url.

var db = require('./db');

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
module.exports = function(manifestUrl, log, fn) {
  if ('undefined' === typeof queue[manifestUrl]) {
    queue[manifestUrl] = [];
  }
  if ('undefined' === typeof wip[manifestUrl]) {
    wip[manifestUrl] = false;
  }

  log.info('Enqueing build func for' + manifestUrl);
  queue[manifestUrl].push(fn);

  // Are we the first one in this queue?
  // and have we not started this job already?
  if (1 === queue[manifestUrl].length &&
    false === wip[manifestUrl]) {
    log.info('No waiting on app, building now ' + manifestUrl);
    runNextItem(manifestUrl, log);
  } 
  // else see runNextItem timeout... we'll eventually
  // get our turn to run
};

function runNextItem(manifestUrl, log) {
  if (1 <= queue[manifestUrl].length) {
    // WIP Semaphore prevents re-running a piece of work
    wip[manifestUrl] = true;
    log.info('dequeing build func for' + manifestUrl);
    queue[manifestUrl].shift()(function() {
      log.info('build func finished called for ' + manifestUrl);
      setTimeout(function() {
        wip[manifestUrl] = false;
        runNextItem(manifestUrl, log);
      }, 0);
    });
  } else {
    log.debug('builds complete, build queue empty for' + manifestUrl);
  }
}