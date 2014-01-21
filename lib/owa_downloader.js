/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var url = require('url');

var _ = require('underscore');
var fs = require('fs.extra');
var request = require('request');

var fileLoader = require('./file_loader');
var owaValidator = require('./owa_validator');

module.exports = function(manifestUrl, loader,
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

      if (false === owaValidator(manifest)) {
        return cb('invalid manifest');
      }

      if ( !! manifest.package_path) {
        appType = "packaged";
      } else {
        appType = "hosted";
      }

      if (appType == "hosted") {
        return cb(null, manifest, zipFileLocation, undefined, loader);
      } else {
        fs.mkdirRecursiveSync(appBuildDir);
        zipFileLocation = path.join(appBuildDir, "application.zip");

        function fetchPackage() {
          var writer = fs.createWriteStream(zipFileLocation, {
            flags: 'w',
            encoding: null,
            mode: 0666
          });
          writer.on("error", function(err) {
            console.error(err);
            throw new Error(err);
          });
          writer.on("close", function() {
            cb(null, manifest, zipFileLocation, loader);
          });
          var packagePath = url.resolve(manifestUrl, manifest.package_path);
          request(packagePath).pipe(writer);
        }

        fetchPackage();

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