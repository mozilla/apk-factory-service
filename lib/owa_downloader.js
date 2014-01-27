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
      var manifest = JSON.parse(fileLoader.stripBom(string)),
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

        var packagePath = url.resolve(manifestUrl, manifest.package_path);
        request({
          encoding: null,
          method: "GET",
          url: packagePath
        }, function(err, res, body) {
          var zip;
          if (err) {
            console.error("Error downloading " + manifestUrl);
            console.error(e.stack);
          } else {
            zip = new Buffer(body, 'binary').toString('base64');
          }
          cb(null, manifest, zip, loader);
        });



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