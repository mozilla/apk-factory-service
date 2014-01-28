/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore');
var path = require('path');

var fs = require('fs.extra');
var unzip = require('unzip');

var fsUtil = require('./fs_util');
var log = require('../lib/logging').logger;

var androidifier = require('./manifest_androidifier');
var apk = require('./apk_project_builder');
var fileLoader = require('./file_loader');
var s3 = require('./s3');
var withConfig = require('../lib/config');

function ApkGenerator(buildDir, keysDir, forceRebuild, debug) {
  this.buildDir = buildDir || process.env.TMPDIR;
  this.keysDir = keysDir;
  this.forceRebuild = forceRebuild;
  this.debug = debug;
}

function moveApk(newApkCacheFile, config, packageName, cb) {
  var appCacheDir = path.resolve(config.cacheDir, "apks/" + packageName);
  fs.mkdirRecursiveSync(appCacheDir);
  var apkCachedFile = path.join(appCacheDir, "application.apk");
  // Regardless of updating the Metadata, we update our disk
  if (fs.existsSync(apkCachedFile)) {
    fs.unlinkSync(apkCachedFile);
  }

  fs.stat(newApkCacheFile, function(err, stat) {
    fs.readFile(newApkCacheFile, function(err, data) {
      s3.saveApk(packageName, data, stat.size, function(err) {
        cb(err, packageName);
      });
    });
  });
}

function cleanup(config, projectBuilder, appBuildDir) {
  if (!config.debug) {
    projectBuilder.dest = appBuildDir;
    projectBuilder.cleanup();

  }
}

//TODO not sure this works with the module pattern...
withConfig(function(config) {
  _.extend(ApkGenerator.prototype, {
    generate: function(manifest, zip, loadDir, cb) {
      var self = this;

      var packageName = androidifier.packageName(manifest.url);
      var appBuildDir = path.join(config.buildDir, packageName);

      var projectBuilderDest = path.resolve(process.cwd(), appBuildDir);

      var projectBuilder = new apk.ApkProjectCreator("template",
                                                     projectBuilderDest);
      var zipFile;
      var zipFileLocation;
      var loader = fileLoader.create(loadDir);

      if (projectBuilderDest) {
        projectBuilder.dest = projectBuilderDest;
        projectBuilder.loader = loader;
      }

      var extractDir = path.join(appBuildDir, "package");

      if (zip) {
        zipFile = new Buffer(zip, 'base64');
        zipFileLocation = path.join(appBuildDir, "application.zip");
        fs.mkdirRecursiveSync(appBuildDir);
        // Put zip file onto disk
        // TODO optimize to unzip in-memory zip
        fs.writeFileSync(zipFileLocation, zipFile);
      }

      function unzipPackage(unzipCb) {
        fs.mkdirRecursiveSync(extractDir);
        var extractPackage = unzip.Extract({
          path: extractDir,
          verbose: false
        });
        extractPackage.on("error", function(err) {
          console.error(err);
          throw new Error(err);
        });
        extractPackage.on("close", function() {
          onCloseExtractPackage(unzipCb);
        });
        fs.createReadStream(zipFileLocation).pipe(extractPackage);
      }

      function onCloseExtractPackage(unzipCb) {
        // Reset where we're going to create the android project.
        projectBuilderDest = path.join(projectBuilderDest, "apk-build");

        // Reset where we're going to get the image files from.
        loader = fileLoader.create(extractDir);

        // Use the zipfile's version of the manifest.
        // TODO what if the manifest isn't valid?
        var packageManifestData = fileLoader.stripBom(
          loader.load("manifest.webapp"));

        var miniManifest = manifest;
        try {
          manifest.data = JSON.parse(packageManifestData);
          unzipCb(null, manifest, miniManifest, zipFileLocation,
                  projectBuilderDest, loader);
        } catch(e) {
          console.error(e);
          console.log(e.stack);
          return cb(e);
        }
      }

      function doGen(err, manifest, miniManifest, zipFileLocation,
                     projectBuilderDest, loader) {
        if (zipFileLocation) {
          var rawDir = path.join(projectBuilder.dest, "res/raw");
          var newZipFileLocation = path.join(rawDir, "application.zip");
          fsUtil.ensureDirectoryExistsFor(newZipFileLocation);
          fs.renameSync(zipFileLocation, newZipFileLocation);
          fs.writeFileSync(path.join(rawDir, "mini.json"),
                           JSON.stringify(manifest.mini));
        }

        projectBuilder.create(manifest, loader, onCreate);

        function onCreate(androidManifestProperties) {
          log.info("Building " + androidManifestProperties.packageName + "-" +
                   androidManifestProperties.version + ".apk (" +
                   androidManifestProperties.versionCode + ") from " + manifest.url);

          fs.mkdirRecursiveSync(self.keysDir);
          projectBuilder.build(self.keysDir, function(err, apkLoc) {
            apkLoc = moveApk(apkLoc, config, packageName, function(err, apkLoc) {
              if (err) {
                console.log(err);
                console.log(err.stack);
                return cb(err);
              }

              cleanup(config, projectBuilder, appBuildDir);
              if (cb) {
                cb(err, apkLoc);
              }
            });

          });
        }
      }

      if (zipFileLocation) {
        unzipPackage(doGen);
      } else {
        doGen(null, manifest, null, zipFileLocation,
              projectBuilderDest, loader);
      }
    }
  });
});
module.exports = {
  ApkGenerator: ApkGenerator
};