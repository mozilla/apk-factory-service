/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var url = require('url');

var request = require('request');

var generator = require('./generator_client');

module.exports = function(appData, config, cb) {
  var loaderDirname;
  var manifestUrl = appData.manifestUrl;
  if (/^\w+:\/\//.test(manifestUrl)) {
    loaderDirname = url.resolve(manifestUrl, ".");
  } else {
    loaderDirname = path.resolve(process.cwd(), manifestUrl);
  }

  var ourApkVersion = new Date().getTime() + '';
  var appType = !! appData.manifest.package_path ? 'packaged' : 'hosted';

  // TODO audit appType
  var manifestParams = {
    url: manifestUrl,
    appType: appType,
    ourVersion: ourApkVersion,
    data: appData.manifest,
    noCache: true
  };
  // TODO  we need to control where apks are built on the filesystem
  generator(config, manifestParams, appData.packageZip, loaderDirname, genCb);
  function genCb(err, apkFilepath) {
    if (err) {
      cb(err);
    } else {
      request(apkFilepath, {encoding: null}, cb);
    }
  }
};