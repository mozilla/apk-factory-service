/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var metrics = require('./metrics');

var activeBuilds = 0;

var max = 0;

setInterval(function() {
  // log total number of active builds
  console.log('[' + new Date().toISOString() + '] Concurrent Builds:', activeBuilds, 'of', max);
}, 5000);

exports.start = function(res, next, config) {
  max = config.maximumNumberOfConcurrentBuilds;
  if (config.maximumNumberOfConcurrentBuilds &&
    'number' === typeof config.maximumNumberOfConcurrentBuilds) {
    if (activeBuilds + 1 > config.maximumNumberOfConcurrentBuilds) {
      res.status(503);
      return res.send({
        error: 'Too many concurrent builds'
      });
    }
  } else {
    console.log('WARNING bad config, expected maximumNumberOfConcurrentBuilds');
  }
  activeBuilds++;
  metrics.buildInc(activeBuilds);
  next();
};

exports.finished = function() {
  activeBuilds--;
  metrics.buildDec(activeBuilds);
};

exports.error = function() {
  if (activeBuilds > 0) {
    activeBuilds--;
    metrics.buildDec(activeBuilds);
  }
};
