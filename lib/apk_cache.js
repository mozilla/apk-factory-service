/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');

var fs = require('fs.extra');

var androidifier = require('./manifest_androidifier');

/**
 * apk cache takes a manifest url and a callback.
 * The callback should be function(err, apk, cacheApkFn)
 * apk will either be null or an APK filepath.
 * If apk is null, this is a cache miss and you should
 * generate an APK as normal. You can use cacheApkFn
 * to save this new APK back to the cache.
 *
 * @param string manifestUrl
 * @param object config
 * @param function cb
 */
module.exports = function(manifestUrl, config, cb) {
  // start cache library (cacheDirPath, )
  var cacheDir = config.cacheDir;


  // TODO support overideManifestPath
  var overideManifestPath = null;
  manifestUrl = overideManifestPath || manifestUrl;

    var packageName = androidifier.packageName(manifestUrl);
    var appCacheDir = createDir(cacheDir, "apks/" + packageName);
    var apkCachedFile = path.join(appCacheDir, "application.apk");

    // Hit
    if (!config.forceRebuild && fs.existsSync(apkCachedFile)) {
      if (cb) {
        cb(null, apkCachedFile, noOpFn);
      }
      return;
    }

  // Miss
  cb(null, null, function(newApkCacheFile, apkCachedCb) {
      if (fs.existsSync(apkCachedFile)) {
        fs.unlinkSync(apkCachedFile);
      }
      fs.linkSync(newApkCacheFile, apkCachedFile);
      apkCachedCb(null, apkCachedFile);
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