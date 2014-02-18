/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var exec = require('child_process').exec;
var path = require('path');

var _ = require('underscore');
var fs = require('fs.extra');

var fsUtil = require('./fs_util');

var androidifier = require('./manifest_androidifier');
var apk = require('./apk_project_builder');
var fileLoader = require('./file_loader');
var withConfig = require('../lib/config').withConfig;

function ApkGenerator(buildDir, keysDir, forceRebuild, debug) {
  this.buildDir = buildDir || process.env.TMPDIR;
  this.keysDir = keysDir;
  this.forceRebuild = forceRebuild;
  this.debug = debug;
}

function cleanup(config, projectBuilder, appBuildDir) {
  if (!config.debug) {
    projectBuilder.dest = appBuildDir;
    projectBuilder.cleanup();

  }
}

//TODO not sure this works with the module pattern...
withConfig(function(config) {
  var log = require('../lib/logging')(config);
  _.extend(ApkGenerator.prototype, {
    /**
     * manifest has several properties
     *   url - original manifest url
     *   data - actual manifest
     *   ourVersion - server side version number
     *   appType - Type of OWA (hosted or packaged)
     *   noCache - Optional, defaults to false controls apk caching
     */
    generate: function(manifest, zip, loadDir, cb) {
      var self = this;
      var packageName = androidifier.packageName(manifest.url);
      var noCache = manifest.noCache || false;
      var appBuildDir = path.join(config.buildDir, packageName);
      if (noCache) {
        // TODO check if exists...
        appBuildDir = path.join(config.buildDir, Math.random() + '', packageName);
      } else {
        fs.rmrfSync(appBuildDir);
      }
      fs.mkdirRecursiveSync(appBuildDir);

      var projectBuilderDest = path.resolve(process.cwd(), appBuildDir);

      var projectBuilder = new apk.ApkProjectCreator("template",
                                                     projectBuilderDest);
      var zipFile;
      var zipFileLocation;
      var loader = fileLoader.create(loadDir);
      var ourVersion = manifest.ourVersion;

      if (projectBuilderDest) {
        projectBuilder.dest = projectBuilderDest;
        projectBuilder.loader = loader;
      }

      var extractDir = path.join(appBuildDir, "package");

      if (zip) {
        zipFile = new Buffer(zip, 'base64');
        zipFileLocation = path.join(appBuildDir, "application.zip");


        // Put zip file onto disk
        // TODO optimize to unzip in-memory zip
        fs.writeFileSync(zipFileLocation, zipFile);
      }

      function unzipPackage(unzipCb) {
        fs.mkdirRecursiveSync(extractDir);
        var unzipCmd = 'unzip ' + zipFileLocation;
        exec(unzipCmd, {cwd: extractDir}, function(err, stdout, stderr) {
          if (err) {
            console.log('Unable to unzip ' + zipFileLocation);
            if(stdout) console.log(stdout);
            if(stderr) console.error(stderr);
            console.error(err);
            return cb(err);
          }
          onCloseExtractPackage(unzipCb);
        });
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
        var miniManifest = _.extend({}, manifest);
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
                           JSON.stringify(miniManifest.data));
        }

        projectBuilder.create(manifest, ourVersion, loader, onCreate);

        function onCreate(androidManifestProperties) {
          log.info("Building " + androidManifestProperties.packageName + "-" +
                   androidManifestProperties.version + ".apk (" +
                   androidManifestProperties.versionCode + ") from " + manifest.url);

          fs.mkdirRecursiveSync(self.keysDir);
          var packName = androidManifestProperties.packageName;
          projectBuilder.build(self.keysDir, manifest.url, packName, function(err, s3publicUrl) {
            if (err) {
              console.log(err);
              console.log(err.stack);
              return cb(err);
            }
            if (noCache) {
              return cb(null, s3publicUrl);
            } else {
              cleanup(config, projectBuilder, appBuildDir);
              if (cb) {
                cb(err, s3publicUrl);
              }
            }
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
