/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore');
var path = require('path');

var fs = require('fs.extra');

var fsUtil = require('./fs_util');
var log = require('../lib/logging').logger;

function ApkGenerator (buildDir, keysDir, forceRebuild, debug) {
  this.buildDir = buildDir || process.env.TMPDIR;
  this.keysDir = keysDir;
  this.forceRebuild = forceRebuild;
  this.debug = debug;
}

_.extend(ApkGenerator.prototype, {
  generate: function(manifest, projectBuilder, zipFileLocation, loader, cb) {

    var self = this;

    projectBuilder.create(manifest, loader, onCreate);

    function onCreate (androidManifestProperties) {
      log.info("Building " + androidManifestProperties.packageName + "-" +
        androidManifestProperties.version + ".apk (" +
        androidManifestProperties.versionCode + ") from " + manifest.url);

      if (zipFileLocation) {
        var rawDir = path.join(projectBuilder.dest, "res/raw");
        var newZipFileLocation = path.join(rawDir, "application.zip");
        fsUtil.ensureDirectoryExistsFor(newZipFileLocation);
        fs.renameSync(zipFileLocation, newZipFileLocation);
        fs.writeFileSync(path.join(rawDir, "mini.json"),
                         JSON.stringify(manifest.mini));
      }

      fs.mkdirRecursiveSync(self.keysDir);
      projectBuilder.build(self.keysDir, function(err, apkLoc) {
        if (cb) {
          cb(err, apkLoc);
        }
      });
    }
  }
});

module.exports = {
  ApkGenerator: ApkGenerator
};