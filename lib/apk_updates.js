/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var Step = require('step');

var apkCache = require('./apk_cache');

/**
 * Determines which apps are out of date.
 *
 * @param apks - Assoc Array where keys are manifest urls and
 *   the values are versions
 * @param config - server config
 * @param cb - function(err, outdated) where outdated is a list of manifest urls
 */
module.exports = function(apks, config, cb) {
  var manifests = Object.keys(apks.installed);
  var outdated = [];
  Step(
    function checkForUpdate() {
      var group = this.group();
      manifests.forEach(function(manifest) {
        var version = apks.installed[manifest];
        // Check the cache... if cache miss mark as outdated
        // if cache hit look at new version callback parameter
        apkCheckCache(manifest, version, config, outdated, group());
      });
    },
    function sendResp(err) {
      cb(err, outdated);
    }
  );
};

// Step compatible wrapper
function apkCheckCache(manifest, version, config, outdated, cb) {
  apkCache(manifest, config, function(err, apkInfo) {
    if (err) {
      // TODO metrics here...
      console.error(err);
      throw new Error(err);
    } else if (apkInfo !== null) {
      if (apkInfo.version && version !== apkInfo.version) {
        outdated.push(manifest);
      }
    } else {
      // This is something that should not happen, right?
      outdated.push(manifest);
    }
    cb(null, manifest);
  });
}