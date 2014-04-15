/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var queue = {};

// Work in Progress
var wip = {};

// Saftey valve to serialize building per manfiest url.
module.exports = function(manifestUrl, config, log, fn) {
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