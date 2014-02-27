/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var Step = require('step');

var apkCache = require('./apk_cache');
var metrics = require('./metrics');

var log;
/**
 * Determines which apps are out of date.
 *
 * @param apks - Assoc Array where keys are manifest urls and
 *   the values are versions
 * @param config - server config
 * @param cb - function(err, outdated) where outdated is a list of manifest urls
 */
module.exports = function(apks, config, cb) {
  if (undefined === log) {
    log = require('../lib/logging')(config);
  }
  var manifests = Object.keys(apks.installed);
  var outdated = [];
  Step(
    function checkForUpdate() {
      var group = this.group();
      var updates = [];
      manifests.forEach(function(manifest) {
        var version = apks.installed[manifest];
        // Check the cache... if cache miss mark as outdated
        // if cache hit look at new version callback parameter
        apkCheckCache(manifest, version, config, outdated, log, group());
        updates.push([manifest, version]);
      });
      metrics.apkUpdateCheck(updates);

    },
    function sendResp(err) {
      cb(err, outdated);
    }
  );
};

// Step compatible wrapper
function apkCheckCache(manifest, version, config, outdated, log, cb) {
  apkCache(manifest, config, log, function(err, apkInfo) {
    if (err) {
      log.error('Unable to get apk from cache');
      metrics.apkCachingFailed(manifest);
      return cb(err);
    } else if (apkInfo !== null) {
      if (apkInfo.version && version !== apkInfo.version) {
        log.info('We see cached APK, but version information is mismatched');
        outdated.push(manifest);
      }
    } else {
      log.info('No APK Metadata, flagging app as outdated');
      outdated.push(manifest);
    }
    cb(null, manifest);
  });
}
