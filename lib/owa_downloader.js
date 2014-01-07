/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var url = require('url');

var _ = require('underscore');
var fs = require('fs.extra');
var request = require('request');
var unzip = require('unzip');

var fileLoader = require('./file_loader');

module.exports = function(manifestUrl, loader, projectBuilderDest,
                          appBuildDir, cb) {
  var manifestFilename;
  if (/^\w+:\/\//.test(manifestUrl)) {
    manifestFilename = _(url.parse(manifestUrl).pathname.split("/")).last();
  } else {
    manifestFilename = path.basename(manifestUrl);
  }

  loader.load(manifestFilename, function(err, string) {
    if (err) {
      console.error("Cannot load manifest: " + err);
      return;
    }
    try {
      var manifest = JSON.parse(string),
      miniManifest,
      zipFileLocation;

      if (!!manifest.package_path) {
        appType = "packaged";
      } else {
        appType = "hosted";
      }

      if (appType == "hosted") {
        return cb(null, manifest, null, zipFileLocation, undefined, loader);
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
          writer.on("error", function(err) {
            console.error(err);
            throw new Error(err);
          });
          writer.on("close", unzipPackage);
          var packagePath = url.resolve(manifestUrl, manifest.package_path);
          request(packagePath).pipe(writer);
        }

        function unzipPackage() {
          var extractPackage = unzip.Extract({
            path: extractDir,
            verbose: false
          });
          extractPackage.on("error", function(err) {
            console.error(err);
            throw new Error(err);
          });
          extractPackage.on("close", onCloseExtractPackage);
          fs.createReadStream(zipFileLocation).pipe(extractPackage);
        }
        fetchPackage();


        function onCloseExtractPackage() {
          // Reset where we're going to create the android project.
          projectBuilderDest = path.join(projectBuilderDest, "apk-build");

          // Reset where we're going to get the image files from.
          loader = fileLoader.create(extractDir);

          // Use the zipfile's version of the manifest.
          // TODO what if the manifest isn't valid?
          var packageManifestData = loader.load("manifest.webapp");
          miniManifest = manifest;
          manifest = JSON.parse(packageManifestData);

          return cb(null, manifest, miniManifest, zipFileLocation,
                    projectBuilderDest, loader);

        }
      }
    } catch (e) {
      if (e.stack) {
        console.error("Error downloading " + manifestUrl);
        console.error(e.stack);
      }
      if (cb) {
        cb(e);
      }
    }
  });
};