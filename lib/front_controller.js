/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var url = require('url');

var _ = require('underscore');
var fs = require('fs.extra');

var androidifier = require('./manifest_androidifier');
var apk = require('./apk_project_builder');
var apkCache = require('./apk_cache');
var ApkGenerator = require('./apk_generator').ApkGenerator;
var buildQueue = require('./build_queue');
var fileLoader = require('./file_loader');
var owaDownloader = require('./owa_downloader');

var generator;

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
  var projectBuilder = new apk.ApkProjectCreator("template", appBuildDir);

  // TODO bad manifest brings down server ???
  owaDownloader(manifestUrl, loader, projectBuilder.dest, appBuildDir, owaCb);
}

function owaCb(err, manifest, miniManifest, zipPath, projBuildDest, loader) {
  if(err) {
    finishedCb();
    return cb(err);
  }
  if (projBuildDest) {
    projectBuilder.dest = projBuildDest;
    projectBuilder.loader = loader;
  }
  fs.mkdirRecursiveSync(appBuildDir);

  if (!generator) {
    generator = new ApkGenerator(config.buildDir,
                                 config.keysDir,
                                 config.force,
                                 config.debug);
  }

  var manifestParams = {
    url: manifestUrl,
    appType: appType,
    data: manifest,
    mini: miniManifest
  };
  generator.generate(manifestParams, projectBuilder, zipPath, loader, genCb);
}

function genCb(err, apkFilepath) {
  if (!err) {
    cacheApkFn(apkFilepath, function(err, cachedApkFilepath) {
      // Tell buildQueue we're finished
      finishedCb();
      cb(err, cachedApkFilepath);
    });


    if (!config.debug) {
      projectBuilder.dest = appBuildDir;
      projectBuilder.cleanup();
    }
  }
}