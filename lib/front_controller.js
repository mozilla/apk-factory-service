/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var url = require('url');

var fs = require('fs.extra');

var androidifier = require('./manifest_androidifier');
var apkCache = require('./apk_cache');
var buildQueue = require('./build_queue');
var fileLoader = require('./file_loader');
var generator = require('./generator_client');
var metrics = require('./metrics');
var owaDownloader = require('./owa_downloader');
var s3; // Lazy loaded to avoid config issues with cli.js

module.exports = function(manifestUrl, appType, config, cb) {
  var log = require('../lib/logging')(config);
  if (typeof cb !== 'function') {
    throw new Error('front controller expects a callback function');
  }

  // TODO: buildQueue guards for a single controller deamon,
  // but we need something for guarding against other instances
  buildQueue(manifestUrl, log, function(finishedCb) {
    apkCache(manifestUrl, config, log, function(err, apkInfo, cacheApkFn) {
      if (err) {
        metrics.apkCachingFailed(manifestUrl);
        log.error(err);
        finishedCb();
        throw new Error(err);
      } else if (apkInfo !== null) {
        metrics.apkCachingHit(manifestUrl);
        log.info('Cache hit, loading APK from S3');
        loadApk(apkInfo.s3Key + '.apk', cb);
        finishedCb();
      } else {
        log.info('Cache miss, generating APK');
        metrics.apkCachingMiss(manifestUrl);
        cacheMissGenerateAPK(manifestUrl, appType, config, log, cacheApkFn, cb, finishedCb);
      }
    });
  });
};

function loadApk(s3key, cb) {
  if(undefined === s3) {
    s3 = require('./s3');
  }
  s3.getApk(s3key, cb);
}

function cacheMissGenerateAPK(manifestUrl, appType, config, log, cacheApkFn, cb, finishedCb) {
  var loaderDirname;

  if (/^\w+:\/\//.test(manifestUrl)) {
    loaderDirname = url.resolve(manifestUrl, ".");
  } else {
    loaderDirname = path.loaderDirname(path.resolve(process.cwd(), manifestUrl));
  }

  var ourApkVersion = Math.floor(new Date().getTime() / 1000) + '';
  var packageName = androidifier.packageName(manifestUrl);
  var appBuildDir = path.join(config.buildDir, packageName);

  var loader = fileLoader.create(loaderDirname);

  log.info('starting build of ' + manifestUrl + 'version=' +  ourApkVersion + ' in ' + appBuildDir);

  owaDownloader(manifestUrl, null, loader, appBuildDir, owaCb);

  function owaCb(err, manifest, appType, zip) {
    if (err) {
      finishedCb();
      return cb(err);
    }

    log.info('Retrieved manifest data for ' + manifestUrl);

    log.debug('making ' + appBuildDir);
    fs.mkdirRecursiveSync(appBuildDir);

    var manifestParams = {
      url: manifestUrl,
      appType: appType,
      ourVersion: ourApkVersion,
      data: manifest
    };

    log.debug('Starting generator for ' + manifestUrl + JSON.stringify(manifestParams));

    generator(config, manifestParams, zip, loaderDirname, log, genCb);

    function genCb(err, s3publicUrl) {
      if (err) {
        finishedCb();
        cb(err);
      } else {
        log.info('generator finished, updating cache ' + s3publicUrl);
        cacheApkFn(s3publicUrl, ourApkVersion, function(err) {
          // Tell buildQueue we're finished
          finishedCb();
          if (err) {
            cb(err);
          } else {
            loadApk(packageName + '.apk', cb);
          }
        });
      }
    }
  }
}