/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');

var androidifier = require('./manifest_androidifier');
var generator = require('./generator_client');
var s3;

var log;

module.exports = function(appData, config, cb) {
  if (undefined === log) {
    log = require('../lib/logging')(config);
  }
  var loaderDirname;
  var manifestUrl = appData.manifestUrl;
  if (/^\w+:\/\//.test(manifestUrl)) {
    loaderDirname = manifestUrl;
  } else {
    loaderDirname = path.resolve(process.cwd(), manifestUrl);
  }

  var ourApkVersion = Math.floor(new Date().getTime() / 1000) + '';
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
  generator(config, manifestParams, appData.packageZip, loaderDirname, log,
            function genCb(err/*, s3PublicUrl*/) {
              if (err) {
                cb(err);
              } else {
                var s3key = androidifier.packageName(manifestUrl) + '.apk';
                if(undefined === s3) {
                  s3 = require('./s3');
                }
                s3.getApk(s3key, cb);           
              }
            });
};