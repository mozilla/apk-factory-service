/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var crypto = require('crypto');
var path = require('path');
var url = require('url');

var _ = require('underscore');
var request = require('request');

var fileLoader = require('./file_loader');

/**
 * Given a manifest url calls back with the hash of the manifest body
 * and optional hash of the zip file of the packaged app.
 */
module.exports = function(manifestUrl, cb) {
  // TODO: duplicate code with front_controller
  var dirname;

  if (/^\w+:\/\//.test(manifestUrl)) {
    dirname = url.resolve(manifestUrl, ".");
  } else {
    dirname = path.dirname(path.resolve(process.cwd(), manifestUrl));
  }
  var loader = fileLoader.create(dirname);

  // TODO: duplicate code with owa_downloader
  var manifestFilename;
  if (/^\w+:\/\//.test(manifestUrl)) {
    manifestFilename = _(url.parse(manifestUrl).pathname.split("/")).last();
  } else {
    manifestFilename = path.basename(manifestUrl);
  }
  loader.load(manifestFilename, function(err, body) {
    if (err) {
      console.error("Cannot load manifest: " + err);
      return cb(err);
    }
    var manifestHash = sha1(body);
    try {
      //TODO rename
      var manifest = JSON.parse(fileLoader.stripBom(body));
      if (!!manifest.package_path) {
        var packagePath = url.resolve(manifestUrl, manifest.package_path);
        request(packagePath, function(error, response, body) {
          if (!error && response.statusCode === 200) {
            cb(null, manifestHash, sha1(body));
          } else {
            cb(error);
          }
        });
      } else {
        cb(null, manifestHash, null);
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

function sha1(text) {
  var sha = crypto.createHash('sha1');
  sha.update(text);
  return sha.digest('hex');
}