/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs.extra');
var path = require('path');
var url = require('url');

var _ = require('underscore');

var androidifier = require('./manifest-androidifier');
var apk = require('./apk-project-builder');
var ApkGenerator = require('./apk-generator').ApkGenerator;
var buildQueue = require('./build_queue');
var fileLoader = require('./file-loader');
var owaDownloader = require('./owa_downloader');

module.exports = function(manifestUrl, appType, config, cb) {

  console.log('FC ', manifestUrl, appType, config);

  //  1) Re organize code
  //  1.0 extract owa-downloader
  //  1.1 extract cache updating code
  //  2) Break up deamons over HTTP

  buildQueue(manifestUrl, function(finishedCb) {
    console.log('AOK cleared by buildQueue');
    var generator = new ApkGenerator(config.buildDir,
                                     config.cacheDir,
                                     config.force);

    // start cache library (cacheDirPath, )
    var cacheDirPath = config.cacheDir;
    var cacheDir;

    // body
    if (cacheDirPath) {
      cacheDir = path.resolve(process.cwd(), cacheDirPath);
    } else {
      cacheDir = path.resolve(__dirname, "..", "cache");
    }

    console.log('AOK created cacheDir=', cacheDir);

    // TODO support overideManifestPath
    var overideManifestPath = null;
    console.log('figuring out dirname and manifestFilename');
    // Figure out dirname and manifestFilename
    if (/^\w+:\/\//.test(manifestUrl)) {
      dirname = url.resolve(manifestUrl, ".");
      manifestFilename = _(url.parse(manifestUrl).pathname.split("/")).last();
    } else {
      dirname = path.dirname(path.resolve(process.cwd(), manifestUrl));
      manifestFilename = path.basename(manifestUrl);
    }
    manifestUrl = overideManifestPath || manifestUrl;

    console.log(dirname, manifestFilename, manifestUrl);

    if (cacheDir) {
      var packageName = androidifier.packageName(manifestUrl);
      var appCacheDir = createDir(cacheDir, "apks/" + packageName);
      var apkCachedFile = path.join(appCacheDir, "application.apk");


      console.log('AOK does ', apkCachedFile, 'EXIST?');

      if (!this.forceRebuild && fs.existsSync(apkCachedFile)) {
        if (cb) {
          cb(null, apkCachedFile);
        }
        finishedCb();
        return;
      }
    } else {
      console.log('AOK no cacheDir');
    }
    // end cache library

    var appBuildDir = path.join(config.buildDir, packageName);
    var loader = fileLoader.create(dirname);
    var projectBuilder = new apk.ApkProjectCreator("template", appBuildDir, loader);

// TODO bad manifest brings down server ???

    // else do the work and then... update the cache
    var createCb = function(err, projectBuilder, manifest, miniManifest, zipFileLocation) {
      if(err) {
        finishedCb();
        return cb(e);
      }
          console.log('AOK appType=', appType, 'making ', appBuildDir);
          fs.mkdirRecursiveSync(appBuildDir);
      generator.generate(manifestUrl, null, appType, cacheDir, projectBuilder, appBuildDir, manifest, miniManifest, zipFileLocation, apkCachedFile, function(err, apk) {
            // update the cache
            console.log('AOK updating cache', err, apk, 'self.cacheDir=', cacheDir);
            
            if (!err) {
              if (cacheDir) {

                if (fs.existsSync(apkCachedFile)) {
                  fs.unlinkSync(apkCachedFile);
                }
                fs.linkSync(apk, apkCachedFile);
                apk = apkCachedFile;
              }
            }
            // END update the cache
            finishedCb();
            cb(err, apk);
          });
        };

    owaDownloader(loader, manifestUrl, manifestFilename, projectBuilder, appBuildDir, dirname, createCb);
  });
};

function createDir(cacheDir, defaultDir, dir) {
  dir = dir || defaultDir;
  dir = path.resolve(cacheDir, dir);
  console.log('making ', dir);
  fs.mkdirRecursiveSync(dir);
  return dir;
}