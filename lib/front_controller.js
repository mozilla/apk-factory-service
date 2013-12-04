/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs.extra');
var path = require('path');
var url = require('url');

var _ = require('underscore');

var androidifier = require('./manifest-androidifier');
var apk = require('./apk-project-builder');
var apkCache = require('./apk_cache');
var ApkGenerator = require('./apk-generator').ApkGenerator;
var buildQueue = require('./build_queue');
var fileLoader = require('./file-loader');
var owaDownloader = require('./owa_downloader');

module.exports = function(manifestUrl, appType, config, cb) {
  if (typeof cb !== 'function') {
    throw new Error('front controller expects a callback function');
  }

  // TODO: buildQueue guards for a single controller deamon,
  // but we need something for guarding against other instances
  buildQueue(manifestUrl, function(finishedCb) {
    apkCache(manifestUrl, config, function(err, apkPath, cacheApkFn) {
      if (err) {
        // TODO metrics here...
	console.error(err);
        throw new Error(err);
      } else if (apkPath !== null) {
        cb(null, apkPath);
        finishedCb();
      } else {
        cacheMissGenerateAPK(manifestUrl, config, cacheApkFn, cb, finishedCb);
      }
    });
  });
};

function cacheMissGenerateAPK(manifestUrl, config, cacheApkFn, cb, finishedCb) {
  var dirname;

  if (/^\w+:\/\//.test(manifestUrl)) {
    dirname = url.resolve(manifestUrl, ".");

  } else {
    dirname = path.dirname(path.resolve(process.cwd(), manifestUrl));

  }

  var packageName = androidifier.packageName(manifestUrl);
  var appBuildDir = path.join(config.buildDir, packageName);
  var loader = fileLoader.create(dirname);
  var projectBuilder = new apk.ApkProjectCreator("template", appBuildDir, loader);

  // TODO bad manifest brings down server ???
  owaDownloader(manifestUrl, projectBuilder, appBuildDir, function(err, projectBuilder, manifest, miniManifest, zipFileLocation) {
  // TODO callback too many parameters
    if(err) {
      finishedCb();
      return cb(e);
    }
    fs.mkdirRecursiveSync(appBuildDir);

    var generator = new ApkGenerator(config.buildDir,
				     config.cacheDir,
				     config.force);
    // TODO generate too many parameters
    generator.generate(manifestUrl, null, appType, config.cacheDir, projectBuilder, appBuildDir, manifest, miniManifest, zipFileLocation, function(err, apkFilepath) {
      if (!err) {
	cacheApkFn(apkFilepath, function(err, cachedApkFilepath) {
           // Tell buildQueue we're finished
          finishedCb();
          cb(err, cachedApkFilepath);
        });
      }
    });
  });	
}