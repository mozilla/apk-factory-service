/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var url = require('url');

var _ = require('underscore');
var fs = require('fs.extra');

var androidifier = require('./manifest_androidifier');
var apkCache = require('./apk_cache');
var generator = require('./generator_client');
var buildQueue = require('./build_queue');
var fileLoader = require('./file_loader');
var owaDownloader = require('./owa_downloader');

module.exports = function(manifestUrl, appType, config, cb) {
  if (typeof cb !== 'function') {
    throw new Error('front controller expects a callback function');
  }

  // TODO: buildQueue guards for a single controller deamon,
  // but we need something for guarding against other instances
  buildQueue(manifestUrl, function(finishedCb) {
    apkCache(manifestUrl, config, function(err, apkInfo, cacheApkFn) {
      if (err) {
        // TODO metrics here...
        console.error(err);
        throw new Error(err);
      } else if (apkInfo !== null) {
        cb(null, apkInfo.path);
        finishedCb();
      } else {
        cacheMissGenerateAPK(manifestUrl, config, cacheApkFn, cb, finishedCb);
      }
    });
  });
};

function cacheMissGenerateAPK(manifestUrl, config, cacheApkFn, cb, finishedCb) {
  var loaderloaderDirname;

  if (/^\w+:\/\//.test(manifestUrl)) {
    loaderDirname = url.resolve(manifestUrl, ".");
  } else {
    loaderDirname = path.loaderDirname(path.resolve(process.cwd(), manifestUrl));
  }

  var packageName = androidifier.packageName(manifestUrl);
  var appBuildDir = path.join(config.buildDir, packageName);

  var loader = fileLoader.create(loaderDirname);

  owaDownloader(manifestUrl, loader, appBuildDir, owaCb);

  function owaCb(err, manifest, zip, loader) {
    if (err) {
      finishedCb();
      return cb(err);
    }

    fs.mkdirRecursiveSync(appBuildDir);

    var manifestParams = {
      url: manifestUrl,
      appType: appType,
      data: manifest
    };

    generator(config, manifestParams, zip, loaderDirname, genCb);

    function genCb(err, apkFilepath) {
      if (!err) {
        cacheApkFn(apkFilepath, function(err, cachedApkFilepath) {
          // Tell buildQueue we're finished
          finishedCb();
          cb(err, cachedApkFilepath);
        });
      }
    }
  }
}