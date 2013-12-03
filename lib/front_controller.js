/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs.extra');
var path = require('path');
var url = require('url');

var _ = require("underscore");

var androidifier = require("./manifest-androidifier");
var apk = require("./apk-project-builder");
var ApkGenerator = require('./apk-generator').ApkGenerator;
var buildQueue = require('./build_queue');
var fileLoader = require("./file-loader");

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
    var loader = fileLoader.create(dirname);
    var appBuildDir = path.join(config.buildDir, packageName);
    var projectBuilder = new apk.ApkProjectCreator("template", appBuildDir, loader);


    // else do the work and then... update the cache

    // TODO extract load into a library
    loader.load(manifestFilename, function (err, string) {
      if (err) {
        console.error("Cannot load manifest: " + err);
        return;
      }
      try {
        var create = function(projectBuilder, manifest, zipFileLocation) {
          console.log('AOK appType=', appType, 'making ', appBuildDir);
          fs.mkdirRecursiveSync(appBuildDir);
          generator.generate(manifestUrl, null, appType, cacheDir, projectBuilder, appBuildDir, manifest,  zipFileLocation, apkCachedFile, function(err, apk) {
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
            finishedCb();
            cb(err, apk);
          });

        };
        var manifest = JSON.parse(string),
        zipFileLocation,
        miniManifest;
        if (!!manifest.package_path) {
          appType = "packaged";
        } else {
          appType = "hosted";
        }

        if (appType == "hosted") {
          create(projectBuilder, manifest, zipFileLocation);
        } else {
          var extractDir = path.join(appBuildDir, "package");
          fs.mkdirRecursiveSync(extractDir);

          zipFileLocation = path.join(appBuildDir, "application.zip");

          function fetchPackage() {
            var writer = fs.createWriteStream(zipFileLocation, {
              flags: 'w',
              encoding: null,
              mode: 0666 }
                                             );
            writer.on("error", function(err) { console.error(err) });
            writer.on("close", unzipPackage);
            var packagePath = url.resolve(manifestUrl, manifest.package_path);
            request(packagePath).pipe(writer);
          }

          function unzipPackage() {
            var extractPackage = unzip.Extract({ path: extractDir, verbose: false });
            extractPackage.on("error", function(err) { console.error(err) });
            extractPackage.on("close", onCloseExtractPackage);
            fs.createReadStream(zipFileLocation).pipe(extractPackage);
          }
          fetchPackage();


          function onCloseExtractPackage() {
            // Reset where we're going to create the android project.
            projectBuilder.dest = path.join(projectBuilder.dest, "apk-build");

            // Reset where we're going to get the image files from.
            loader = fileLoader.create(extractDir);
            projectBuilder.loader = loader;

            // Use the zipfile's version of the manifest.
            // TODO what if the manifest isn't valid?
            var packageManifestData = loader.load("manifest.webapp");
            miniManifest = manifest;
            manifest = JSON.parse(packageManifestData);

            create(projectBuilder, manifest, zipFileLocation);
          }
        }
      } catch (e) {
        if (e.stack) {
          console.error("Error building " + manifestUrl);
          console.error(e.stack);
        }
        if (cb) {
          finishedCb();
          cb(e);
        }
      }
    });

  });
};

function createDir(cacheDir, defaultDir, dir) {
  dir = dir || defaultDir;
  dir = path.resolve(cacheDir, dir);
  console.log('making ', dir);
  fs.mkdirRecursiveSync(dir);
  return dir;
}