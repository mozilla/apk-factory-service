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


var APK_FAC_LIB_PATH = "./ext/apk-factory-library/";
var verPath = path.resolve(__dirname, APK_FAC_LIB_PATH, 'VER.txt');
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
 *   * apk-factory-library version is different
 *
 * @param string manifestUrl
 * @param object config
 * @param function cb
 */
module.exports = function(manifestUrl, config, log, cb) {
  // TODO support overrideManifestPath
  var overrideManifestPath = null;
  manifestUrl = overrideManifestPath || manifestUrl;

  var packageName = androidifier.packageName(manifestUrl);

  // Metadata for comparision and updating db
  var meta = {
    id: sha1(manifestUrl),
    version: undefined,
    manifest_url: manifestUrl,
    manifest_hash: undefined,
    library_version: undefined
  };

  function doCacheMiss(isUpdate) {
    isUpdate = typeof isUpdate === 'boolean' ? isUpdate : true;

    log.debug('doCacheMiss isUpdate=' + isUpdate);

    // Miss
    cb(null, null, isUpdate, function(newApkCacheFile, ourApkVersion, apkCachedCb) {
      log.info('cache miss - cache entry update called with version=' + ourApkVersion + ' for ' + manifestUrl + ' at ' + newApkCacheFile);
      // Update our cache with the latest!
      apkHash(manifestUrl, function(err, manifestHash) {
        log.info('Updating apk metadata manifest=' + manifestHash + ' for ' + manifestUrl);
        updateMeta(manifestHash);
      });

      function updateMeta(manifestHash) {
        if (meta.manifest_hash === manifestHash) {
          log.info('all metadata already up to date, skipping db write');
          return;
        }
        meta.manifest_hash = manifestHash;
        meta.library_version = APK_LIB_VER;

        meta.version = ourApkVersion;
        if (isUpdate) {
          log.info('Updating apk metadata to DB with ' + JSON.stringify(meta));
          db.updateMetadata(meta, config, function(err) {
            if (err) {
              log.error(err);
            }
          });
        } else {
          log.info('Saving apk metadata to DB with ' + JSON.stringify(meta));
          db.saveMetadata(meta, config, function(err) {
            if (err) {
              log.error(err);
            }
          });
        }
      }

      apkCachedCb(null);
    });
  }

  if (true === config.forceRebuild) {
    log.info('Force rebuild - doing cache miss');
    return doCacheMiss();
  }

  db.getMetadata(meta.id, config, function(err, metadata) {
    if (err) return cb(err);
    // No metadata means we haven't built this apk yet
    if (null === metadata) {
      log.info('No record in DB for ' + meta.id + ' doing cache miss');
      return doCacheMiss(false);
    }

    _.extend(meta, metadata);

    // Okay we've got an apk in our cache, but is it fresh?
    // TODO we need Squid or something else here for performance
    // Bug#975573
    log.info('Checking if cached APK is still fresh for ' + meta.id);
    apkHash(manifestUrl, function(err, manifestHash) {
      if (err) {
        // If network or origin server is down, it's okay we have
        // An APK in our cache
        log.warn('Ignoring apkHash ERROR and using cached APK ' + err.toString());
      } else if (manifestHash !== meta.manifest_hash) {
        log.info('cached apk manifest does not match reality ' +
          manifestHash + ' !== ' + meta.manifest_hash + ' doing cache miss');
        return doCacheMiss(true);
      }
      // Hit
      // TODO should we Check for the existance on S3?
      if (cb) {
        var apkInfo = {
          s3Key: packageName,
          version: metadata.version
        };
        return cb(null, apkInfo, true, noOpFn);
      }
    });
  });
};

function noOpFn( /*apk*/ ) {
  process.stdout.write('WARN: Ignoring update to cache');
}

function sha1(text) {
  var sha = crypto.createHash('sha1');
  sha.update(text);
  return sha.digest('hex');
}
