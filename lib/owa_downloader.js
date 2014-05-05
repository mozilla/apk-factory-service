/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var url = require('url');

var request = require('request');

var fileLoader = require('./file_loader');
var logError = require('./log_error');
var owaValidator = require('./owa_validator');
var withConfig = require('../lib/config').withConfig;
var log;

withConfig(function(config) {
  log = require('../lib/logging')(config);

  module.exports = function(manifestUrl, manifestOverride, loader,
    appBuildDir, cb) {
    var manifestFilename;
    if (/^\w+:\/\//.test(manifestUrl)) {
      manifestFilename = '';
    } else {
      manifestFilename = path.basename(manifestUrl);
    }
    loader.load(manifestFilename, function(err, string) {
      if (err) {
        logError(log, "OWA Cannot load manifest: " + manifestFilename, err);
        return cb(err);
      }
      try {
        var manifest = JSON.parse(fileLoader.stripBom(string)),
          appType,
          zipFileLocation;

        if (false === owaValidator(manifest)) {
          return cb(new Error('invalid manifest'));
        }

        if ( !! manifest.package_path) {
          appType = "packaged";
        } else {
          appType = "hosted";
        }

        if (appType === "hosted") {
          return cb(null, manifest, appType, zipFileLocation, undefined);
        } else {
          var packagePath = url.resolve(manifestUrl, manifest.package_path);
          log.info('Package app detected, downloading ' + packagePath);
          request({
            encoding: null,
            method: "GET",
            url: packagePath
          }, function(err, res, body) {
            var zip;
            if (err) {
              logError(log, "OWA Error downloading package " + packagePath, err);
              return cb(err);
            } else {
              log.info('Package app finished downloading ' + packagePath);
              zip = new Buffer(body, 'binary').toString('base64');
            }
            cb(null, manifest, appType, zip);
          });
        }
      } catch (e) {
        logError(log, "OWA Error downloading " + manifestUrl, e);
        cb(e);
      }
    });
  };
});
