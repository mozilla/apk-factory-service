/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var crypto = require('crypto');
var path = require('path');

var _ = require('underscore');
var fs = require('fs.extra');

var apkHash = require('./apk_hash');
var androidifier = require('./manifest_androidifier');
var db = require('./db');


var APK_FAC_LIB_PATH = "../node_modules/apk-factory-library/";
verPath = path.resolve(__dirname, APK_FAC_LIB_PATH, 'VER.txt');
var APK_LIB_VER = parseInt(fs.readFileSync(verPath), 10);

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
  var cacheDir = config.cacheDir;

  // TODO support overideManifestPath
  var overideManifestPath = null;
  manifestUrl = overideManifestPath || manifestUrl;

  var packageName = androidifier.packageName(manifestUrl);
  var appCacheDir = createDir(cacheDir, "apks/" + packageName);
  var apkCachedFile = path.join(appCacheDir, "application.apk");

  // Metadata for comparision and updating db
  var meta = {
    id: sha1(manifestUrl),
    version: undefined,
    manifest_url: manifestUrl,
    manifest_hash: undefined,
    package_hash: undefined,
    library_version: undefined
  };

  function doCacheMiss(isUpdate) {
    isUpdate = typeof isUpdate === 'boolean' ? isUpdate : true;

    // Miss
    cb(null, null, function(newApkCacheFile, apkCachedCb) {

      // Update our cache with the latest!
      apkHash(manifestUrl, function(err, manifestHash, packageHash) {
        updateMeta(manifestHash, packageHash);
      });

      function updateMeta(manifestHash, packagedHash) {
        if (meta.manifest_hash === manifestHash) {
          if (!! packagedHash) {
            if (meta.package_hash === packagedHash) {
              return;
            }
            meta.package_hash = packagedHash;
          } else {
            return;
          }
        }

        meta.manifest_hash = manifestHash;
        meta.library_version = APK_LIB_VER;

        meta.version = new Date().getTime();
        if (isUpdate) {
          db.updateMetadata(meta, config, function(err) {
            if (err) {
              console.error(err);
            }
          });
        } else {
          db.saveMetadata(meta, config, function(err) {
            if (err) {
              console.error(err);
            }
          });
        }
      }

      // Regardless of updating the Metadata, we update our disk
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

  db.getMetadata(meta.id, config, function(err, metadata) {
    if (err) return cb(err);
    // No metadata means we haven't built this apk yet
    if (null === metadata) {
      return doCacheMiss(false);
    }

    _.extend(meta, metadata);

    // Okay we've got an apk in our cache, but is it fresh?
    apkHash(manifestUrl, function(err, manifestHash, packageHash) {
      if (err) {
        return cb(err);
      } else if (manifestHash !== meta.manifest_hash) {
        return doCacheMiss();
      } else if (!! packageHash || meta.package_hash) {
        if (packageHash !== meta.package_hash) {
          return doCacheMiss();
        }
      }
      // Hit
      if (fs.existsSync(apkCachedFile)) {
        if (cb) {
          var apkInfo = {
            path: apkCachedFile,
            version: metadata.version
          };
          return cb(null, apkInfo, noOpFn);
        }
        return;
      } else {
        return doCacheMiss();
      }
    });
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

function sha1(text) {
  var sha = crypto.createHash('sha1');
  sha.update(text);
  return sha.digest('hex');
}