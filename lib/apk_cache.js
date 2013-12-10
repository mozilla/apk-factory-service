/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');

var fs = require('fs.extra');

var androidifier = require('./manifest_androidifier');
var db = require('./db');

/**
 * apk cache takes a manifest url and a callback.
 * The callback should be function(err, apk, cacheApkFn)
 * apk will either be null or an APK filepath.
 * If apk is null, this is a cache miss and you should
 * generate an APK as normal. You can use cacheApkFn
 * to save this new APK back to the cache.
 *
 * The APK Cache's job is to ensure that an up-to-date
 * version of the APK is available, or signal a cache
 * miss.
 *   * hash of manifest is differnt
 *   * hash of packaged manifest is different
 *   * apk-factory-library version is different
 *
 * @param string manifestUrl
 * @param object config
 * @param function cb
 */
module.exports = function(manifestUrl, config, cb) {
  function doCacheMiss() {
    // Miss
    cb(null, null, function(newApkCacheFile, apkCachedCb) {
      if (fs.existsSync(apkCachedFile)) {
        fs.unlinkSync(apkCachedFile);
      }
      fs.linkSync(newApkCacheFile, apkCachedFile);
      apkCachedCb(null, apkCachedFile);
    });
  }

  if (true === config.forceRebuild) {
      return doCacheMiss();
  }

  db.getMetadata(sha1(manifestUrl), config, function(err, metadata) {
    if (err) return cb(err);
    if (null === metadata) {
      return doCacheMiss();
    }


    // start cache library (cacheDirPath, )
    var cacheDir = config.cacheDir;

    // TODO support overideManifestPath
    var overideManifestPath = null;
    manifestUrl = overideManifestPath || manifestUrl;

    var packageName = androidifier.packageName(manifestUrl);
    var appCacheDir = createDir(cacheDir, "apks/" + packageName);
    var apkCachedFile = path.join(appCacheDir, "application.apk");

    // Hit
    if (fs.existsSync(apkCachedFile)) {
      if (cb) {
        cb(null, apkCachedFile, noOpFn);
      }
      return;
    }

    return doCacheMiss();

  });

  
};

function createDir(cacheDir, defaultDir, dir) {
  dir = dir || defaultDir;
  dir = path.resolve(cacheDir, dir);
  fs.mkdirRecursiveSync(dir);
  return dir;
}

function noOpFn(apk) {
  console.log('WARN: Ignoring update to cache');
}