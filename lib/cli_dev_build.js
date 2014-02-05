/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var url = require('url');

var fs = require('fs.extra');

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
  //AOK remove this? fs.mkdirRecursiveSync(appBuildDir);

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
      console.log('AOK streaming back ', apkFilepath);
      fs.readFile(apkFilepath, {encoding: 'binary'}, function(err, apkData) {
        if (err) {
          cb(err);
        } else {
          cb(null, apkData);
          // /tmp/build/<random>/org.mozilla.p119691c0b6de/bin/FbImport-release.apk
          assertAndroidBuildDir(apkFilepath);
          var buildDir = path.dirname(path.dirname(path.dirname(apkFilepath)));
          fs.rmrf(buildDir, function(err) {
            if(err) {
              console.error('Unable to cleanup build dir [' + apkFilepath + ']');
              console.error(err);
            }
          });
        }
      });
    }
  }
};

function assertAndroidBuildDir(apkFilepath) {
  var parts = apkFilepath.split('/');
  var apk = parts[parts.length - 1];
  var bin = parts[parts.length - 2];
  if (apk.substring(apk.length - '.apk'.length) !== '.apk' ||
      'bin' !== bin) {
    throw new Error('Assertion failed, unexpected build directory ' + apkFilepath);
  }
}