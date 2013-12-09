/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore');
var path = require('path');

var fs = require('fs.extra');

var fsUtil = require('./fs_util');

function ApkGenerator (buildDir, keysDir, forceRebuild, debug) {
  this.buildDir = buildDir || process.env.TMPDIR;
  this.keysDir = keysDir;
  this.forceRebuild = forceRebuild;
  this.debug = debug;
}

_.extend(ApkGenerator.prototype, {

  /**
   * TODO: What does a generator do, that a builder doesn't?
   * How much of this could/should move into the front_controller?
   */
  generate: function (manifestUrl, appType, projectBuilder, manifest, miniManifest, zipFileLocation, cb) {

    var self = this;

    projectBuilder.create(manifestUrl, manifest, appType, onCreate);

    function onCreate (androidManifestProperties) {
      console.log("Building " + androidManifestProperties.packageName + "-" + androidManifestProperties.version + ".apk (" + androidManifestProperties.versionCode + ") from " + manifestUrl);

      if (zipFileLocation) {
        var rawDir = path.join(projectBuilder.dest, "res/raw");
        var newZipFileLocation = path.join(rawDir, "application.zip");
        fsUtil.ensureDirectoryExistsFor(newZipFileLocation);
        fs.renameSync(zipFileLocation, newZipFileLocation);

        fs.writeFileSync(path.join(rawDir, "mini.json"), JSON.stringify(miniManifest));
      }
      fs.mkdirRecursiveSync(self.keysDir);
      projectBuilder.build(self.keysDir, function (err, apkLoc) {
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