/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var queue = {};

// Work in Progress
var wip = {};

// Saftey valve to serialize building per manfiest url.
module.exports = function(manifestUrl, fn) {
  if ('undefined' === typeof queue[manifestUrl]) {
    queue[manifestUrl] = [];
  }
  if ('undefined' === typeof wip[manifestUrl]) {
    wip[manifestUrl] = false;
  }

  // enqueue
  queue[manifestUrl].push(fn);

  // Are we the first one in this queue?
  // and have we not started this job already?
  if (1 === queue[manifestUrl].length &&
    false === wip[manifestUrl]) {
    runNextItem(manifestUrl);
  }
};

function runNextItem(manifestUrl) {
  if (1 <= queue[manifestUrl].length) {
    // Semaphore prevents re-running a piece of work
    wip[manifestUrl] = true;
    // dequeue and execute work
    queue[manifestUrl].shift()(function() {
      setTimeout(function() {
        wip[manifestUrl] = false;
        runNextItem(manifestUrl);
      }, 0);
    });
  }
}